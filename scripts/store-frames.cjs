// ภาพสโตร์แบบมีคำบรรยาย: store/screenshots/*.jpg → store/screenshots-v2/*.jpg (1280x800 JPEG)
// ใช้ store/screenshot-frame.html + Chrome headless + ffmpeg · รัน: node scripts/store-frames.cjs
const fs = require('fs'), { execFileSync } = require('child_process'), os = require('os'), path = require('path');

const SHOTS = [
  { img: '1-detect.jpg', crop: '270,320,810,162', title: 'พิมพ์ปุ๊บ เจอข้อมูลส่วนบุคคลทันที', sub: 'ชื่อ เบอร์โทร อีเมล เลขบัตร — ก่อนกดส่งให้ ChatGPT / Claude / Gemini' },
  { img: '2-list.jpg', crop: '270,178,810,193', title: 'ดูก่อนว่าเจออะไร เลือกปิดบังได้เอง', sub: 'แสดงค่าแบบย่อ ติ๊กเลือกทีละรายการ แล้วกด "ปิดบังที่เลือก"' },
  { img: '3-masked.jpg', crop: '245,380,850,125', title: 'ส่งไป AI เป็นตัวแทน ไม่ใช่ค่าจริง', sub: '[บุคคล_1] [เบอร์_1] [อีเมล_1] — AI ยังเข้าใจบริบทและตอบได้ตามปกติ' },
  { img: '4-unmasked.jpg', crop: '255,105,825,255', title: 'คำตอบกลับมา เห็นค่าจริงบนจอคุณคนเดียว', sub: 'ถอดตัวแทนกลับเป็นค่าจริงอัตโนมัติ ตารางจับคู่อยู่ในเครื่องคุณเท่านั้น' },
  { img: '5-settings.jpg', crop: '295,138,675,472', title: 'เลือกโหมดและประเภทข้อมูลได้เอง', sub: 'แจ้งเตือน / ปิดบังอัตโนมัติ / ปิดปุ่มส่งจนกว่าจะจัดการ (สำหรับองค์กร)' }
];

const STORE = path.join(__dirname, '..', 'store');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = path.join(STORE, 'screenshots-v2');
fs.mkdirSync(OUT, { recursive: true });
const frameUrl = 'file:///' + path.join(STORE, 'screenshot-frame.html').replace(/\\/g, '/');

SHOTS.forEach((s, i) => {
  const P = fs.mkdtempSync(path.join(os.tmpdir(), 'tpg-'));
  const q = new URLSearchParams({ img: 'screenshots/' + s.img, crop: s.crop, step: String(i + 1), title: s.title, sub: s.sub });
  try {
    execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--user-data-dir=' + P, '--allow-file-access-from-files',
      '--hide-scrollbars', '--window-size=1280,800', '--virtual-time-budget=3000', '--screenshot=' + path.join(P, 'o.png'),
      frameUrl + '?' + q], { stdio: 'ignore' });
  } catch (e) { /* Chrome headless คืน exit code ไม่ตรงบางเครื่อง ตรวจจากไฟล์แทน */ }
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', path.join(P, 'o.png'), '-q:v', '2', path.join(OUT, s.img)]);
  fs.rmSync(P, { recursive: true, force: true });
  console.log('ok', s.img);
});
