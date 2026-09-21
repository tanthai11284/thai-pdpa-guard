# Privacy Policy — Thai PDPA Guard

Last updated: 2026-09-21

## Summary

Thai PDPA Guard processes everything on your device. It does not collect, transmit,
or store your personal data or the content you type anywhere outside your browser.

## What the extension does

The extension has a single purpose: detect Thai personal data (national ID numbers,
phone numbers, emails, names, addresses, bank accounts, credit cards, license plates,
passport numbers) in the text box of supported AI chat websites, mask it with
placeholders before you send, and restore the original values in the AI's reply.

## Data handling

- **No network requests.** The extension's code makes no network calls of any kind.
- **Content you type** is scanned in memory inside the content script on the page.
  It is never written to disk and never leaves your browser.
- **Mask/unmask mapping table** (placeholder → original value) is kept in
  `chrome.storage.session`, which lives only in memory for the current browser
  session, is scoped to the tab, is deleted when the tab closes, and is wiped when
  the browser closes. It is never written to `chrome.storage.local`.
- **Settings** (mode, enabled detectors, language) are stored in
  `chrome.storage.local`. They contain no personal data.
- **Statistics** stored locally are counters only (e.g. "masked 12 items"). They never
  contain values or fragments of values.
- **Gemini Nano (optional):** when enabled and supported, detection may use Chrome's
  built-in on-device model. This runs locally inside Chrome; no data is sent to Google
  or anyone else by this extension.

## Permissions

| permission | why |
|---|---|
| `storage` | save settings and counters locally; hold the session mapping table in memory |
| `host_permissions` for chatgpt.com, chat.openai.com, claude.ai, gemini.google.com | run the content script only on supported AI chat sites |

## Data sharing

None. There is no backend, no analytics, no telemetry.

## Contact

tanthailove2012@gmail.com
