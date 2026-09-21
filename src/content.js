(() => {
  if (window.__thaiPdpaGuardLoaded) return;
  window.__thaiPdpaGuardLoaded = true;
  import(chrome.runtime.getURL('src/app.js'));
})();
