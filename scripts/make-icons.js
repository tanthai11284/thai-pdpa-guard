import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, renameSync, mkdtempSync, rmSync, writeFileSync, copyFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PROFILE = mkdtempSync(join(tmpdir(), 'tpg-chrome-'));
process.on('exit', () => rmSync(PROFILE, { recursive: true, force: true }));
const STORE = join(ROOT, 'store');
const ASSETS = join(ROOT, 'assets');
const SIZES = [16, 32, 48, 128];

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

const MIN_WINDOW = 512;

function shoot(htmlFile, width, height, out, transparent, upscale = false) {
  const scale = upscale ? Math.max(1, MIN_WINDOW / Math.min(width, height)) : 1;
  const args = [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
    `--user-data-dir=${PROFILE}`, '--virtual-time-budget=3000',
    `--window-size=${Math.round(width * scale)},${Math.round(height * scale)}`,
    `--force-device-scale-factor=${1 / scale}`, `--screenshot=${out}`
  ];
  if (transparent) args.push('--default-background-color=00000000');
  args.push(pathToFileURL(htmlFile).href);
  const r = spawnSync(CHROME, args, { encoding: 'utf8', timeout: 60000 });
  if (r.status !== 0 || !existsSync(out)) {
    console.error(`failed: ${out}\n${r.stderr}`);
    process.exit(1);
  }
  console.log(out.slice(ROOT.length + 1));
}

const fromIdx = process.argv.indexOf('--from');
const source = fromIdx > -1 ? resolve(process.argv[fromIdx + 1]) : join(STORE, 'icon.svg');
if (!existsSync(source)) {
  console.error(`source not found: ${source}`);
  process.exit(1);
}
const frame = join(STORE, 'icon-frame.html');
writeFileSync(frame, `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:transparent}img{display:block;width:100vw;height:100vh;object-fit:contain}</style></head><body><img src="${pathToFileURL(source).href}" alt=""></body></html>`);

mkdirSync(ASSETS, { recursive: true });
for (const s of SIZES) {
  const tmp = join(STORE, `icon-${s}.tmp.png`);
  shoot(frame, s, s, tmp, true, true);
  renameSync(tmp, join(ASSETS, `icon-${s}.png`));
}
if (source.endsWith('.svg')) copyFileSync(source, join(STORE, 'icon.svg'));
shoot(join(STORE, 'promo-440x280.html'), 440, 280, join(STORE, 'promo-440x280.png'), false);
