const WEIGHTS = [13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];

export function rng(seed = 20260921) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const int = (r, min, max) => min + Math.floor(r() * (max - min + 1));
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
const digits = (r, n, first) => {
  let s = first ?? String(int(r, 1, 9));
  while (s.length < n) s += String(int(r, 0, 9));
  return s;
};

export function synthThaiID(r = Math.random) {
  let p;
  do { p = digits(r, 12); } while (p[0] === '0' || /^(\d)\1{11}$/.test(p));
  const sum = WEIGHTS.reduce((a, w, i) => a + Number(p[i]) * w, 0);
  return p + String((11 - (sum % 11)) % 10);
}

export function formatThaiID(id) {
  return `${id[0]}-${id.slice(1, 5)}-${id.slice(5, 10)}-${id.slice(10, 12)}-${id[12]}`;
}

export function invalidThaiID(r = Math.random) {
  const id = synthThaiID(r);
  const last = (Number(id[12]) + int(r, 1, 9)) % 10;
  return id.slice(0, 12) + String(last);
}

export function synthMobile(r = Math.random, fmt = 'plain') {
  const d = '0' + pick(r, ['6', '8', '9']) + digits(r, 8, '');
  if (fmt === 'dash') return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  if (fmt === 'space') return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  if (fmt === 'intl') return `+66${d.slice(1)}`;
  return d;
}

export function synthLandline(r = Math.random) {
  return '02' + digits(r, 7, '');
}

export function synthEmail(r = Math.random) {
  const users = ['somchai', 'wipa.k', 'nattapong_88', 'kanya+work', 'test.user'];
  const domains = ['example.com', 'example.co.th', 'mail.example.org', 'corp-example.net'];
  return `${pick(r, users)}${int(r, 1, 999)}@${pick(r, domains)}`;
}

function luhnCheck(partial) {
  let sum = 0;
  let dbl = true;
  for (let i = partial.length - 1; i >= 0; i--) {
    let n = Number(partial[i]);
    if (dbl) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
    dbl = !dbl;
  }
  return String((10 - (sum % 10)) % 10);
}

export function synthCard(r = Math.random, grouped = true) {
  const prefix = pick(r, ['4', '51', '55', '2221', '4', '4']);
  const body = digits(r, 15 - prefix.length, '');
  const d = prefix + body + luhnCheck(prefix + body);
  return grouped ? d.match(/.{4}/g).join(' ') : d;
}

export function synthBankAccount(r = Math.random, fmt = 'plain') {
  const d = digits(r, 10);
  if (/^0[689]/.test(d)) return synthBankAccount(r, fmt);
  return fmt === 'dash' ? `${d.slice(0, 3)}-${d[3]}-${d.slice(4, 9)}-${d[9]}` : d;
}

export function synthPassport(r = Math.random) {
  return pick(r, ['AA', 'AB', 'AC', 'A', 'M', 'N']) + digits(r, 7, '');
}

const FIRST = ['สมชาย', 'สมศรี', 'วิภา', 'ณัฐพงษ์', 'กัญญา', 'ธนกร', 'พิมพ์ชนก', 'อนุชา', 'ศิริพร', 'วรรณา', 'ประสิทธิ์', 'จิราพร', 'เอกชัย', 'สุดารัตน์', 'ภาณุ'];
const LAST = ['ใจดี', 'รักดี', 'สุขใจ', 'ศรีสุวรรณ', 'แสงทอง', 'บุญมา', 'พงษ์พันธ์', 'จันทร์เพ็ญ', 'สุขสวัสดิ์', 'วงศ์ใหญ่', 'ทองดี', 'เจริญสุข'];
const TITLES = ['นาย', 'นาง', 'นางสาว', 'น.ส.', 'ด.ช.', 'ด.ญ.'];

export function synthName(r = Math.random, withSurname = true) {
  const t = pick(r, TITLES);
  const f = pick(r, FIRST);
  return withSurname ? `${t}${f} ${pick(r, LAST)}` : `${t}${f}`;
}

