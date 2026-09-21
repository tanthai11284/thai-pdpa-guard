const EDITOR_GENERIC = 'textarea, [contenteditable="true"], [role="textbox"]';

const SITES = [
  {
    id: 'chatgpt',
    hosts: ['chatgpt.com', 'chat.openai.com'],
    editor: '#prompt-textarea, #mobile-composer-prompt, form textarea, form [contenteditable="true"]',
    send: 'button[data-testid="send-button"], button[aria-label="Send message"], button[aria-label="Send prompt"], form button[type="submit"]',
    response: '[data-message-author-role="assistant"], [data-message-author-role="user"], article'
  },
  {
    id: 'claude',
    hosts: ['claude.ai'],
    editor: 'div[contenteditable="true"].ProseMirror, fieldset [contenteditable="true"], [contenteditable="true"]',
    send: 'button[aria-label="Send message"], button[aria-label="Send Message"], fieldset button[type="submit"]',
    response: '.font-claude-message, .font-claude-response, [data-testid="assistant-message"], [data-testid="user-message"], .font-user-message'
  },
  {
    id: 'gemini',
    hosts: ['gemini.google.com'],
    editor: 'rich-textarea .ql-editor, .ql-editor[contenteditable="true"], [contenteditable="true"]',
    send: 'button.send-button, button[aria-label="Send message"], button[aria-label="ส่งข้อความ"], button[mattooltip="Send message"]',
    response: 'model-response, message-content, .model-response-text, user-query, .query-text'
  }
];

const GENERIC = {
  id: 'generic',
  hosts: [],
  editor: EDITOR_GENERIC,
  send: 'button[type="submit"], button[aria-label*="send" i]',
  response: 'main, article'
};

export function siteFor(host = location.host) {
  return SITES.find((s) => s.hosts.some((h) => host === h || host.endsWith(`.${h}`))) ?? GENERIC;
}

export function findEditors(site, root = document) {
  const seen = new Set();
  const out = [];
  for (const sel of [site.editor, EDITOR_GENERIC]) {
    for (const el of root.querySelectorAll(sel)) {
      if (seen.has(el) || !isEditorCandidate(el)) continue;
      seen.add(el);
      out.push(el);
    }
  }
  return out;
}

function isEditorCandidate(el) {
  if (el.closest('[data-tpg-ui]')) return false;
  if (el.tagName === 'INPUT') return false;
  if (el.getAttribute('aria-hidden') === 'true') return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

export function findSendButton(site, editor) {
  const scope = editor?.closest('form, fieldset, [class*="composer"], [class*="input"]') ?? document;
  return scope.querySelector(site.send) ?? document.querySelector(site.send);
}
