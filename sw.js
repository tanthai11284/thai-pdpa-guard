import { DEFAULT_SETTINGS, DEFAULT_STATS } from './src/core/settings.js';

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

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'getTabId') {
    sendResponse({ tabId: sender.tab?.id ?? null });
    return false;
  }
  if (msg?.type === 'clearAllSessions') {
    chrome.storage.session.clear().then(() => sendResponse({ ok: true }));
    return true;
  }
  return false;
});
