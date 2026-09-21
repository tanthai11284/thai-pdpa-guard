export const DETECTOR_TYPES = [
  'thai_id', 'thai_phone', 'email', 'credit_card', 'bank_account',
  'thai_plate', 'thai_address', 'thai_name', 'passport'
];

export const DEFAULT_SETTINGS = Object.freeze({
  mode: 'warn',
  detectors: Object.fromEntries(DETECTOR_TYPES.map((t) => [t, true])),
  useNano: true,
  customPatterns: [],
  locale: 'auto'
});

export const DEFAULT_STATS = Object.freeze({
  totalMasked: 0,
  byType: {},
  lastResetAt: 0
});

export async function getSettings() {
  const { settings } = await chrome.storage.local.get('settings');
  return {
    ...DEFAULT_SETTINGS,
    ...settings,
    detectors: { ...DEFAULT_SETTINGS.detectors, ...(settings?.detectors ?? {}) }
  };
}

export async function saveSettings(patch) {
  const current = await getSettings();
  const next = {
    ...current,
    ...patch,
    detectors: { ...current.detectors, ...(patch.detectors ?? {}) }
  };
  await chrome.storage.local.set({ settings: next });
  return next;
}

export async function getStats() {
  const { stats } = await chrome.storage.local.get('stats');
  return { ...DEFAULT_STATS, ...stats, byType: { ...(stats?.byType ?? {}) } };
}

export async function bumpStats(counts) {
  const stats = await getStats();
  for (const [type, n] of Object.entries(counts)) {
    stats.totalMasked += n;
    stats.byType[type] = (stats.byType[type] ?? 0) + n;
  }
  await chrome.storage.local.set({ stats });
  return stats;
}

export async function resetStats() {
  const stats = { ...DEFAULT_STATS, byType: {}, lastResetAt: Date.now() };
  await chrome.storage.local.set({ stats });
  return stats;
}

export function onSettingsChanged(callback) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.settings) callback(changes.settings.newValue);
  });
}
