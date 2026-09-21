import { PLACEHOLDER_LABELS } from './types.js';

const NUMERIC_TYPES = new Set(['thai_id', 'thai_phone', 'credit_card', 'bank_account']);
const LABEL_ALT = Object.values(PLACEHOLDER_LABELS).join('|');
const PLACEHOLDER_RE = new RegExp(`\\\\?[\\[【]\\s*(${LABEL_ALT})\\s*\\\\?[_\\-\\s]?\\s*(\\d+)\\s*\\\\?[\\]】]`, 'g');

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
  return text.replace(PLACEHOLDER_RE, (m, label, n) => session.reverse[`[${label}_${n}]`] ?? m);
}

export function hasPlaceholder(text) {
  PLACEHOLDER_RE.lastIndex = 0;
  return PLACEHOLDER_RE.test(text);
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
