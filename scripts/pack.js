import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateRawSync } from 'node:zlib';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const INCLUDE = ['manifest.json', 'sw.js', 'src', 'popup', 'options', '_locales', 'assets'];
const manifest = JSON.parse(readFileSync(join(ROOT, 'manifest.json'), 'utf8'));
const OUT_DIR = join(ROOT, 'dist');
const OUT = join(OUT_DIR, `thai-pdpa-guard-${manifest.version}.zip`);

const CRC = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

function walk(p, out = []) {
  const full = join(ROOT, p);
  if (statSync(full).isDirectory()) {
    for (const n of readdirSync(full)) walk(join(p, n), out);
  } else {
    out.push(p);
  }
  return out;
}

const files = INCLUDE.flatMap((p) => walk(p)).sort();
const locals = [];
const centrals = [];
let offset = 0;
const dosTime = 0x0000;
const dosDate = ((2026 - 1980) << 9) | (9 << 5) | 21;

for (const rel of files) {
  const name = Buffer.from(rel.split(sep).join('/'), 'utf8');
  const data = readFileSync(join(ROOT, rel));
  const comp = deflateRawSync(data, { level: 9 });
  const crc = crc32(data);
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0x0800, 6);
  local.writeUInt16LE(8, 8);
  local.writeUInt16LE(dosTime, 10);
  local.writeUInt16LE(dosDate, 12);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(comp.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(name.length, 26);
  local.writeUInt16LE(0, 28);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(0x0800, 8);
  central.writeUInt16LE(8, 10);
  central.writeUInt16LE(dosTime, 12);
  central.writeUInt16LE(dosDate, 14);
  central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(comp.length, 20);
  central.writeUInt32LE(data.length, 24);
  central.writeUInt16LE(name.length, 28);
  central.writeUInt32LE(offset, 42);
  locals.push(local, name, comp);
  centrals.push(central, name);
  offset += local.length + name.length + comp.length;
}

const centralSize = centrals.reduce((a, b) => a + b.length, 0);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(files.length, 8);
end.writeUInt16LE(files.length, 10);
end.writeUInt32LE(centralSize, 12);
end.writeUInt32LE(offset, 16);

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT, Buffer.concat([...locals, ...centrals, end]));
console.log(`${relative(ROOT, OUT)} (${files.length} files, ${(statSync(OUT).size / 1024).toFixed(1)} KB)`);
for (const f of files) console.log('  ' + f.split(sep).join('/'));
