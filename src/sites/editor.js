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
      return node.nodeValue.includes('[') || node.nodeValue.includes('【')
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
