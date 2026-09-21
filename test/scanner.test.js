import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scan, scanTail, resolveOverlaps, mergeFindings, excludePlaceholders, MAX_SCAN_LENGTH } from '../src/core/scanner.js';
import {
  rng, synthThaiID, formatThaiID, synthMobile, synthLandline, synthEmail, synthCard,
  synthBankAccount, synthPassport, synthName, synthAddress, positiveThaiIdCorpus, negativeCorpus, longThaiText
} from './fixtures/generate.js';

const byType = (findings, type) => findings.filter((f) => f.type === type);

test('spec positive cases score >= 0.80', () => {
  const r = rng(21);
  const id = formatThaiID(synthThaiID(r));
  const cases = [
    [`เลขบัตรประชาชน ${id}`, 'thai_id'],
    ['โทร 0812345678', 'thai_phone'],
    ['ส่งมาที่ somchai@example.com', 'email'],
    ['บัญชีกสิกร 1234567890', 'bank_account'],
    ['นายสมชาย ใจดี', 'thai_name'],
    ['123 หมู่ 4 ต.บางรัก อ.เมือง จ.ชลบุรี 20000', 'thai_address'],
    ['ทะเบียนรถ กข 1234 กรุงเทพมหานคร', 'thai_plate'],
    ['passport no. AA1234567', 'passport'],
    ['บัตรเครดิต 4111 1111 1111 1111', 'credit_card']
  ];
  for (const [text, type] of cases) {
    const found = byType(scan(text), type);
    assert.equal(found.length, 1, `${type}: ${text} → ${JSON.stringify(scan(text))}`);
    assert.ok(found[0].confidence >= 0.8, `${type} ${found[0].confidence}`);
  }
});

test('phone formats', () => {
  const r = rng(22);
  for (const fmt of ['plain', 'dash', 'space', 'intl']) {
    for (let i = 0; i < 20; i++) {
      const p = synthMobile(r, fmt);
      const found = byType(scan(`เบอร์ ${p} ครับ`), 'thai_phone');
      assert.equal(found.length, 1, p);
      assert.equal(found[0].value, p);
    }
  }
  const land = synthLandline(r);
  assert.ok(byType(scan(`โทร ${land}`), 'thai_phone')[0].confidence >= 0.8);
  assert.equal(byType(scan(`${land}`), 'thai_phone')[0].confidence, 0.55);
});

test('email, card, bank, passport, name, address batches', () => {
  const r = rng(23);
  for (let i = 0; i < 30; i++) {
    const email = synthEmail(r);
    assert.equal(byType(scan(`ติดต่อ ${email}`), 'email')[0]?.value, email);

    const card = synthCard(r, i % 2 === 0);
    const cf = byType(scan(`บัตร ${card}`), 'credit_card');
    assert.equal(cf[0]?.value, card, card);
    assert.ok(cf[0].confidence >= 0.8);

    const acct = synthBankAccount(r, i % 2 === 0 ? 'dash' : 'plain');
    const af = byType(scan(`โอนเข้าบัญชีไทยพาณิชย์ ${acct}`), 'bank_account');
    assert.equal(af[0]?.value, acct, acct);
    assert.ok(af[0].confidence >= 0.8);
    assert.deepEqual(byType(scan(`ยอด ${acct} บาท`), 'bank_account'), [], 'bank account requires context');

    const pp = synthPassport(r);
    assert.ok(byType(scan(`หนังสือเดินทาง ${pp}`), 'passport')[0].confidence >= 0.8, pp);
    assert.deepEqual(byType(scan(`code ${pp}`), 'passport'), [], 'passport requires context');

    const name = synthName(r);
    const nf = byType(scan(`ลูกค้าชื่อ${name} โทรมา`), 'thai_name');
    assert.equal(nf[0]?.value, name, name);
    assert.ok(nf[0].confidence >= 0.8);

    const addr = synthAddress(r);
    const adf = byType(scan(`ที่อยู่ ${addr} ครับ`), 'thai_address');
    assert.equal(adf.length, 1, addr);
    assert.ok(adf[0].confidence >= 0.8, `${addr} ${adf[0].confidence}`);
    assert.ok(adf[0].value.length >= addr.length - 2, `${addr} → ${adf[0].value}`);
  }
});

test('overlap resolution keeps higher confidence, then longer span', () => {
  const kept = resolveOverlaps([
    { type: 'a', start: 0, end: 10, confidence: 0.6 },
    { type: 'b', start: 5, end: 15, confidence: 0.9 },
    { type: 'c', start: 20, end: 25, confidence: 0.7 },
    { type: 'd', start: 20, end: 30, confidence: 0.7 }
  ]);
  assert.deepEqual(kept.map((f) => f.type), ['b', 'd']);
});