const SUBS = ['บางรัก', 'คลองตัน', 'สุเทพ', 'บางพลี', 'ในเมือง', 'ท่าศาลา', 'หนองปรือ', 'ศาลายา'];
const DISTS = ['เมือง', 'ศรีราชา', 'หาดใหญ่', 'ปากเกร็ด', 'บางละมุง', 'สันทราย', 'บางพลี'];
const PROVS = ['ชลบุรี', 'เชียงใหม่', 'สงขลา', 'นนทบุรี', 'ขอนแก่น', 'ภูเก็ต', 'นครราชสีมา', 'สมุทรปราการ'];
const ROADS = ['สุขุมวิท', 'พหลโยธิน', 'รัชดาภิเษก', 'เพชรเกษม', 'ลาดพร้าว', 'มิตรภาพ'];

export function synthAddress(r = Math.random) {
  const forms = [
    () => `${int(r, 1, 999)}/${int(r, 1, 99)} หมู่ ${int(r, 1, 15)} ต.${pick(r, SUBS)} อ.${pick(r, DISTS)} จ.${pick(r, PROVS)} ${int(r, 10, 96)}${digits(r, 3, '')}`,
    () => `${int(r, 1, 999)} ซอย${pick(r, ROADS)} ${int(r, 1, 100)} ถนน${pick(r, ROADS)} แขวง${pick(r, SUBS)} เขต${pick(r, DISTS)} กรุงเทพฯ ${int(r, 10, 10)}${digits(r, 3, '')}`,
    () => `เลขที่ ${int(r, 1, 999)} ตำบล${pick(r, SUBS)} อำเภอ${pick(r, DISTS)} จังหวัด${pick(r, PROVS)}`,
    () => `${int(r, 1, 999)} ม.${int(r, 1, 12)} ต.${pick(r, SUBS)} อ.${pick(r, DISTS)} ${pick(r, PROVS)} ${int(r, 10, 96)}${digits(r, 3, '')}`
  ];
  return pick(r, forms)();
}

const ID_CTX = ['เลขบัตรประชาชน', 'เลขประจำตัวประชาชน', 'บัตรประชาชนเลขที่', 'เลขผู้เสียภาษี', 'ID card', 'Tax ID', 'เลข 13 หลัก'];
const FILLER = [
  'ช่วยสรุปข้อมูลลูกค้าให้หน่อย', 'รบกวนตรวจสอบรายละเอียดด้านล่าง', 'ขอให้เขียนอีเมลถึงลูกค้ารายนี้',
  'ข้อมูลจากฟอร์มสมัครสมาชิก', 'กรุณาแปลข้อความต่อไปนี้', 'ตรวจคำผิดให้หน่อยครับ', 'ร่างสัญญาสำหรับลูกค้า'
];

export function positiveThaiIdCorpus(n, r = rng(1)) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const id = synthThaiID(r);
    const variant = i % 4;
    let text;
    if (variant === 0) text = `${pick(r, FILLER)} ${pick(r, ID_CTX)} ${formatThaiID(id)}`;
    else if (variant === 1) text = `${pick(r, FILLER)} ${pick(r, ID_CTX)} ${id}`;
    else if (variant === 2) text = `${pick(r, FILLER)} ${formatThaiID(id)} ${pick(r, FILLER)}`;
    else text = `${pick(r, FILLER)} เลขที่บัตร ${id} ชื่อ ${synthName(r)}`;
    out.push({ text, id, variant });
  }
  return out;
}

