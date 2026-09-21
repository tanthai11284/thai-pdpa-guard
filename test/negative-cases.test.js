import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scan } from '../src/core/scanner.js';
import { negativeCorpus, synthThaiID, rng } from './fixtures/generate.js';

test('spec negative cases produce no findings', () => {
  const id = synthThaiID(rng(31));
  const cases = [
    `เลขที่ใบสั่งซื้อ ${id}`,
    '1111111111111',
    '0000000000000',
    'เวอร์ชัน 1.2.3.4.5',
    '0212345',
    `เลขพัสดุ EMS ${id} ส่งแล้ว`,
    `tracking number ${id}`
  ];
  for (const text of cases) {
    assert.deepEqual(scan(text), [], text);
  }
});

test('common Thai phrases do not trigger name/plate/address', () => {
  const cases = [
    'นางฟ้าบนสวรรค์',
    'เจ้านายสั่งงานมาเยอะ',
    'นายอำเภอมาตรวจงาน',
    'นางแบบเดินแบบ',
    'คุณช่วยดูให้หน่อย',
    'คุณคิดว่ายังไง',
    'รถ 2 คัน คน 3 คน',
    'ไปเลย ราคา 12000 บาท',
    'ลงทะเบียนเรียน ม.4 เทอม 2',
    'บทที่ 5 หน้า 120',
    'รวม 3 รายการ',
    'เขตพื้นที่การศึกษา',
    'ถนนสายนี้รถติดมาก'
  ];
  for (const text of cases) {
    const found = scan(text);
    assert.deepEqual(found, [], `${text} → ${JSON.stringify(found)}`);
  }
});

test('false positive rate on 260-line negative corpus < 2%', () => {
  const corpus = negativeCorpus(260);
  const hits = [];
  for (const text of corpus) {
    const found = scan(text);
    if (found.length) hits.push({ text, found });
  }
  const rate = hits.length / corpus.length;
  assert.ok(rate < 0.02, `FP rate ${(rate * 100).toFixed(2)}%\n${hits.slice(0, 10).map((h) => `${h.text} → ${JSON.stringify(h.found)}`).join('\n')}`);
});

test('numbers adjacent to other digits/dashes are not phones or accounts', () => {
  for (const text of ['12340812345678', '0812345678901', '1-0812345678', 'ยอด 1234567890123456789 บาท']) {
    const types = scan(text).map((f) => f.type);
    assert.ok(!types.includes('thai_phone'), text);
    assert.ok(!types.includes('bank_account'), text);
  }
});

test('email-like strings without TLD are not emails', () => {
  assert.deepEqual(scan('user@localhost'), []);
  assert.deepEqual(scan('@mention someone'), []);
});