test('mergeFindings boosts same-type overlaps, adds new spans, ignores cross-type overlaps', () => {
  const base = [
    { type: 'thai_name', value: 'นายสมชาย', start: 0, end: 8, confidence: 0.6 },
    { type: 'thai_phone', value: '0812345678', start: 20, end: 30, confidence: 0.85 }
  ];
  const extra = [
    { type: 'thai_name', value: 'นายสมชาย ใจดี', start: 0, end: 13, confidence: 0.85, reason: 'nano' },
    { type: 'thai_name', value: '0812345678', start: 20, end: 30, confidence: 0.85, reason: 'nano' },
    { type: 'thai_address', value: 'ที่อยู่', start: 40, end: 47, confidence: 0.85, reason: 'nano' }
  ];
  const merged = mergeFindings(base, extra);
  assert.deepEqual(merged.map((f) => [f.type, f.start, f.confidence]), [
    ['thai_name', 0, 0.85], ['thai_phone', 20, 0.85], ['thai_address', 40, 0.85]
  ]);
  assert.equal(base[0].confidence, 0.6);
});

test('existing placeholders are never reported, by scan or by merged extra findings', () => {
  const text = 'ลูกค้าชื่อ[บุคคล_1] โทร [เบอร์_1] อีเมล [อีเมล_1] และ นายสมชาย ใจดี';
  const found = scan(text);
  assert.deepEqual(found.map((f) => f.value), ['นายสมชาย ใจดี']);
  const extra = [
    { type: 'thai_name', value: 'บุคคล_1', start: text.indexOf('บุคคล_1'), end: text.indexOf('บุคคล_1') + 7, confidence: 0.85, reason: 'nano' },
    { type: 'thai_name', value: 'สมชาย ใจดี', start: text.indexOf('สมชาย'), end: text.length, confidence: 0.85, reason: 'nano' }
  ];
  assert.deepEqual(excludePlaceholders(text, extra).map((f) => f.value), ['สมชาย ใจดี']);
});

test('formatted thai id is not split into phone/bank/card', () => {
  const id = formatThaiID(synthThaiID(rng(24)));
  const found = scan(`เลขบัตร ${id}`);
  assert.equal(found.length, 1);
  assert.equal(found[0].type, 'thai_id');
});

test('disabled detectors are skipped', () => {
  const found = scan('โทร 0812345678 อีเมล a@b.co', { enabled: { thai_phone: false } });
  assert.deepEqual(found.map((f) => f.type), ['email']);
});

test('findings below 0.50 are dropped', () => {
  const id = synthThaiID(rng(25));
  assert.deepEqual(scan(`tracking ${id}`), []);
});

test('same value appears with identical value string each time', () => {
  const p = synthMobile(rng(26));
  const found = byType(scan(`โทร ${p} หรือ ${p}`), 'thai_phone');
  assert.equal(found.length, 2);
  assert.equal(found[0].value, found[1].value);
});

test('thai_id precision >= 0.95 and recall >= 0.90 on 240-case corpus', () => {
  const positives = positiveThaiIdCorpus(240);
  let tp = 0;
  let fn = 0;
  for (const { text, id } of positives) {
    const hits = byType(scan(text), 'thai_id');
    if (hits.some((h) => h.value.replace(/\D/g, '') === id)) tp++;
    else fn++;
  }
  const recall = tp / (tp + fn);
  assert.ok(recall >= 0.9, `recall ${recall}`);

  let fp = 0;
  for (const text of negativeCorpus(260)) {
    if (byType(scan(text), 'thai_id').length) fp++;
  }
  const precision = tp / (tp + fp);
  assert.ok(precision >= 0.95, `precision ${precision} (fp=${fp})`);
});

test('scan of 5,000 chars completes under 50ms', () => {
  const text = longThaiText(rng(27), 5000);
  assert.equal(text.length, 5000);
  scan(text);
  const runs = 5;
  const t0 = performance.now();
  for (let i = 0; i < runs; i++) scan(text);
  const avg = (performance.now() - t0) / runs;
  assert.ok(avg < 50, `avg ${avg.toFixed(1)}ms`);
});

test('scanTail only scans the last 5,000 chars of very long text and offsets indexes', () => {
  const p = synthMobile(rng(28));
  const head = 'ก'.repeat(MAX_SCAN_LENGTH + 10);
  const text = `${head} โทร ${p}`;
  const found = scanTail(text);
  assert.equal(found.length, 1);
  assert.equal(text.slice(found[0].start, found[0].end), p);
});