const NEG_TEMPLATES = [
  (r) => `เลขที่ใบสั่งซื้อ ${digits(r, 13)} ยอดรวม ${int(r, 100, 99999)} บาท`,
  (r) => `Order #${digits(r, 13)} shipped`,
  (r) => `เลขพัสดุ ${digits(r, 13)} Kerry`,
  (r) => `tracking number ${digits(r, 13)}`,
  (r) => `Invoice INV-${digits(r, 13)}`,
  (r) => `บาร์โค้ด ${digits(r, 13)}`,
  (r) => `ref: ${digits(r, 13)} transaction`,
  (r) => `เวอร์ชัน ${int(r, 1, 9)}.${int(r, 0, 20)}.${int(r, 0, 9)}.${int(r, 0, 9)}.${int(r, 0, 9)}`,
  (r) => `ปี ${int(r, 2500, 2600)} ราคา ${int(r, 1000, 999999)} บาท จำนวน ${int(r, 1, 500)} ชิ้น`,
  (r) => `${'1'.repeat(13)} และ ${'0'.repeat(13)}`,
  (r) => `นัดประชุมวันที่ ${int(r, 1, 28)}/${int(r, 1, 12)}/${int(r, 2560, 2570)} เวลา ${int(r, 8, 18)}:00`,
  (r) => `ค่าไฟเดือนนี้ ${int(r, 500, 5000)} บาท ค่าน้ำ ${int(r, 100, 500)}`,
  (r) => `รหัสสินค้า SKU-${digits(r, 8)} มีสต็อก ${int(r, 0, 999)} ชิ้น`,
  (r) => `ยอดขาย Q${int(r, 1, 4)} เพิ่มขึ้น ${int(r, 1, 99)}% จากปีก่อน`,
  (r) => `ลงทะเบียนเรียน ม.${int(r, 1, 6)} เทอม ${int(r, 1, 2)} ปีการศึกษา ${int(r, 2560, 2570)}`,
  (r) => `รถ ${int(r, 1, 9)} คัน คน ${int(r, 1, 9)} คน ไปเลย รวม ${int(r, 10, 99)} บาท`,
  (r) => `เจ้านายสั่งให้ทำรายงาน นางฟ้าในนิยาย นายอำเภอมาตรวจ`,
  (r) => `บทที่ ${int(r, 1, 20)} ตอนที่ ${int(r, 1, 50)} หน้า ${int(r, 1, 300)}`,
  (r) => `${int(r, 100000, 999999)} views และ ${int(r, 1000, 99999)} likes`,
  (r) => `พิกัด ${(13 + r()).toFixed(6)}, ${(100 + r()).toFixed(6)}`,
  (r) => `serial S/N ${digits(r, 12)} รับประกัน ${int(r, 1, 5)} ปี`,
  (r) => `ขนาด ${int(r, 10, 99)}x${int(r, 10, 99)}x${int(r, 10, 99)} ซม. น้ำหนัก ${int(r, 1, 50)} กก.`,
  (r) => `โค้ดส่วนลด SAVE${int(r, 10, 90)} ใช้ได้ถึง ${int(r, 1, 28)} ธ.ค.`,
  (r) => `อุณหภูมิ ${int(r, 20, 40)} องศา ความชื้น ${int(r, 40, 99)}%`,
  (r) => `ขอสูตร Excel สำหรับคำนวณ VAT 7% จากยอด ${int(r, 1000, 99999)}`,
  (r) => `ช่วยเขียน function ที่รับ array แล้ว return ผลรวม`
];

export function negativeCorpus(n, r = rng(2)) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(NEG_TEMPLATES[i % NEG_TEMPLATES.length](r));
  return out;
}

export function longThaiText(r = rng(3), length = 5000) {
  const parts = [];
  let len = 0;
  while (len < length) {
    const p = pick(r, [
      ...FILLER,
      'บริษัทได้ดำเนินการตามนโยบายคุ้มครองข้อมูลส่วนบุคคลอย่างเคร่งครัด',
      'ลูกค้าสามารถติดต่อฝ่ายบริการได้ทุกวันในเวลาทำการ',
      `ยอดรวม ${int(r, 100, 99999)} บาท`,
      `${synthName(r)} โทร ${synthMobile(r)}`,
      `อีเมล ${synthEmail(r)}`,
      `ที่อยู่ ${synthAddress(r)}`,
      `เลขบัตรประชาชน ${formatThaiID(synthThaiID(r))}`
    ]);
    parts.push(p);
    len += p.length + 1;
  }
  return parts.join(' ').slice(0, length);
}
