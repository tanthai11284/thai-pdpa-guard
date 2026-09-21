import { DETECTOR_TYPES, getSettings, saveSettings } from '../src/core/settings.js';

const t = (key, subs) => chrome.i18n.getMessage(key, subs);

for (const el of document.querySelectorAll('[data-i18n]')) {
  el.textContent = t(el.dataset.i18n);
}

function flash() {
  const el = document.getElementById('status');
  el.textContent = t('saved');
  setTimeout(() => { el.textContent = ''; }, 1500);
}

async function init() {
  const settings = await getSettings();

  for (const radio of document.querySelectorAll('input[name="mode"]')) {
    radio.checked = radio.value === settings.mode;
    radio.addEventListener('change', async () => {
      await saveSettings({ mode: radio.value });
      flash();
    });
  }

  const box = document.getElementById('detectors');
  for (const type of DETECTOR_TYPES) {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = settings.detectors[type] !== false;
    input.addEventListener('change', async () => {
      await saveSettings({ detectors: { [type]: input.checked } });
      flash();
    });
    label.append(input, ' ', t(`type_${type}`));
    box.append(label);
  }

  const nano = document.getElementById('useNano');
  nano.checked = settings.useNano;
  nano.addEventListener('change', async () => {
    await saveSettings({ useNano: nano.checked });
    flash();
    renderNanoStatus();
  });
  document.getElementById('nanoWarmUp').addEventListener('click', warmUpNano);
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === 'nano:progress') {
      const p = document.getElementById('nanoProgress');
      p.hidden = false;
      p.value = msg.total ? msg.loaded / msg.total : 0;
      document.getElementById('nanoStatus').textContent = t('nanoDownloading');
    }
  });
  renderNanoStatus();
}

const STATUS_KEYS = { ready: 'nanoReady', downloadable: 'nanoDownloadable', downloading: 'nanoDownloading', unsupported: 'nanoUnsupported', off: 'nanoOff' };

async function renderNanoStatus() {
  const el = document.getElementById('nanoStatus');
  const btn = document.getElementById('nanoWarmUp');
  let status = 'unsupported';
  try {
    const res = await chrome.runtime.sendMessage({ type: 'nano:status' });
    status = res?.status ?? 'unsupported';
  } catch { /* service worker unavailable */ }
  el.textContent = t(STATUS_KEYS[status] ?? 'nanoUnsupported');
  btn.hidden = status !== 'downloadable';
  document.getElementById('nanoProgress').hidden = status !== 'downloading';
}

async function warmUpNano() {
  const btn = document.getElementById('nanoWarmUp');
  btn.disabled = true;
  document.getElementById('nanoStatus').textContent = t('nanoDownloading');
  document.getElementById('nanoProgress').hidden = false;
  try { await chrome.runtime.sendMessage({ type: 'nano:warmUp' }); } catch { /* ignore */ }
  btn.disabled = false;
  renderNanoStatus();
}

init();
