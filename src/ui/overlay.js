import { AUTO_MASK_THRESHOLD } from '../core/types.js';

const t = (key, subs) => chrome.i18n.getMessage(key, subs) || key;

const STYLE = `
:host { all: initial; }
* { box-sizing: border-box; }
.bar {
  position: fixed; z-index: 2147483646; max-width: min(560px, calc(100vw - 32px));
  font: 13px/1.4 system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans Thai", sans-serif;
  color: #1a1a1a; background: #fff7ed; border: 1px solid #f59e0b; border-radius: 10px;
  box-shadow: 0 6px 24px rgba(0,0,0,.18); padding: 10px 12px;
}
.bar.blocked { background: #fef2f2; border-color: #dc2626; }
.bar.info { background: #ecfdf5; border-color: #10b981; }
.head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.title { font-weight: 600; flex: 1 1 auto; }
button {
  font: inherit; cursor: pointer; border-radius: 6px; padding: 5px 10px;
  border: 1px solid #d97706; background: #fff; color: #92400e;
}
button.primary { background: #d97706; color: #fff; }
button:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }
.list { margin: 10px 0 0; padding: 0; list-style: none; max-height: 220px; overflow: auto; }
.list li { display: flex; align-items: center; gap: 8px; padding: 4px 0; border-top: 1px solid rgba(0,0,0,.08); }
.type { font-weight: 600; min-width: 90px; }
.val { font-family: ui-monospace, Consolas, monospace; flex: 1; word-break: break-all; }
.badge { font-size: 11px; padding: 1px 6px; border-radius: 999px; background: #fde68a; color: #78350f; }
.foot { display: flex; gap: 8px; margin-top: 8px; justify-content: flex-end; }
.close { border: none; background: transparent; font-size: 16px; padding: 0 4px; color: inherit; }
@media (prefers-color-scheme: dark) {
  .bar { color: #f5f5f5; background: #3b2a12; border-color: #f59e0b; }
  .bar.blocked { background: #3f1d1d; }
  .bar.info { background: #12352a; }
  button { background: #1f1f1f; color: #fcd34d; border-color: #b45309; }
  button.primary { background: #d97706; color: #fff; }
  .badge { background: #78350f; color: #fde68a; }
  .list li { border-top-color: rgba(255,255,255,.12); }
}
`;

export function maskMiddle(value) {
  const v = String(value);
  if (v.length <= 4) return v[0] + '***';
  const head = Math.max(2, Math.ceil(v.length / 3));
  const tail = v.length > 8 ? 2 : 1;
  return `${v.slice(0, head)}***${v.slice(-tail)}`;
}

export class Overlay {
  constructor() {
    this.host = document.createElement('div');
    this.host.setAttribute('data-tpg-ui', '');
    this.shadow = this.host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = STYLE;
    this.shadow.append(style);
    this.bar = null;
    this.anchor = null;
    this.onReposition = () => this.position();
  }

  mount() {
    if (!this.host.isConnected) document.documentElement.append(this.host);
    window.addEventListener('scroll', this.onReposition, true);
    window.addEventListener('resize', this.onReposition);
  }

  hide() {
    this.bar?.remove();
    this.bar = null;
    this.anchor = null;
    if (this.onEscape) document.removeEventListener('keydown', this.onEscape, true);
    this.onEscape = null;
    window.removeEventListener('scroll', this.onReposition, true);
    window.removeEventListener('resize', this.onReposition);
  }

  get visible() {
    return Boolean(this.bar);
  }

  position() {
    if (!this.bar || !this.anchor?.isConnected) return;
    const r = this.anchor.getBoundingClientRect();
    const h = this.bar.offsetHeight;
    let top = r.top - h - 8;
    if (top < 8) top = Math.min(r.bottom + 8, window.innerHeight - h - 8);
    this.bar.style.top = `${Math.max(8, top)}px`;
    this.bar.style.left = `${Math.max(8, r.left)}px`;
  }

  showFindings({ anchor, findings, mode, onMask, onSkip }) {
    this.mount();
    this.bar?.remove();
    this.anchor = anchor;
    const bar = document.createElement('div');
    bar.className = `bar${mode === 'block' ? ' blocked' : ''}`;
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', t('foundItems', [String(findings.length)]));
    bar.tabIndex = -1;

    const head = document.createElement('div');
    head.className = 'head';
    const title = document.createElement('span');
    title.className = 'title';
    title.textContent = `⚠️ ${t('foundItems', [String(findings.length)])}`;
    const maskAll = button(t('maskAll'), 'primary', () => onMask(findings));
    const view = button(t('viewList'), '', () => toggleList());
    view.setAttribute('aria-expanded', 'false');
    const skip = button(t('skipOnce'), '', () => onSkip());
    const close = button('×', 'close', () => onSkip());
    close.setAttribute('aria-label', t('closeOverlay'));
    head.append(title, maskAll, view, skip, close);
    bar.append(head);

    if (mode === 'block') {
      const note = document.createElement('div');
      note.textContent = t('blockedNotice');
      note.style.marginTop = '6px';
      bar.append(note);
    }

    let list = null;
    const toggleList = () => {
      if (list) { list.remove(); list = null; view.setAttribute('aria-expanded', 'false'); this.position(); return; }
      list = document.createElement('div');
      const ul = document.createElement('ul');
      ul.className = 'list';
      const boxes = [];
      findings.forEach((f, i) => {
        const li = document.createElement('li');
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.id = `tpg-f-${i}`;
        cb.checked = f.confidence >= AUTO_MASK_THRESHOLD;
        boxes.push(cb);
        const label = document.createElement('label');
        label.htmlFor = cb.id;
        label.style.display = 'contents';
        const type = document.createElement('span');
        type.className = 'type';
        type.textContent = t(`type_${f.type}`);
        const val = document.createElement('span');
        val.className = 'val';
        val.textContent = maskMiddle(f.value);
        label.append(type, val);
        li.append(cb, label);
        if (f.confidence < AUTO_MASK_THRESHOLD) {
          const badge = document.createElement('span');
          badge.className = 'badge';
          badge.textContent = t('probablyPII');
          li.append(badge);
        }
        ul.append(li);
      });
      const foot = document.createElement('div');
      foot.className = 'foot';
      foot.append(button(t('maskSelected'), 'primary', () => onMask(findings.filter((_, i) => boxes[i].checked))));
      list.append(ul, foot);
      bar.append(list);
      view.setAttribute('aria-expanded', 'true');
      this.position();
      boxes[0]?.focus();
    };

    this.onEscape = (e) => {
      if (e.key === 'Escape' && this.bar === bar) { e.stopPropagation(); onSkip(); }
    };
    document.addEventListener('keydown', this.onEscape, true);

    this.bar = bar;
    this.shadow.append(bar);
    this.position();
  }

  showNotice({ anchor, text, ms = 4000 }) {
    this.mount();
    this.bar?.remove();
    this.anchor = anchor;
    const bar = document.createElement('div');
    bar.className = 'bar info';
    bar.setAttribute('role', 'status');
    bar.textContent = `✅ ${text}`;
    this.bar = bar;
    this.shadow.append(bar);
    this.position();
    setTimeout(() => { if (this.bar === bar) this.hide(); }, ms);
  }
}

function button(label, cls, onClick) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = cls;
  b.textContent = label;
  b.addEventListener('click', (e) => { e.preventDefault(); onClick(); });
  return b;
}
