import { contextWindow, clamp01 } from './shared.js';

export const type = 'credit_card';

const CANDIDATE = /(?<![\d-])\d(?:[ -]?\d){12,18}(?![\d-])/g;
const CTX = /(บัตรเครดิต|บัตรเดบิต|เครดิต|เลขบัตร|card|visa|mastercard|master\s*card|amex|jcb|unionpay|cvv|หมดอายุ|expir)/i;
const GROUPED = /^\d{4}(?:[ -]\d{4}){2,3}(?:[ -]\d{1,3})?$|^\d{4}[ -]\d{6}[ -]\d{5}$/;

export function luhn(digits) {
  let sum = 0;
  let dbl = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i]);
    if (dbl) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

export function brandOf(d) {
  if (/^4/.test(d) && [13, 16, 19].includes(d.length)) return 'visa';
  if (/^(5[1-5]|2(22[1-9]|2[3-9]\d|[3-6]\d{2}|7[01]\d|720))/.test(d) && d.length === 16) return 'mastercard';
  if (/^3[47]/.test(d) && d.length === 15) return 'amex';
  if (/^35(2[89]|[3-8]\d)/.test(d) && d.length >= 16) return 'jcb';
  if (/^62/.test(d) && d.length >= 16) return 'unionpay';
  if (/^6(011|5)/.test(d) && d.length === 16) return 'discover';
  return null;
}

export function detect(text) {
  const out = [];
  for (const m of text.matchAll(CANDIDATE)) {
    const value = m[0];
    const d = value.replace(/\D/g, '');
    if (d.length < 13 || d.length > 19) continue;
    if (/^(\d)\1+$/.test(d)) continue;
    if (!luhn(d)) continue;
    const start = m.index;
    const end = start + value.length;
    let score = 0.55;
    const reasons = ['luhn'];
    const brand = brandOf(d);
    if (brand) { score += 0.3; reasons.push(brand); }
    if (GROUPED.test(value)) { score += 0.1; reasons.push('grouped'); }
    const hasCtx = CTX.test(contextWindow(text, start, end, 40));
    if (hasCtx) { score += 0.1; reasons.push('context'); }
    if (d.length === 13 && !hasCtx) continue;
    out.push({ type, value, start, end, confidence: clamp01(score), reason: reasons.join('+') });
  }
  return out;
}
