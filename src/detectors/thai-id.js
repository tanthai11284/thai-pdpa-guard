import { contextWindow, clamp01 } from './shared.js';

export const type = 'thai_id';

const WEIGHTS = [13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];

const CTX = /(บัตรประชาชน|บัตรประจำตัว|ประจำตัวประชาชน|เลขประจำตัว|เลขบัตร|ปชช\.?|ผู้เสียภาษี|ภาษีอากร|เลขที่บัตร|เลข\s?13\s?หลัก|national\s*id|citizen\s*id|thai\s*id|id\s*card|tax\s*id|tin\b)/i;
const NEG_CTX = /(ใบสั่งซื้อ|เลขที่สั่งซื้อ|order|po\s*(no|#)|tracking|เลขพัสดุ|พัสดุ|ems|kerry|flash|j&t|invoice|ใบแจ้งหนี้|ใบกำกับ|ใบเสร็จ|receipt|barcode|บาร์โค้ด|sku|serial|s\/n|เลขที่อ้างอิง|ref(erence)?\s*(no|#|:)|transaction|รายการที่|หมายเลขคำสั่ง|booking|จอง)/i;
const FORMATTED = /^\d-\d{4}-\d{5}-\d{2}-\d$/;
const CANDIDATE = /(?<![\d-])(?:\d-\d{4}-\d{5}-\d{2}-\d|\d{13})(?![\d-])/g;

export function isValidThaiID(raw) {
  const d = String(raw).replace(/\D/g, '');
  if (d.length !== 13) return false;
  if (/^(\d)\1{12}$/.test(d)) return false;
  if (d[0] === '0') return false;
  const sum = WEIGHTS.reduce((a, w, i) => a + Number(d[i]) * w, 0);
  return ((11 - (sum % 11)) % 10) === Number(d[12]);
}

export function detect(text) {
  const out = [];
  for (const m of text.matchAll(CANDIDATE)) {
    const value = m[0];
    if (!isValidThaiID(value)) continue;
    const start = m.index;
    const end = start + value.length;
    let score = 0.5;
    const reasons = ['checksum'];
    if (FORMATTED.test(value)) { score += 0.35; reasons.push('formatted'); }
    const win = contextWindow(text, start, end, 40);
    if (CTX.test(win)) { score += 0.35; reasons.push('context'); }
    else if (NEG_CTX.test(win)) { score -= 0.3; reasons.push('neg-context'); }
    out.push({ type, value, start, end, confidence: clamp01(score), reason: reasons.join('+') });
  }
  return out;
}
