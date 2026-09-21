import { clamp01, alternation } from './shared.js';
import {
  TITLES, STRONG_TITLES, LATIN_TITLES, NAME_STOP_WORDS, TITLE_COMPOUNDS, TITLE_PRECEDING_BLOCK
} from '../data/titles.th.js';

export const type = 'thai_name';

const TH = 'ก-๙';
const TITLE_RE = new RegExp(`(?<![A-Za-z])(${alternation(TITLES)})\\s?(?=[${TH}])`, 'g');
const THAI_RUN = new RegExp(`^[${TH}]+`);
const NEXT_RUN = new RegExp(`^ (?=[${TH}])`);
const PRECEDING_BLOCK = new RegExp(`(?:${alternation(TITLE_PRECEDING_BLOCK)})$`);
const LATIN_RE = new RegExp(`(?<![A-Za-z])(?:${LATIN_TITLES.join('|')})\\.?\\s+([A-Z][a-z]+(?:\\s[A-Z][a-z]+){0,2})`, 'g');
const STRONG = new Set(STRONG_TITLES);
const MAX_WORDS = 3;
const MAX_RUN = 40;

const segmenter = typeof Intl !== 'undefined' && Intl.Segmenter
  ? new Intl.Segmenter('th', { granularity: 'word' })
  : null;

function words(run) {
  if (!segmenter) return [run];
  const out = [];
  for (const s of segmenter.segment(run)) {
    if (s.isWordLike !== false && s.segment.trim()) out.push(s.segment);
  }
  return out;
}

function takeName(run, blockFirst) {
  const ws = words(run.slice(0, MAX_RUN));
  if (!ws.length || NAME_STOP_WORDS.has(ws[0]) || blockFirst.has(ws[0])) return '';
  let name = '';
  for (let i = 0; i < ws.length && i < MAX_WORDS; i++) {
    const isLast = i === ws.length - 1;
    if (NAME_STOP_WORDS.has(ws[i]) && !isLast) break;
    name += ws[i];
  }
  return name;
}

const NONE = new Set();

export function detect(text) {
  const out = [];
  for (const m of text.matchAll(TITLE_RE)) {
    const title = m[1];
    if (PRECEDING_BLOCK.test(text.slice(Math.max(0, m.index - 8), m.index))) continue;
    const nameStart = m.index + m[0].length;
    const run = THAI_RUN.exec(text.slice(nameStart));
    if (!run) continue;
    const first = takeName(run[0], TITLE_COMPOUNDS);
    if (!first) continue;
    let end = nameStart + first.length;
    const reasons = ['title'];
    let score = title === 'คุณ' ? 0.5 : 0.6;
    if (STRONG.has(title)) { score += 0.1; reasons.push('strong-title'); }
    const rest = text.slice(end);
    if (NEXT_RUN.test(rest)) {
      const run2 = THAI_RUN.exec(rest.slice(1));
      const last = run2 ? takeName(run2[0], NONE) : '';
      if (last) { end += 1 + last.length; score += 0.15; reasons.push('surname'); }
    }
    out.push({
      type, value: text.slice(m.index, end), start: m.index, end,
      confidence: clamp01(score), reason: reasons.join('+')
    });
  }
  for (const m of text.matchAll(LATIN_RE)) {
    const parts = m[1].split(' ');
    const score = 0.6 + (parts.length > 1 ? 0.15 : 0);
    out.push({
      type, value: m[0], start: m.index, end: m.index + m[0].length,
      confidence: clamp01(score), reason: parts.length > 1 ? 'title+surname' : 'title'
    });
  }
  return out;
}
