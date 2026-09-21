import { contextWindow, clamp01, alternation } from './shared.js';
import { BANKS, ACCOUNT_WORDS } from '../data/banks.th.js';

export const type = 'bank_account';

const CANDIDATE = /(?<![\d-])\d(?:[ -]?\d){9,11}(?![\d-])/g;
const BANK_CTX = new RegExp(`(${alternation(BANKS)})`, 'i');
const ACCOUNT_CTX = new RegExp(`(${alternation(ACCOUNT_WORDS)})`, 'i');
const MOBILE = /^0[689]\d{8}$/;
const KNOWN_FORMAT = /^\d{3}[ -]?\d[ -]?\d{5}[ -]?\d$|^\d{3}[ -]?\d{6}[ -]?\d$|^\d{3}[ -]?\d[ -]?\d{6}$|^\d{3}[ -]?\d{7}$/;

export function detect(text) {
  const out = [];
  for (const m of text.matchAll(CANDIDATE)) {
    const value = m[0];
    const d = value.replace(/\D/g, '');
    if (d.length < 10 || d.length > 12) continue;
    if (MOBILE.test(d)) continue;
    if (/^(\d)\1+$/.test(d)) continue;
    const start = m.index;
    const end = start + value.length;
    const win = contextWindow(text, start, end, 50);
    let score = 0.45;
    const reasons = ['length'];
    const hasBank = BANK_CTX.test(win);
    const hasAccount = ACCOUNT_CTX.test(win);
    if (hasBank) { score += 0.35; reasons.push('bank'); }
    if (hasAccount) { score += hasBank ? 0.1 : 0.35; reasons.push('account'); }
    if (KNOWN_FORMAT.test(value) && /[ -]/.test(value)) { score += 0.05; reasons.push('formatted'); }
    if (!hasBank && !hasAccount) continue;
    out.push({ type, value, start, end, confidence: clamp01(score), reason: reasons.join('+') });
  }
  return out;
}
