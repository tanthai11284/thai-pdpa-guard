import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isValidThaiID, detect } from '../src/detectors/thai-id.js';
import { synthThaiID, formatThaiID, invalidThaiID, rng } from './fixtures/generate.js';

test('isValidThaiID accepts 200 synthetic IDs', () => {
  const r = rng(11);
  for (let i = 0; i < 200; i++) {
    const id = synthThaiID(r);
    assert.equal(isValidThaiID(id), true, id);
    assert.equal(isValidThaiID(formatThaiID(id)), true, formatThaiID(id));
  }
});

test('isValidThaiID rejects tampered check digit', () => {
  const r = rng(12);
  for (let i = 0; i < 200; i++) {
    const bad = invalidThaiID(r);
    assert.equal(isValidThaiID(bad), false, bad);
  }
});

test('isValidThaiID rejects degenerate inputs', () => {
  for (const v of ['1111111111111', '0000000000000', '0123456789012', '123456789012', '12345678901234', '', 'abc']) {
    assert.equal(isValidThaiID(v), false, v);
  }
});

test('formatted + context scores 1.0', () => {
  const id = formatThaiID(synthThaiID(rng(13)));
  const [f] = detect(`เลขบัตรประชาชน ${id}`);
  assert.ok(f);
  assert.equal(f.value, id);
  assert.equal(f.confidence, 1);
  assert.equal(f.reason, 'checksum+formatted+context');
});

test('formatted without context scores 0.85 (auto-mask)', () => {
  const id = formatThaiID(synthThaiID(rng(14)));
  const [f] = detect(`ข้อมูล ${id} ครับ`);
  assert.equal(f.confidence, 0.85);
});

test('bare digits with context scores 0.85 (auto-mask)', () => {
  const id = synthThaiID(rng(15));
  const [f] = detect(`Tax ID: ${id}`);
  assert.equal(f.confidence, 0.85);
});

test('bare digits without context scores 0.50 (warn only)', () => {
  const id = synthThaiID(rng(16));
  const [f] = detect(`ข้อมูล ${id} ครับ`);
  assert.equal(f.confidence, 0.5);
});

test('bare digits in order/tracking context drops below 0.50', () => {
  const id = synthThaiID(rng(17));
  for (const t of [`เลขที่ใบสั่งซื้อ ${id}`, `tracking ${id}`, `Invoice ${id}`, `เลขพัสดุ ${id}`]) {
    const [f] = detect(t);
    assert.ok(f, t);
    assert.ok(f.confidence < 0.5, `${t} → ${f.confidence}`);
  }
});

test('does not match inside longer digit runs', () => {
  const id = synthThaiID(rng(18));
  assert.deepEqual(detect(`${id}9`), []);
  assert.deepEqual(detect(`9${id}`), []);
});

test('start/end indexes are exact', () => {
  const id = synthThaiID(rng(19));
  const text = `abc ${id} def`;
  const [f] = detect(text);
  assert.equal(text.slice(f.start, f.end), id);
});
