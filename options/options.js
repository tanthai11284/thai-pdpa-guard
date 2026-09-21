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
  });
  document.getElementById('nanoStatus').textContent = settings.useNano ? '' : t('nanoOff');
}

init();
