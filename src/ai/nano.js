export const MAX_CHUNK_CHARS = 1200;
const PROMPT_TIMEOUT_MS = 12000;
const NANO_CONFIDENCE = 0.85;

const SYSTEM_PROMPT = [
  'You extract personal data from Thai text.',
  'Find (1) person names of real people (with or without title such as นาย นาง นางสาว คุณ) and (2) postal addresses.',
  'Return ONLY a JSON array. Each item: {"type":"name"|"address","text":"<exact substring copied from the input>"}.',
  'Copy the substring exactly as it appears. Do not translate, normalize, or invent. If nothing is found return [].'
].join(' ');

const SCHEMA = {
  type: 'array',
  items: {
    type: 'object',
    properties: { type: { type: 'string', enum: ['name', 'address'] }, text: { type: 'string' } },
    required: ['type', 'text']
  }
};

let session = null;
let lastReason = 'unsupported';

function api() {
  const g = globalThis;
  if (g.LanguageModel?.availability) return g.LanguageModel;
  if (g.chrome?.languageModel?.availability) return g.chrome.languageModel;
  if (g.ai?.languageModel?.availability) return g.ai.languageModel;
  return null;
}

export async function status() {
  const lm = api();
  if (!lm) { lastReason = 'unsupported'; return 'unsupported'; }
  try {
    const a = await lm.availability();
    if (a === 'available' || a === 'readily') { lastReason = ''; return 'ready'; }
    if (a === 'downloadable' || a === 'after-download') { lastReason = 'downloadable'; return 'downloadable'; }
    if (a === 'downloading') { lastReason = 'downloading'; return 'downloading'; }
    lastReason = 'device';
    return 'unsupported';
  } catch {
    lastReason = 'error';
    return 'unsupported';
  }
}

export async function isAvailable() {
  return (await status()) === 'ready';
}

export function reason() {
  return lastReason;
}

async function createSession(onProgress) {
  const lm = api();
  const opts = {
    initialPrompts: [{ role: 'system', content: SYSTEM_PROMPT }],
    monitor(m) {
      m.addEventListener('downloadprogress', (e) => onProgress?.(e.loaded, e.total));
    }
  };
  return lm.create(opts);
}

export async function warmUp(onProgress) {
  const lm = api();
  if (!lm) return false;
  try {
    session = await createSession(onProgress);
    lastReason = '';
    return true;
  } catch {
    session = null;
    lastReason = 'error';
    return false;
  }
}

export function chunkText(text, max = MAX_CHUNK_CHARS) {
  const chunks = [];
  let offset = 0;
  while (offset < text.length) {
    let end = Math.min(text.length, offset + max);
    if (end < text.length) {
      const cut = text.lastIndexOf('\n', end);
      const cutSpace = text.lastIndexOf(' ', end);
      const best = Math.max(cut, cutSpace);
      if (best > offset + max / 2) end = best + 1;
    }
    chunks.push({ text: text.slice(offset, end), offset });
    offset = end;
  }
  return chunks;
}

export function parseEntities(raw, text) {
  let arr;
  try {
    const cleaned = String(raw).replace(/^[\s`]*json/i, '').replace(/```/g, '').trim();
    const start = cleaned.indexOf('[');
    const end = cleaned.lastIndexOf(']');
    arr = JSON.parse(start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned);
  } catch {
    return [];
  }
  if (!Array.isArray(arr)) return [];
  const out = [];
  const seen = new Set();
  for (const item of arr) {
    if (!item || typeof item.text !== 'string') continue;
    const type = item.type === 'address' ? 'thai_address' : item.type === 'name' ? 'thai_name' : null;
    if (!type) continue;
    const value = item.text.trim();
    if (value.length < 2 || value.length > 200) continue;
    let from = 0;
    let idx;
    while ((idx = text.indexOf(value, from)) !== -1) {
      const key = `${idx}:${value.length}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push({ type, value, start: idx, end: idx + value.length, confidence: NANO_CONFIDENCE, reason: 'nano' });
      }
      from = idx + value.length;
    }
  }
  return out;
}

async function promptWithTimeout(text) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), PROMPT_TIMEOUT_MS);
  try {
    const opts = { signal: ctrl.signal };
    try {
      return await session.prompt(text, { ...opts, responseConstraint: SCHEMA });
    } catch (e) {
      if (e?.name === 'AbortError') throw e;
      return await session.prompt(text, opts);
    }
  } finally {
    clearTimeout(timer);
  }
}

export async function findThaiEntities(text) {
  if (!text?.trim()) return [];
  if (!session && !(await warmUp())) return [];
  const results = [];
  for (const { text: chunk, offset } of chunkText(text)) {
    let raw;
    try {
      raw = await promptWithTimeout(chunk);
    } catch {
      session = null;
      break;
    }
    for (const f of parseEntities(raw, chunk)) {
      results.push({ ...f, start: f.start + offset, end: f.end + offset });
    }
  }
  return results;
}

export function destroy() {
  try { session?.destroy?.(); } catch { /* ignore */ }
  session = null;
}
