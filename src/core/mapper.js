import { PLACEHOLDER_LABELS } from './types.js';

const NUMERIC_TYPES = new Set(['thai_id', 'thai_phone', 'credit_card', 'bank_account']);
const LABEL_ALT = Object.values(PLACEHOLDER_LABELS).join('|');
const PLACEHOLDER_RE = new RegExp(`\\\\?[\\[【]\\s*(${LABEL_ALT})\\s*\\\\?[_\\-\\s]?\\s*(\\d+)\\s*\\\\?[\\]】]`, 'g');
// Models (Gemini) sometimes drop the brackets: `บุคคล_1`. Only replaced when the key exists in the session.
const BARE_PLACEHOLDER_RE = new RegExp(`(${LABEL_ALT})\\\\?_(\\d+)(?!\\d)`, 'g');

export function createSession(tabId) {
  return { tabId, forward: {}, reverse: {}, counters: {} };
}

function keyOf(finding) {
  const v = NUMERIC_TYPES.has(finding.type) ? finding.value.replace(/\D/g, '') : finding.value.trim();
  return `${finding.type}:${v}`;
}

export function placeholderFor(finding, session) {
  const key = keyOf(finding);
  if (session.forward[key]) return session.forward[key];
  const label = PLACEHOLDER_LABELS[finding.type];
  const n = (session.counters[label] ?? 0) + 1;
  session.counters[label] = n;
  const ph = `[${label}_${n}]`;
  session.forward[key] = ph;
  session.reverse[ph] = finding.value;
  return ph;
}

export function mask(text, findings, session) {
  const sorted = [...findings].sort((a, b) => a.start - b.start);
  let out = '';
  let cursor = 0;
  const applied = [];
  for (const f of sorted) {
    if (f.start < cursor) continue;
    const ph = placeholderFor(f, session);
    out += text.slice(cursor, f.start) + ph;
    cursor = f.end;
    applied.push({ ...f, placeholder: ph });
  }
  out += text.slice(cursor);
  return { masked: out, session, applied };
}

export function unmask(text, session) {
  if (!text || !Object.keys(session.reverse).length) return text;
  return text
    .replace(PLACEHOLDER_RE, (m, label, n) => session.reverse[`[${label}_${n}]`] ?? m)
    .replace(BARE_PLACEHOLDER_RE, (m, label, n) => session.reverse[`[${label}_${n}]`] ?? m);
}

function knownMatches(text, session) {
  const found = [];
  for (const re of [PLACEHOLDER_RE, BARE_PLACEHOLDER_RE]) {
    for (const m of text.matchAll(re)) {
      const value = session.reverse[`[${m[1]}_${m[2]}]`];
      const start = m.index;
      const end = start + m[0].length;
      if (value !== undefined && !found.some((f) => start < f.end && end > f.start)) found.push({ start, end, value });
    }
  }
  return found.sort((a, b) => a.start - b.start);
}

/**
 * Unmask placeholders that are split across several strings (ChatGPT streams each word into its own
 * span, so `[บุคคล_1]` arrives as `[บุคคล` + `_` + `1]`). Returns an array of the same length:
 * the replacement goes into the string where the placeholder starts, the rest of it is removed.
 * @param {string[]} values
 */
export function unmaskAcross(values, session) {
  if (!Object.keys(session.reverse).length) return values;
  const matches = knownMatches(values.join(''), session);
  if (!matches.length) return values;
  const starts = [];
  let pos = 0;
  for (const v of values) { starts.push(pos); pos += v.length; }
  const locate = (offset) => values.findIndex((v, i) => offset < starts[i] + v.length);
  const out = [...values];
  for (const m of matches.reverse()) {
    const i = locate(m.start);
    const j = locate(m.end - 1);
    const head = out[i].slice(0, m.start - starts[i]);
    if (i === j) {
      out[i] = head + m.value + out[i].slice(m.end - starts[i]);
      continue;
    }
    out[i] = head + m.value;
    for (let k = i + 1; k < j; k++) out[k] = '';
    out[j] = out[j].slice(m.end - starts[j]);
  }
  return out;
}

export function hasPlaceholder(text) {
  PLACEHOLDER_RE.lastIndex = 0;
  BARE_PLACEHOLDER_RE.lastIndex = 0;
  return PLACEHOLDER_RE.test(text) || BARE_PLACEHOLDER_RE.test(text);
}

export function sessionSize(session) {
  return Object.keys(session.reverse).length;
}

const storage = () => (typeof chrome !== 'undefined' && chrome.storage?.session) || null;
const storageKey = (tabId) => `map:${tabId}`;

export async function loadSession(tabId) {
  const s = storage();
  if (!s) return createSession(tabId);
  try {
    const data = await s.get(storageKey(tabId));
    const saved = data[storageKey(tabId)];
    return saved ? { ...createSession(tabId), ...saved } : createSession(tabId);
  } catch {
    return createSession(tabId);
  }
}

export async function saveSession(session) {
  const s = storage();
  if (!s || session.tabId == null) return;
  try {
    await s.set({ [storageKey(session.tabId)]: {
      forward: session.forward, reverse: session.reverse, counters: session.counters
    } });
  } catch {
    /* session storage not accessible: keep in-memory only */
  }
}

export async function clearSession(tabId) {
  const s = storage();
  if (!s) return;
  try { await s.remove(storageKey(tabId)); } catch { /* ignore */ }
}
