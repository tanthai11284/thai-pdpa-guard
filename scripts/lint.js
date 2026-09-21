import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHIP_DIRS = ['src', 'popup', 'options'];
const SHIP_FILES = ['sw.js'];
const FORBIDDEN = [
  /\bfetch\s*\(/,
  /\bXMLHttpRequest\b/,
  /\bsendBeacon\b/,
  /\bWebSocket\b/,
  /\bnavigator\.sendBeacon\b/,
  /\beval\s*\(/,
  /new\s+Function\s*\(/
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (extname(p) === '.js') out.push(p);
  }
  return out;
}

const files = [
  ...SHIP_FILES.map((f) => join(ROOT, f)),
  ...SHIP_DIRS.flatMap((d) => walk(join(ROOT, d)))
];

let failed = false;

for (const file of files) {
  const rel = file.slice(ROOT.length + 1);
  const src = readFileSync(file, 'utf8');
  for (const re of FORBIDDEN) {
    const m = src.match(re);
    if (m) {
      console.error(`FORBIDDEN ${rel}: ${m[0]}`);
      failed = true;
    }
  }
  const check = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (check.status !== 0) {
    console.error(`SYNTAX ${rel}:\n${check.stderr}`);
    failed = true;
  }
}

const manifest = JSON.parse(readFileSync(join(ROOT, 'manifest.json'), 'utf8'));
const hosts = [...(manifest.host_permissions ?? []), ...(manifest.optional_host_permissions ?? [])];
for (const h of manifest.host_permissions ?? []) {
  if (h === '<all_urls>' || /^\*:\/\/\*\/\*$/.test(h)) {
    console.error(`FORBIDDEN manifest.json host_permissions: ${h}`);
    failed = true;
  }
}
if (manifest.manifest_version !== 3) {
  console.error('manifest_version must be 3');
  failed = true;
}

console.log(`checked ${files.length} files, ${hosts.length} host patterns`);
process.exit(failed ? 1 : 0);
