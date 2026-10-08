import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSession, mask, unmask, unmaskAcross, placeholderFor, hasPlaceholder, withMaskNote, stripMaskNote } from '../src/core/mapper.js';
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

test('unmask handles placeholders without brackets (Gemini drops them)', () => {
  const session = createSession(1);
  placeholderFor({ type: 'thai_name', value: 'นายสมชาย ใจดี' }, session);
  placeholderFor({ type: 'thai_phone', value: '0812345678' }, session);
  assert.equal(unmask('ชื่อ: บุคคล_1', session), 'ชื่อ: นายสมชาย ใจดี');
  assert.equal(unmask('ติดต่อบุคคล_1 ที่เบอร์_1', session), 'ติดต่อนายสมชาย ใจดี ที่0812345678');
  assert.equal(unmask('ชื่อ: บุคคล\_1', session), 'ชื่อ: นายสมชาย ใจดี');
  assert.equal(unmask('[บุคคล_1] และ บุคคล_1', session), 'นายสมชาย ใจดี และ นายสมชาย ใจดี');
  assert.equal(hasPlaceholder('ชื่อ: บุคคล_1'), true);
});

test('bare unmask leaves unknown keys, longer numbers and plain words alone', () => {
  const session = createSession(1);
  placeholderFor({ type: 'thai_name', value: 'นายสมชาย ใจดี' }, session);
  for (const t of ['บุคคล_2', 'บุคคล_10', 'บุคคล 1', 'บุคคลทั่วไป', 'อีเมล_1', 'snake_case_1']) {
    assert.equal(unmask(t, session), t, t);
  }
});

test('unmaskAcross joins placeholders split over streamed word spans (ChatGPT)', () => {
  const session = createSession(1);
  placeholderFor({ type: 'thai_name', value: 'นายสมชาย ใจดี' }, session);
  placeholderFor({ type: 'thai_phone', value: '0812345678' }, session);
  assert.deepEqual(unmaskAcross(['[บุคคล', '_', '1]'], session), ['นายสมชาย ใจดี', '', '']);
  assert.deepEqual(unmaskAcross(['ให้ ', '[บุคคล', '_', '1]', ' แล้ว'], session), ['ให้ ', 'นายสมชาย ใจดี', '', '', ' แล้ว']);
  assert.deepEqual(unmaskAcross(['ก [บุ', 'คคล_1] ข [เบอร์_1] ค'], session), ['ก นายสมชาย ใจดี', ' ข 0812345678 ค']);
  assert.deepEqual(unmaskAcross(['บุคคล', '_1 และ ', 'เบอร์_', '1'], session), ['นายสมชาย ใจดี', ' และ ', '0812345678', '']);
  assert.deepEqual(unmaskAcross(['', '[บุคคล_1]', ''], session), ['', 'นายสมชาย ใจดี', '']);
});

test('unmaskAcross returns the same array when nothing known is split', () => {
  const session = createSession(1);
  placeholderFor({ type: 'thai_name', value: 'นายสมชาย ใจดี' }, session);
  const v = ['[บุคคล', '_', '2]'];
  assert.equal(unmaskAcross(v, session), v);
  const w = ['ข้อความ', 'ปกติ'];
  assert.equal(unmaskAcross(w, session), w);
  assert.equal(unmaskAcross(v, createSession(2)), v);
});

test('"คุณ" stays outside the name placeholder so the reply does not read "คุณคุณ…"', () => {
  const session = createSession(1);
  const input = 'ส่งถึงคุณสมหญิง รักไทย และนายสมชาย ใจดี';
  const { masked } = mask(input, scan(input), session);
  assert.equal(masked, 'ส่งถึงคุณ[บุคคล_1] และ[บุคคล_2]');
  assert.equal(unmask('เรียน คุณ[บุคคล_1]', session), 'เรียน คุณสมหญิง รักไทย');
});

const NOTE = '(หมายเหตุจาก Thai PDPA Guard: คำในวงเล็บเหลี่ยมคือตัวแทนข้อมูลจริง)';

test('mask note is appended once and stripped again for display', () => {
  const once = withMaskNote('ถึง [บุคคล_1]  ', NOTE);
  assert.equal(once, `ถึง [บุคคล_1]\n\n${NOTE}`);
  assert.equal(withMaskNote(once, NOTE), once);
  assert.equal(stripMaskNote(once, NOTE), 'ถึง [บุคคล_1]');
  assert.equal(stripMaskNote(NOTE.replace(/ /g, '\n'), NOTE), '');
  assert.equal(stripMaskNote('ข้อความปกติ (หมายเหตุ)', NOTE), 'ข้อความปกติ (หมายเหตุ)');
  assert.equal(withMaskNote('x', ''), 'x');
});
