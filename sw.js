import { DEFAULT_SETTINGS, DEFAULT_STATS } from './src/core/settings.js';
import * as nano from './src/ai/nano.js';

const SESSION_ACCESS = { accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS' };

async function ensureDefaults() {
  const { settings, stats } = await chrome.storage.local.get(['settings', 'stats']);
  const patch = {};
  if (!settings) patch.settings = DEFAULT_SETTINGS;
  if (!stats) patch.stats = { ...DEFAULT_STATS, byType: {} };
  if (Object.keys(patch).length) await chrome.storage.local.set(patch);
}

chrome.runtime.onInstalled.addListener(async () => {
  await chrome.storage.session.setAccessLevel(SESSION_ACCESS);
  await ensureDefaults();
});

chrome.runtime.onStartup.addListener(async () => {
  await chrome.storage.session.setAccessLevel(SESSION_ACCESS);
});

chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.session.remove(`map:${tabId}`);
});

async function nanoEnabled() {
  const { settings } = await chrome.storage.local.get('settings');
  return settings?.useNano !== false;
}

const handlers = {
  getTabId: async (_msg, sender) => ({ tabId: sender.tab?.id ?? null }),
  clearAllSessions: async () => { await chrome.storage.session.clear(); return { ok: true }; },
  'nano:status': async () => {
    if (!(await nanoEnabled())) return { status: 'off', reason: 'off' };
    return { status: await nano.status(), reason: nano.reason() };
  },
  'nano:warmUp': async () => {
    if (!(await nanoEnabled())) return { ok: false, status: 'off' };
    const ok = await nano.warmUp((loaded, total) => {
      chrome.runtime.sendMessage({ type: 'nano:progress', loaded, total }).catch(() => {});
    });
    return { ok, status: await nano.status(), reason: nano.reason() };
  },
  'nano:findEntities': async (msg) => {
    if (!(await nanoEnabled()) || !(await nano.isAvailable())) return { findings: [] };
    return { findings: await nano.findThaiEntities(String(msg.text ?? '')) };
  }
};

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const h = handlers[msg?.type];
  if (!h) return false;
  h(msg, sender).then(sendResponse, () => sendResponse({ error: true }));
  return true;
});
