import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync, copyFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const STORE = join(ROOT, 'store');
const ASSETS = join(ROOT, 'assets');
const SIZES = [16, 32, 48, 128];
const PROFILE = mkdtempSync(join(tmpdir(), 'tpg-chrome-'));
process.on('exit', () => rmSync(PROFILE, { recursive: true, force: true }));

const CHROME = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome'
].find((p) => p && existsSync(p));

if (!CHROME) {
  console.error('Chrome not found. Set CHROME_PATH.');
  process.exit(1);
}

const BASE_ARGS = [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
  `--user-data-dir=${PROFILE}`, '--virtual-time-budget=5000', '--allow-file-access-from-files'
];

function run(extra) {
  const r = spawnSync(CHROME, [...BASE_ARGS, ...extra], { encoding: 'utf8', timeout: 60000, maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) {
    console.error(r.stderr);
    process.exit(1);
  }
  return r.stdout;
}

const fromIdx = process.argv.indexOf('--from');
const source = fromIdx > -1 ? resolve(process.argv[fromIdx + 1]) : join(STORE, 'icon.svg');
if (!existsSync(source)) {
  console.error(`source not found: ${source}`);
  process.exit(1);
}

const frame = join(STORE, 'icon-frame.html');
writeFileSync(frame, `<!doctype html><html><head><meta charset="utf-8"></head><body><script>
const img = new Image();
img.onload = () => {
  for (const s of ${JSON.stringify(SIZES)}) {
    const c = document.createElement('canvas');
    c.width = s; c.height = s;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, s, s);
    const el = document.createElement('pre');
    el.id = 'icon-' + s;
    el.textContent = c.toDataURL('image/png');
    document.body.appendChild(el);
  }
};
img.src = ${JSON.stringify(pathToFileURL(source).href)};
</script></body></html>`);

const dom = run(['--dump-dom', pathToFileURL(frame).href]);
mkdirSync(ASSETS, { recursive: true });
for (const s of SIZES) {
  const m = dom.match(new RegExp(`<pre id="icon-${s}">data:image/png;base64,([^<]+)</pre>`));
  if (!m) {
    console.error(`no output for size ${s}`);
    process.exit(1);
  }
  const out = join(ASSETS, `icon-${s}.png`);
  writeFileSync(out, Buffer.from(m[1], 'base64'));
  console.log(out.slice(ROOT.length + 1));
}
if (source.endsWith('.svg')) copyFileSync(source, join(STORE, 'icon.svg'));

const promo = join(STORE, 'promo-440x280.png');
run(['--window-size=440,280', `--screenshot=${promo}`, pathToFileURL(join(STORE, 'promo-440x280.html')).href]);
console.log(promo.slice(ROOT.length + 1));
