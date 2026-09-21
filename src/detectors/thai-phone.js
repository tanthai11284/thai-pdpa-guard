import { contextWindow, clamp01 } from './shared.js';

export const type = 'thai_phone';

const CTX = /(โทร|เบอร์|มือถือ|โทรศัพท์|ติดต่อ|สายด่วน|แฟกซ์|fax|tel|phone|mobile|call|contact|line)/i;
const MOBILE = /(?<![\d-])(?:\+66[-\s]?|0)[689](?:[-\s]?\d){8}(?![\d-])/g;
const LANDLINE = /(?<![\d-])(?:\+66[-\s]?|0)(?:2(?:[-\s]?\d){7}|[3-7](?:[-\s]?\d){7})(?![\d-])/g;

function digitsOf(v) {
  return v.replace(/\D/g, '');
}

function push(out, text, m, base, reasons) {
  const value = m[0];
  const start = m.index;
  const end = start + value.length;
  let score = base;
  const win = contextWindow(text, start, end, 30);
  if (CTX.test(win)) { score += 0.35; reasons.push('context'); }
  if (/[-\s]/.test(value.slice(1))) { score += 0.05; reasons.push('formatted'); }
  out.push({ type, value, start, end, confidence: clamp01(score), reason: reasons.join('+') });
}

export function detect(text) {
  const out = [];
  const taken = [];
  for (const m of text.matchAll(MOBILE)) {
    const d = digitsOf(m[0]);
    if (d.length !== 10 && d.length !== 11) continue;
    taken.push([m.index, m.index + m[0].length]);
    push(out, text, m, 0.85, ['mobile']);
  }
  for (const m of text.matchAll(LANDLINE)) {
    const s = m.index;
    const e = s + m[0].length;
    if (taken.some(([a, b]) => s < b && e > a)) continue;
    push(out, text, m, 0.55, ['landline']);
  }
  return out;
}
