# Thai PDPA Guard

Chrome extension (Manifest V3) that detects Thai personal data in AI chat inputs
(ChatGPT, Claude, Gemini), masks it with meaningful placeholders before you send,
and unmasks the AI's reply automatically.

**Single purpose:** ตรวจจับและปิดบังข้อมูลส่วนบุคคลของไทยในกล่องข้อความก่อนผู้ใช้กดส่ง

Everything runs on-device. The codebase contains no network requests.

## Detected types

| type | description |
|---|---|
| `thai_id` | Thai national ID / tax ID (13 digits, mod-11 checksum + context scoring) |
| `thai_phone` | Thai mobile and landline numbers |
| `email` | Email addresses |
| `credit_card` | Credit cards (Luhn + brand prefix) |
| `bank_account` | Thai bank account numbers (requires bank/account context) |
| `thai_plate` | Thai license plates (requires context) |
| `thai_address` | Thai addresses (ตำบล/อำเภอ/จังหวัด/postcode signals) |
| `thai_name` | Thai person names (title + name words) |
| `passport` | Passport numbers (requires context) |

## Development

Requires Node.js 20+. No runtime dependencies.

```bash
npm test
```

```bash
npm run lint
```

Renders `store/icon.svg` to `assets/icon-*.png` and the promo tile with headless Chrome
(needs Chrome installed; set `CHROME_PATH` if it is not in the default location):

```bash
npm run icons
```

### Playground (no extension needed)

Serves `dev/playground.html` with a stubbed `chrome.*` API so the overlay, mask and
unmask flow can be exercised in any browser. `npm run pack` excludes `dev/`, `scripts/`,
`store/` and `test/` automatically.

```bash
node scripts/dev-server.js
```

### Build for the store

Runs lint + tests, then writes `dist/thai-pdpa-guard-<version>.zip` containing only
shipped files (`manifest.json`, `sw.js`, `src/`, `popup/`, `options/`, `_locales/`, `assets/`).

```bash
npm run pack
```

Listing copy, permission justifications and screenshot plan: [store/LISTING.md](./store/LISTING.md).
Submission checklist: [store/SUBMIT-CHECKLIST.md](./store/SUBMIT-CHECKLIST.md).

### Publish privacy policy

The store needs a public URL. Push this repo to GitHub, enable Pages (Settings → Pages →
Deploy from branch `main`, folder `/`), then use `https://<user>.github.io/thai-pdpa-guard/PRIVACY`.

### Daily site monitor (outside the extension)

`scripts/monitor.js` opens each supported site in a dedicated Chrome profile via the
DevTools Protocol, checks that the editor and send button the extension relies on still
match `src/sites/index.js`, and pushes a LINE message (✅ every day, 🚨 when a site
changed, ⚠️ when the profile needs a fresh login). No message = the monitor or the PC is
down. This script lives in `scripts/` and is never shipped; the extension itself still
makes no network requests.

```bash
node scripts/monitor.js --login
```
Log in to ChatGPT, Claude and Gemini in the window that opens, then close it (once).

```bash
node scripts/monitor.js
```
Copy `monitor.config.example.json` to `monitor.config.json` with your LINE Messaging API
channel access token and user ID to enable the LINE push. Schedule it daily at 09:00:

```bash
powershell -ExecutionPolicy Bypass -File scripts/monitor-install.ps1
```

### Load unpacked

1. Open `chrome://extensions`
2. Enable Developer mode
3. Load unpacked → select this folder

## Layout

```
manifest.json
sw.js                  service worker: settings defaults, session map cleanup
src/content.js         content script loader (imports src/app.js as an ES module)
src/app.js             content script logic: scan, overlay, mask, unmask, modes
src/core/              scanner, mapper, settings, types
src/detectors/         one file per data type + registry
src/ai/nano.js         Gemini Nano adapter (optional layer)
src/ui/                overlay
src/sites/             per-site DOM adapters
src/data/              Thai dictionaries (provinces, titles, banks)
popup/  options/       extension pages
_locales/              th + en
test/                  node:test suites + synthetic fixtures
```

## Privacy

See [PRIVACY.md](./PRIVACY.md).
