export const type = 'email';

const EMAIL = /(?<![A-Za-z0-9._%+-])[A-Za-z0-9._%+-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}(?![A-Za-z0-9.-])/g;

export function detect(text) {
  const out = [];
  for (const m of text.matchAll(EMAIL)) {
    out.push({
      type, value: m[0], start: m.index, end: m.index + m[0].length,
      confidence: 0.9, reason: 'pattern'
    });
  }
  return out;
}
