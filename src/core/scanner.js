import { DETECTORS } from '../detectors/index.js';
import { SHOW_THRESHOLD, PLACEHOLDER_LABELS } from './types.js';

const PLACEHOLDER_RE = new RegExp(`\\\\?[\\[【]\\s*(?:${Object.values(PLACEHOLDER_LABELS).join('|')})\\s*\\\\?[_\\-\\s]?\\s*\\d+\\s*\\\\?[\\]】]`, 'g');

export function excludePlaceholders(text, findings) {
  const ranges = [...text.matchAll(PLACEHOLDER_RE)].map((m) => [m.index, m.index + m[0].length]);
  if (!ranges.length) return findings;
  return findings.filter((f) => !ranges.some(([a, b]) => f.start < b && f.end > a));
}

export const MAX_SCAN_LENGTH = 20000;
export const TAIL_LENGTH = 5000;

function byPriority(a, b) {
  return b.confidence - a.confidence || (b.end - b.start) - (a.end - a.start) || a.start - b.start;
}

export function resolveOverlaps(findings) {
  const kept = [];
  for (const f of [...findings].sort(byPriority)) {
    if (!kept.some((k) => f.start < k.end && f.end > k.start)) kept.push(f);
  }
  return kept.sort((a, b) => a.start - b.start);
}

/**
 * @param {string} text
 * @param {{ enabled?: Record<string, boolean>, minConfidence?: number }} [opts]
 * @returns {import('./types.js').Finding[]}
 */
export function scan(text, opts = {}) {
  const enabled = opts.enabled ?? {};
  const min = opts.minConfidence ?? SHOW_THRESHOLD;
  const all = [];
  for (const d of DETECTORS) {
    if (enabled[d.type] === false) continue;
    for (const f of d.detect(text)) {
      if (f.confidence >= min) all.push(f);
    }
  }
  return resolveOverlaps(excludePlaceholders(text, all));
}

export function mergeFindings(base, extra) {
  const out = base.map((f) => ({ ...f }));
  const added = [];
  for (const e of extra) {
    const overlapping = out.filter((f) => e.start < f.end && e.end > f.start);
    if (!overlapping.length) { added.push(e); continue; }
    const sameType = overlapping.find((f) => f.type === e.type);
    if (sameType && e.confidence > sameType.confidence) {
      sameType.confidence = e.confidence;
      sameType.reason = `${sameType.reason}+${e.reason}`;
    }
  }
  return resolveOverlaps([...out, ...added]);
}

export function scanTail(text, opts) {
  if (text.length <= MAX_SCAN_LENGTH) return scan(text, opts);
  const offset = text.length - TAIL_LENGTH;
  return scan(text.slice(offset), opts).map((f) => ({ ...f, start: f.start + offset, end: f.end + offset }));
}
