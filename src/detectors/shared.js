export function contextWindow(text, start, end, radius) {
  return text.slice(Math.max(0, start - radius), Math.min(text.length, end + radius));
}

export function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function alternation(words) {
  return [...words].sort((a, b) => b.length - a.length).map(escapeRegex).join('|');
}

export function clamp01(n) {
  return Math.min(1, Math.max(0, Math.round(n * 100) / 100));
}
