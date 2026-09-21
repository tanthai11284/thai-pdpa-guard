import { contextWindow, clamp01 } from './shared.js';

export const type = 'passport';

const CANDIDATE = /(?<![A-Za-z0-9])[A-Z]{1,2}\d{6,7}(?![A-Za-z0-9])/g;
const CTX = /(passport|หนังสือเดินทาง|พาสปอร์ต|เลขที่เดินทาง|travel\s*document|visa\s*(no|application))/i;

export function detect(text) {
  const out = [];
  for (const m of text.matchAll(CANDIDATE)) {
    const value = m[0];
    const start = m.index;
    const end = start + value.length;
    let score = 0.35;
    const reasons = ['pattern'];
    if (CTX.test(contextWindow(text, start, end, 40))) { score += 0.45; reasons.push('context'); }
    if (score < 0.5) continue;
    out.push({ type, value, start, end, confidence: clamp01(score), reason: reasons.join('+') });
  }
  return out;
}
