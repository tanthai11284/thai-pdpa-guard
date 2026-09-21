import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chunkText, parseEntities, MAX_CHUNK_CHARS } from '../src/ai/nano.js';

test('chunkText splits long text at whitespace and keeps offsets', () => {
  const words = Array.from({ length: 400 }, (_, i) => `คำ${i}`);
  const text = words.join(' ');
  const chunks = chunkText(text, 500);
  assert.ok(chunks.length > 1);
  let rebuilt = '';
  for (const c of chunks) {
    assert.ok(c.text.length <= 500);
    assert.equal(text.slice(c.offset, c.offset + c.text.length), c.text);
    rebuilt += c.text;
  }
  assert.equal(rebuilt, text);
});

test('chunkText returns single chunk for short text', () => {
  assert.deepEqual(chunkText('สั้น'), [{ text: 'สั้น', offset: 0 }]);
  assert.ok(MAX_CHUNK_CHARS > 500);
});

test('parseEntities verifies substrings exist and drops hallucinations', () => {
  const text = 'ลูกค้า สมชาย ใจดี อยู่ที่ 99 หมู่ 2 ต.บางรัก จ.ชลบุรี ติดต่อ วิภา';
  const raw = JSON.stringify([
    { type: 'name', text: 'สมชาย ใจดี' },
    { type: 'name', text: 'สมหญิง' },
    { type: 'address', text: '99 หมู่ 2 ต.บางรัก จ.ชลบุรี' },
    { type: 'name', text: 'วิภา' },
    { type: 'other', text: 'ลูกค้า' }
  ]);
  const out = parseEntities(raw, text);
  assert.deepEqual(out.map((f) => [f.type, f.value, f.confidence]), [
    ['thai_name', 'สมชาย ใจดี', 0.85],
    ['thai_address', '99 หมู่ 2 ต.บางรัก จ.ชลบุรี', 0.85],
    ['thai_name', 'วิภา', 0.85]
  ]);
  for (const f of out) assert.equal(text.slice(f.start, f.end), f.value);
});

test('parseEntities tolerates code fences and prose around JSON', () => {
  const text = 'ชื่อ สมชาย';
  assert.equal(parseEntities('```json\n[{"type":"name","text":"สมชาย"}]\n```', text).length, 1);
  assert.equal(parseEntities('Here you go: [{"type":"name","text":"สมชาย"}] done', text).length, 1);
});

test('parseEntities returns [] on garbage', () => {
  assert.deepEqual(parseEntities('not json', 'x'), []);
  assert.deepEqual(parseEntities('{"type":"name"}', 'x'), []);
  assert.deepEqual(parseEntities('[1,2,3]', 'x'), []);
});

test('parseEntities finds every occurrence of a repeated value', () => {
  const text = 'สมชาย และ สมชาย';
  const out = parseEntities('[{"type":"name","text":"สมชาย"}]', text);
  assert.equal(out.length, 2);
  assert.deepEqual(out.map((f) => f.start), [0, 10]);
});
