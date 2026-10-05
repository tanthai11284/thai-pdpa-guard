import { scan } from '../src/core/scanner.js';
import { createSession, mask } from '../src/core/mapper.js';

export const LINKS = {
  line: '',
  site: 'https://pdpa.tm8labs.com/',
  email: 'support@tm8labs.com'
};

const t = (key, subs) => chrome.i18n.getMessage(key, subs) || key;

for (const el of document.querySelectorAll('[data-i18n]')) {
  el.textContent = t(el.dataset.i18n);
}
document.documentElement.lang = chrome.i18n.getUILanguage().startsWith('th') ? 'th' : 'en';

const line = document.getElementById('line');
if (LINKS.line) {
  line.href = LINKS.line;
  line.hidden = false;
}
document.getElementById('site').href = LINKS.site;
document.getElementById('mail').href = `mailto:${LINKS.email}`;

const sample = document.getElementById('sample');
const count = document.getElementById('count');
const masked = document.getElementById('masked');

function render() {
  const text = sample.value;
  const findings = scan(text);
  count.textContent = t('foundItems', [String(findings.length)]);
  masked.textContent = mask(text, findings, createSession(null)).masked;
}

sample.value = t('welcomeTrySample');
sample.addEventListener('input', render);
render();
