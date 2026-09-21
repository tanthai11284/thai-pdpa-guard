import { getStats, resetStats } from '../src/core/settings.js';

const t = (key, subs) => chrome.i18n.getMessage(key, subs);

for (const el of document.querySelectorAll('[data-i18n]')) {
  el.textContent = t(el.dataset.i18n);
}

async function render() {
  const stats = await getStats();
  document.getElementById('total').textContent = String(stats.totalMasked);
}

document.getElementById('clear').addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'clearAllSessions' });
  await resetStats();
  document.getElementById('status').textContent = t('clearedData');
  await render();
});

document.getElementById('options').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

render();
