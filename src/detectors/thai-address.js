import { clamp01, alternation } from './shared.js';
import { PROVINCES, AMBIGUOUS_PROVINCES } from '../data/provinces.th.js';

export const type = 'thai_address';

const TH = 'ก-๙';
const NAME = `[${TH}A-Za-z0-9]+`;

const SIGNALS = [
  { kind: 'house', weight: 0.4, re: new RegExp(`(?<![${TH}])(?:บ้านเลขที่|เลขที่)\\s?\\d+(?:/\\d+)?`, 'g') },
  { kind: 'moo', weight: 0.4, re: new RegExp(`(?<![${TH}])(?:หมู่ที่|หมู่บ้าน|หมู่)\\s?(?:ที่\\s?)?${NAME}`, 'g') },
  { kind: 'moo', weight: 0.25, re: new RegExp(`(?<![${TH}.])ม\\.\\s?\\d{1,2}(?!\\d)`, 'g') },
  { kind: 'road', weight: 0.4, re: new RegExp(`(?<![${TH}])(?:ซอย|ซ\\.|ถนน|ถ\\.)\\s?${NAME}(?:\\s\\d+(?:/\\d+)?)?`, 'g') },
  { kind: 'sub', weight: 0.4, re: new RegExp(`(?<![${TH}])(?:ตำบล|ต\\.|แขวง)\\s?[${TH}]+`, 'g') },
  { kind: 'dist', weight: 0.4, re: new RegExp(`(?<![${TH}])อำเภอ\\s?[${TH}]+`, 'g') },
  { kind: 'dist', weight: 0.3, re: new RegExp(`(?<![${TH}])(?:อ\\.|เขต)\\s?[${TH}]+`, 'g') },
  { kind: 'post', weight: 0.25, re: /(?<![\d-])[1-9]\d{4}(?![\d-])/g }
];

const PROVINCE_RE = new RegExp(`(?<![${TH}])((?:จังหวัด|จ\\.)\\s?)?(${alternation(PROVINCES)})(?![${TH}])`, 'g');
const HOUSE_NO_BEFORE = /(?:^|\s)(\d{1,5}(?:\/\d{1,4})?)\s*$/;
const MAX_GAP = 25;

function collect(text) {
  const hits = [];
  for (const { kind, weight, re } of SIGNALS) {
    for (const m of text.matchAll(re)) {
      hits.push({ kind, weight, start: m.index, end: m.index + m[0].length });
    }
  }
  for (const m of text.matchAll(PROVINCE_RE)) {
    const prefixed = Boolean(m[1]);
    const name = m[2];
    if (!prefixed && AMBIGUOUS_PROVINCES.has(name)) continue;
    hits.push({ kind: 'prov', weight: prefixed ? 0.4 : 0.35, start: m.index, end: m.index + m[0].length });
  }
  hits.sort((a, b) => a.start - b.start || b.end - a.end);
  return hits;
}

export function detect(text) {
  const hits = collect(text);
  const out = [];
  let i = 0;
  while (i < hits.length) {
    const cluster = [hits[i]];
    let j = i + 1;
    while (j < hits.length && hits[j].start - cluster[cluster.length - 1].end <= MAX_GAP) {
      if (hits[j].start >= cluster[cluster.length - 1].end) cluster.push(hits[j]);
      j++;
    }
    i = j;
    const kinds = new Set(cluster.map((h) => h.kind));
    if (kinds.size < 2) continue;
    let start = cluster[0].start;
    const end = cluster[cluster.length - 1].end;
    if (cluster[0].kind !== 'house') {
      const before = HOUSE_NO_BEFORE.exec(text.slice(Math.max(0, start - 12), start));
      if (before) start -= before[0].trimStart().length;
    }
    const score = cluster.reduce((a, h) => a + h.weight, 0);
    out.push({
      type, value: text.slice(start, end), start, end,
      confidence: clamp01(score), reason: [...kinds].join('+')
    });
  }
  return out;
}
