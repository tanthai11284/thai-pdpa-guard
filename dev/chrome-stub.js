(() => {
  const lang = new URLSearchParams(location.search).get('lang') || 'th';
  const xhr = new XMLHttpRequest();
  xhr.open('GET', `/_locales/${lang}/messages.json`, false);
  xhr.send();
  const messages = JSON.parse(xhr.responseText);
  window.chrome = {
    i18n: {
      getMessage: (k, subs) => (messages[k]?.message ?? '').replace('$COUNT$', subs?.[0] ?? ''),
      getUILanguage: () => lang
    },
    runtime: { getURL: (p) => '/' + p, sendMessage: async () => ({}) },
    tabs: { create: ({ url }) => window.open(url) },
    storage: { local: { get: async () => ({}), set: async () => {} }, onChanged: { addListener() {} } }
  };
})();
