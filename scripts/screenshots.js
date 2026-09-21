import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'store', 'screenshots');
const W = 1280;
const H = 800;
const PROFILE = mkdtempSync(join(tmpdir(), 'tpg-chrome-'));
process.on('exit', () => rmSync(PROFILE, { recursive: true, force: true }));

const CHROME = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome'
].find((p) => p && existsSync(p));

const inputs = process.argv.slice(2).map((p) => resolve(p));
if (!CHROME || !inputs.length) {
  console.error('usage: node scripts/screenshots.js <image> [<image> ...]   (needs Chrome)');
  process.exit(1);
}

const frame = join(PROFILE, 'frame.html');
writeFileSync(frame, `<!doctype html><html><head><meta charset="utf-8"></head><body><script>
const files = ${JSON.stringify(inputs.map((p) => pathToFileURL(p).href))};
let done = 0;
files.forEach((src, i) => {
  const img = new Image();
  img.onload = () => {
    const c = document.createElement('canvas');
    c.width = ${W}; c.height = ${H};
    const ctx = c.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    const scale = Math.max(${W} / img.width, ${H} / img.height);
    const sw = ${W} / scale, sh = ${H} / scale;
    const sx = (img.width - sw) / 2, sy = (img.height - sh) / 2;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, ${W}, ${H});
    const el = document.createElement('pre');
    el.id = 'out-' + i;
    el.textContent = c.toDataURL('image/png');
    document.body.appendChild(el);
  };
  img.src = src;
});
</script></body></html>`);

const r = spawnSync(CHROME, [
  '--headless=new', '--disable-gpu', '--no-first-run', `--user-data-dir=${PROFILE}`,
  '--virtual-time-budget=10000', '--allow-file-access-from-files', '--dump-dom', pathToFileURL(frame).href
], { encoding: 'utf8', timeout: 120000, maxBuffer: 256 * 1024 * 1024 });
if (r.status !== 0) { console.error(r.stderr); process.exit(1); }

mkdirSync(OUT_DIR, { recursive: true });
inputs.forEach((src, i) => {
  const m = r.stdout.match(new RegExp(`<pre id="out-${i}">data:image/png;base64,([^<]+)</pre>`));
  if (!m) { console.error(`no output for ${basename(src)}`); process.exit(1); }
  const out = join(OUT_DIR, `screenshot-${i + 1}.png`);
  writeFileSync(out, Buffer.from(m[1], 'base64'));
  console.log(`${basename(src)} -> ${out.slice(ROOT.length + 1)}`);
});
