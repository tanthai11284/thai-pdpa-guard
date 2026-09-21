import { contextWindow, clamp01, alternation } from './shared.js';
import { PROVINCES } from '../data/provinces.th.js';

export const type = 'thai_plate';

const CANDIDATE = /(?<![ก-๙\d])(?:\d{1,2})?[ก-ฮ]{1,3}[ -]?\d{1,4}(?![ก-๙\d])/g;
const STRONG_CTX = /(ทะเบียน|ป้ายทะเบียน|เลขทะเบียน|ป้ายแดง|license\s*plate|plate\s*(no|number))/i;
const WEAK_CTX = /(รถยนต์|รถเก๋ง|รถกระบะ|รถตู้|รถบรรทุก|มอเตอร์ไซค์|จยย\.|รถจักรยานยนต์|รถ|คัน|ขับ|จอด|vehicle|car)/i;
const PROVINCE_CTX = new RegExp(`(${alternation(PROVINCES)})`);
const COMMON_WORDS = new Set([
  'คน', 'วง', 'ลง', 'บท', 'กม', 'ตร', 'ชม', 'จน', 'ยก', 'ทน', 'ตก', 'พบ', 'จบ', 'บน', 'สน',
  'หน', 'ยน', 'งวด', 'รวม', 'ขวด', 'ถนน', 'ตอน', 'ครบ', 'กด', 'ลด', 'จด', 'ผล', 'ชน', 'ทด',
  'บวก', 'ลบ', 'คูณ', 'หาร', 'ซม', 'มม', 'กก', 'กรม', 'ขอ', 'รอ', 'พอ', 'หก', 'สอง', 'สาม'
]);

export function detect(text) {
  const out = [];
  for (const m of text.matchAll(CANDIDATE)) {
    const value = m[0];
    const letters = value.replace(/[^ก-ฮ]/g, '');
    const digits = value.replace(/^\d{1,2}(?=[ก-ฮ])/, '').replace(/\D/g, '');
    const leading = /^\d/.test(value);
    if (letters.length === 1 && !leading) continue;
    if (COMMON_WORDS.has(letters)) continue;
    if (digits.length < 2 && !leading) continue;
    const start = m.index;
    const end = start + value.length;
    const win = contextWindow(text, start, end, 30);
    let score = 0.4;
    const reasons = ['pattern'];
    if (STRONG_CTX.test(win)) { score += 0.4; reasons.push('context'); }
    else if (WEAK_CTX.test(win)) { score += 0.2; reasons.push('weak-context'); }
    if (PROVINCE_CTX.test(win)) { score += 0.25; reasons.push('province'); }
    if (score < 0.5) continue;
    out.push({ type, value, start, end, confidence: clamp01(score), reason: reasons.join('+') });
  }
  return out;
}
