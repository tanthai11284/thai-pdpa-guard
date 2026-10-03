import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'store', 'video', 'build');
const PROFILE = mkdtempSync(join(tmpdir(), 'tpg-cap-'));
process.on('exit', () => rmSync(PROFILE, { recursive: true, force: true }));
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ICON = pathToFileURL(join(ROOT, 'store', 'icon-source.png')).href;

export const CAPTIONS = [
  { id: 'c1', main: 'วางข้อมูลลูกค้าลงแชท AI', sub: 'ระบบเตือนทันทีว่าเจอข้อมูลส่วนบุคคล' },
  { id: 'c2', main: 'ดูได้ว่าเจออะไรบ้าง', sub: 'เลือกปิดบังทีละรายการได้' },
  { id: 'c3', main: 'กดปุ่มเดียว ปิดบังทั้งหมด', sub: 'ชื่อ เบอร์ อีเมล ถูกแทนด้วยตัวแทน' },
  { id: 'c4', main: 'สิ่งที่ส่งถึง AI มีแค่นี้', sub: '[บุคคล_1]  [เบอร์_1]  [อีเมล_1]' },
  { id: 'c5', main: 'แต่บนจอคุณเห็นชื่อจริง', sub: 'ถอดกลับในเครื่อง ไม่ส่งข้อมูลออกไปไหน' },
  { id: 'c6', main: 'ตั้งค่าได้ 3 โหมด', sub: 'แจ้งเตือน · ปิดบังอัตโนมัติ · บล็อกการส่ง' }
];

const FONT = `"Leelawadee UI", "Noto Sans Thai", "Segoe UI", sans-serif`;

function landscape(c) {
  return `<html><head><meta charset="utf-8"><style>
  html,body{margin:0;width:1920px;height:1080px;background:transparent;font-family:${FONT}}
  .bar{position:absolute;left:50%;bottom:56px;transform:translateX(-50%);padding:22px 48px 26px;border-radius:22px;
    background:rgba(10,14,30,.88);border:2px solid rgba(251,191,36,.9);text-align:center;box-shadow:0 10px 40px rgba(0,0,0,.5);white-space:nowrap}
  .m{color:#fff;font-size:58px;font-weight:700;line-height:1.25}
  .s{color:#fbbf24;font-size:38px;font-weight:600;margin-top:6px}
  </style></head><body><div class="bar"><div class="m">${c.main}</div><div class="s">${c.sub}</div></div></body></html>`;
}

function portrait(c) {
  return `<html><head><meta charset="utf-8"><style>
  html,body{margin:0;width:1080px;height:1920px;background:transparent;font-family:${FONT}}
  .t{position:absolute;top:250px;left:60px;right:60px;text-align:center}
  .m{color:#fff;font-size:84px;font-weight:700;line-height:1.25}
  .s{color:#fbbf24;font-size:52px;font-weight:600;margin-top:18px;line-height:1.3}
  </style></head><body><div class="t"><div class="m">${c.main}</div><div class="s">${c.sub}</div></div></body></html>`;
}

function endCard(w, h) {
  const big = w > h;
  return `<html><head><meta charset="utf-8"><style>
  html,body{margin:0;width:${w}px;height:${h}px;font-family:${FONT};
    background:radial-gradient(circle at 50% 40%,#1e3a8a 0%,#0b1020 70%);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
  img{width:${big ? 220 : 300}px;height:${big ? 220 : 300}px}
  h1{font-size:${big ? 96 : 104}px;margin:28px 0 8px}
  p{font-size:${big ? 46 : 52}px;margin:6px 40px;color:#dbeafe;line-height:1.35}
  .tag{margin-top:34px;display:inline-block;padding:12px 34px;border-radius:999px;background:#fbbf24;color:#1e3a8a;font-weight:700;font-size:${big ? 40 : 46}px}
  .by{margin-top:30px;font-size:${big ? 30 : 36}px;color:#93c5fd}
  </style></head><body><img src="${ICON}"><h1>Thai PDPA Guard</h1>
  <p>ปิดบังข้อมูลส่วนบุคคลก่อนส่งให้ AI</p><p>ChatGPT · Claude · Gemini</p>
  <div class="tag">ทำงานในเครื่อง 100% · ฟรี</div><div class="by">Chrome Web Store · TM8 Labs</div></body></html>`;
}

function shoot(html, w, h, out, transparent) {
  const file = join(PROFILE, 'p.html');
  writeFileSync(file, html);
  const args = ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', `--user-data-dir=${PROFILE}`,
    '--allow-file-access-from-files', '--virtual-time-budget=3000', `--window-size=${w},${h}`, `--screenshot=${out}`];
  if (transparent) args.push('--default-background-color=00000000');
  args.push(pathToFileURL(file).href);
  const r = spawnSync(CHROME, args, { encoding: 'utf8', timeout: 60000 });
  if (r.status !== 0 || !existsSync(out)) { console.error(r.stderr); process.exit(1); }
  const b = readFileSync(out);
  console.log(out.slice(ROOT.length + 1), `${b.readUInt32BE(16)}x${b.readUInt32BE(20)}`);
}

mkdirSync(OUT, { recursive: true });
for (const c of CAPTIONS) {
  shoot(landscape(c), 1920, 1080, join(OUT, `${c.id}-h.png`), true);
  shoot(portrait(c), 1080, 1920, join(OUT, `${c.id}-v.png`), true);
}
shoot(endCard(1920, 1080), 1920, 1080, join(OUT, 'end-h.png'), false);
shoot(endCard(1080, 1920), 1080, 1920, join(OUT, 'end-v.png'), false);
