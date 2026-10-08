export function isTextarea(el) {
  return el.tagName === 'TEXTAREA';
}

export function getText(el) {
  if (isTextarea(el)) return el.value;
  return (el.innerText ?? el.textContent ?? '').replace(/ /g, ' ').replace(/\n$/, '');
}

const textareaSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;

function setTextarea(el, text) {
  const start = el.selectionStart;
  if (textareaSetter) textareaSetter.call(el, text);
  else el.value = text;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  const pos = Math.min(start ?? text.length, text.length);
  try { el.setSelectionRange(pos, pos); } catch { /* not focusable */ }
}

function selectAllIn(el) {
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

function setContentEditable(el, text) {
  el.focus();
  selectAllIn(el);
  let ok = false;
  try { ok = document.execCommand('insertText', false, text); } catch { ok = false; }
  if (!ok || normalize(getText(el)) !== normalize(text)) {
    el.textContent = '';
    const lines = text.split('\n');
    lines.forEach((line, i) => {
      if (i > 0) el.appendChild(document.createElement('br'));
      el.appendChild(document.createTextNode(line));
    });
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
  }
}

function normalize(s) {
  return s.replace(/\s+/g, ' ').trim();
}

const inputSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;

export function replaceInFieldValue(el, replacer) {
  const next = replacer(el.value);
  if (next === el.value) return false;
  const setter = el.tagName === 'TEXTAREA' ? textareaSetter : inputSetter;
  if (setter) setter.call(el, next);
  else el.value = next;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
}

export function setText(el, text) {
  if (isTextarea(el)) setTextarea(el, text);
  else setContentEditable(el, text);
}

export function replaceInTextNodes(root, replacer, skip) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const p = node.parentElement;
      if (!p) return NodeFilter.FILTER_REJECT;
      if (skip(p)) return NodeFilter.FILTER_REJECT;
      const tag = p.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA') return NodeFilter.FILTER_REJECT;
      const v = node.nodeValue;
      return v.includes('[') || v.includes('【') || v.includes('_')
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_SKIP;
    }
  });
  let changed = 0;
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    const next = replacer(node.nodeValue);
    if (next !== node.nodeValue) { node.nodeValue = next; changed++; }
  }
  return changed;
}

const BLOCK_SELECTOR = 'p, li, td, th, h1, h2, h3, h4, h5, h6, blockquote, dd, dt';

function textNodesUnder(root, skip) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const p = node.parentElement;
      if (!p || skip(p)) return NodeFilter.FILTER_REJECT;
      return p.tagName === 'SCRIPT' || p.tagName === 'STYLE' ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
    }
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  return nodes;
}

/**
 * Like replaceInTextNodes, but for text split over several nodes inside one block
 * (streamed words in separate spans). `transform` maps the node values to new values.
 */
export function replaceAcrossTextNodes(root, transform, skip) {
  const blocks = new Set();
  for (const node of textNodesUnder(root, skip)) {
    const v = node.nodeValue;
    if (!(v.includes('[') || v.includes('【') || v.includes('_'))) continue;
    const p = node.parentElement;
    const block = p.closest(BLOCK_SELECTOR) ?? p.parentElement ?? p;
    if (block !== root) blocks.add(block);
  }
  let changed = 0;
  for (const block of blocks) {
    const nodes = textNodesUnder(block, skip);
    if (nodes.length < 2) continue;
    const before = nodes.map((n) => n.nodeValue);
    const after = transform(before);
    if (after === before) continue;
    nodes.forEach((n, i) => { if (after[i] !== before[i]) { n.nodeValue = after[i]; changed++; } });
  }
  return changed;
}
