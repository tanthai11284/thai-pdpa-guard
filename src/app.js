import { scanTail } from './core/scanner.js';
import { AUTO_MASK_THRESHOLD } from './core/types.js';
import { getSettings, onSettingsChanged, bumpStats } from './core/settings.js';
import { loadSession, saveSession, mask, unmask, hasPlaceholder } from './core/mapper.js';
import { siteFor, findEditors, findSendButton } from './sites/index.js';
import { getText, setText, replaceInTextNodes } from './sites/editor.js';
import { Overlay } from './ui/overlay.js';

const SCAN_DEBOUNCE_MS = 150;
const UNMASK_DEBOUNCE_MS = 120;
const t = (key, subs) => chrome.i18n.getMessage(key, subs) || key;

const site = siteFor();
const overlay = new Overlay();
const editors = new WeakSet();
let settings;
let session;
let activeEditor = null;
let skippedText = null;
let blocked = false;
let scanTimer = 0;
let unmaskTimer = 0;
let lastInputWasPaste = false;

async function getTabId() {
  try {
    const res = await chrome.runtime.sendMessage({ type: 'getTabId' });
    return res?.tabId ?? null;
  } catch {
    return null;
  }
}

function scheduleScan(editor) {
  activeEditor = editor;
  clearTimeout(scanTimer);
  scanTimer = setTimeout(() => runScan(editor), SCAN_DEBOUNCE_MS);
}

function runScan(editor) {
  if (!editor.isConnected) return;
  const text = getText(editor);
  if (!text.trim()) { clearState(editor); return; }
  if (text === skippedText) return;
  const findings = scanTail(text, { enabled: settings.detectors });
  if (!findings.length) { clearState(editor); return; }

  const strong = findings.filter((f) => f.confidence >= AUTO_MASK_THRESHOLD);
  if (settings.mode === 'auto') {
    const stillTyping = !lastInputWasPaste && document.activeElement === editor;
    const ready = strong.filter((f) => !(stillTyping && f.end >= text.length));
    if (ready.length) {
      applyMask(editor, ready, findings.length - ready.length);
      return;
    }
    if (strong.length) return;
  }

  editor.classList.add('tpg-editor-flagged');
  if (settings.mode === 'block' && strong.length) setBlocked(editor, true);
  else setBlocked(editor, false);

  overlay.showFindings({
    anchor: editor,
    findings,
    mode: settings.mode,
    onMask: (selected) => applyMask(editor, selected, 0),
    onSkip: () => {
      skippedText = text;
      clearState(editor, { keepBlock: settings.mode === 'block' && strong.length > 0 });
    }
  });
}

async function applyMask(editor, selected, remaining) {
  if (!selected.length) return;
  const text = getText(editor);
  const { masked, applied } = mask(text, selected, session);
  if (masked !== text) {
    setText(editor, masked);
    await saveSession(session);
    const counts = {};
    for (const f of applied) counts[f.type] = (counts[f.type] ?? 0) + 1;
    bumpStats(counts);
  }
  skippedText = null;
  clearState(editor);
  overlay.showNotice({ anchor: editor, text: t('maskedNotice', [String(applied.length)]) });
  if (remaining > 0) setTimeout(() => runScan(editor), 300);
}

function clearState(editor, { keepBlock = false } = {}) {
  editor.classList.remove('tpg-editor-flagged');
  overlay.hide();
  if (!keepBlock) setBlocked(editor, false);
}

function interceptSend(e, editor) {
  if (blocked) {
    e.preventDefault();
    e.stopImmediatePropagation();
    if (editor && !overlay.visible) runScan(editor);
    return;
  }
  if (settings.mode !== 'auto' || !editor) return;
  const text = getText(editor);
  const strong = scanTail(text, { enabled: settings.detectors }).filter((f) => f.confidence >= AUTO_MASK_THRESHOLD);
  if (!strong.length) return;
  e.preventDefault();
  e.stopImmediatePropagation();
  clearTimeout(scanTimer);
  lastInputWasPaste = true;
  applyMask(editor, strong, 0);
}

function onKeydownCapture(e) {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) interceptSend(e, e.currentTarget);
}

function onClickCapture(e) {
  const btn = e.target.closest?.('button');
  if (!btn || !activeEditor || !findSendButton(site, activeEditor)) return;
  if (btn === findSendButton(site, activeEditor)) interceptSend(e, activeEditor);
}

function setBlocked(editor, on) {
  blocked = on;
  editor.classList.toggle('tpg-editor-blocked', on);
  const btn = findSendButton(site, editor);
  if (btn) {
    if (on) {
      btn.dataset.tpgBlocked = '1';
      btn.setAttribute('aria-disabled', 'true');
      btn.title = t('blockedNotice');
      btn.style.pointerEvents = 'none';
      btn.style.opacity = '0.4';
    } else if (btn.dataset.tpgBlocked) {
      delete btn.dataset.tpgBlocked;
      btn.removeAttribute('aria-disabled');
      btn.title = '';
      btn.style.pointerEvents = '';
      btn.style.opacity = '';
    }
  }
}

function onSubmitCapture(e) {
  interceptSend(e, activeEditor);
}

function attach(editor) {
  if (editors.has(editor)) return;
  editors.add(editor);
  editor.addEventListener('input', () => { lastInputWasPaste = false; scheduleScan(editor); });
  editor.addEventListener('paste', () => setTimeout(() => { lastInputWasPaste = true; scheduleScan(editor); }, 0));
  editor.addEventListener('blur', () => { if (settings.mode === 'auto') scheduleScan(editor); });
  editor.addEventListener('focus', () => { activeEditor = editor; });
  editor.addEventListener('keydown', onKeydownCapture, true);
  editor.closest('form')?.addEventListener('submit', onSubmitCapture, true);
  if (getText(editor).trim()) scheduleScan(editor);
}

function attachAll() {
  for (const el of findEditors(site)) attach(el);
}

function isSkippable(el) {
  return el.closest('[data-tpg-ui]') !== null
    || el.isContentEditable
    || el.closest('[contenteditable="true"], [role="textbox"]') !== null;
}

function runUnmask() {
  if (!session || !Object.keys(session.reverse).length) return;
  replaceInTextNodes(document.body, (s) => (hasPlaceholder(s) ? unmask(s, session) : s), isSkippable);
}

function scheduleUnmask() {
  clearTimeout(unmaskTimer);
  unmaskTimer = setTimeout(runUnmask, UNMASK_DEBOUNCE_MS);
}

function observe() {
  const mo = new MutationObserver((records) => {
    let editorsMayChange = false;
    let textMayChange = false;
    for (const r of records) {
      if (r.type === 'characterData') textMayChange = true;
      else if (r.addedNodes.length) { editorsMayChange = true; textMayChange = true; }
    }
    if (editorsMayChange) attachAll();
    if (textMayChange) scheduleUnmask();
    if (blocked && activeEditor?.isConnected) setBlocked(activeEditor, true);
  });
  mo.observe(document.body, { childList: true, subtree: true, characterData: true });
}

async function main() {
  settings = await getSettings();
  onSettingsChanged((next) => {
    settings = { ...settings, ...next };
    if (activeEditor) { skippedText = null; scheduleScan(activeEditor); }
  });
  const tabId = await getTabId();
  session = await loadSession(tabId);
  attachAll();
  observe();
  document.addEventListener('click', onClickCapture, true);
  runUnmask();
}

main();
