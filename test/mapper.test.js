import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSession, mask, unmask, placeholderFor, hasPlaceholder } from '../src/core/mapper.js';
import { scan } from '../src/core/scanner.js';
import { synthThaiID, formatThaiID, rng } from './fixtures/generate.js';

test('spec round-trip example', () => {
  const id = formatThaiID(synthThaiID(rng(41)));
  const input = `ลูกค้าชื่อนายสมชาย ใจดี เลข ${id} โทร 0812345678`;
  const session = createSession(1);
  const { masked } = mask(input, scan(input), session);
  assert.equal(masked, 'ลูกค้าชื่อ[บุคคล_1] เลข [บัตรปชช_1] โทร [เบอร์_1]');
  const reply = 'แนะนำให้ติดต่อ[บุคคล_1] ที่ [เบอร์_1] เพื่อยืนยัน [บัตรปชช_1]';
  assert.equal(unmask(reply, session), `แนะนำให้ติดต่อนายสมชาย ใจดี ที่ 0812345678 เพื่อยืนยัน ${id}`);
});

test('same value gets same placeholder, different values increment', () => {
  const session = createSession(1);
  const a = placeholderFor({ type: 'thai_phone', value: '0812345678' }, session);
  const b = placeholderFor({ type: 'thai_phone', value: '081-234-5678' }, session);
  const c = placeholderFor({ type: 'thai_phone', value: '0898765432' }, session);
  assert.equal(a, '[เบอร์_1]');
  assert.equal(b, '[เบอร์_1]');
  assert.equal(c, '[เบอร์_2]');
  assert.equal(placeholderFor({ type: 'email', value: 'a@b.co' }, session), '[อีเมล_1]');
});

test('placeholders persist across multiple mask calls in one session', () => {
  const session = createSession(1);
  const t1 = 'โทร 0812345678';
  const t2 = 'เบอร์เดิม 0812345678 และใหม่ 0898765432';
  mask(t1, scan(t1), session);
  const { masked } = mask(t2, scan(t2), session);
  assert.equal(masked, 'เบอร์เดิม [เบอร์_1] และใหม่ [เบอร์_2]');
});

test('unmask tolerates spacing and bracket variants from the model', () => {
  const session = createSession(1);
  placeholderFor({ type: 'thai_name', value: 'นายสมชาย ใจดี' }, session);
  for (const v of ['[บุคคล_1]', '[ บุคคล_1 ]', '[บุคคล 1]', '[บุคคล-1]', '【บุคคล_1】', '[บุคคล _ 1]', '[บุคคล\\_1]', '\\[บุคคล\\_1\\]']) {
    assert.equal(unmask(`ถึง ${v} ครับ`, session), 'ถึง นายสมชาย ใจดี ครับ', v);
  }
});

test('unmask leaves unknown placeholders and plain text untouched', () => {
  const session = createSession(1);
  placeholderFor({ type: 'email', value: 'a@b.co' }, session);
  assert.equal(unmask('[อีเมล_9] และ [บุคคล_1] ไม่รู้จัก', session), '[อีเมล_9] และ [บุคคล_1] ไม่รู้จัก');
  assert.equal(unmask('ไม่มีอะไร', session), 'ไม่มีอะไร');
});

test('mask skips overlapping findings and preserves surrounding text exactly', () => {
  const session = createSession(1);
  const text = 'ab 0812345678 cd';
  const { masked, applied } = mask(text, [
    { type: 'thai_phone', value: '0812345678', start: 3, end: 13, confidence: 1 },
    { type: 'bank_account', value: '0812345678', start: 3, end: 13, confidence: 0.6 }
  ], session);
  assert.equal(masked, 'ab [เบอร์_1] cd');
  assert.equal(applied.length, 1);
});

test('hasPlaceholder', () => {
  assert.equal(hasPlaceholder('x [ที่อยู่_2] y'), true);
  assert.equal(hasPlaceholder('x [foo_2] y'), false);
});
