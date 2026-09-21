# Thai PDPA Guard — Build Specification

> เอกสารนี้เป็น **สเปกสำหรับสั่ง Claude Code สร้างโปรเจกต์**
> วิธีใช้: วางไฟล์นี้ไว้ที่ root ของโฟลเดอร์โปรเจกต์ว่าง แล้วสั่ง
> `อ่าน THAI-PDPA-GUARD-SPEC.md แล้วทำ Phase 0 และ Phase 1 ให้จบ`
>
> สถานะ: v1.0 — 21 ก.ย. 2026
> เป้าหมายรอบนี้: MVP ที่โหลดเข้า Chrome แบบ unpacked แล้วใช้งานได้จริง

---

## 0. TL;DR สำหรับ agent

สร้าง Chrome Extension (Manifest V3) ชื่อ **Thai PDPA Guard** ที่ตรวจจับข้อมูลส่วนบุคคลของไทยในกล่องข้อความของเว็บ AI chat แล้วปิดบังด้วย placeholder ก่อนผู้ใช้กดส่ง และ **ถอดกลับ (unmask) อัตโนมัติ** ในคำตอบที่ AI ตอบกลับมา

**ข้อบังคับเด็ดขาด 3 ข้อ:**
1. ข้อมูลทุกอย่างประมวลผลในเครื่อง **ห้ามมี network request ออกไปที่ใดก็ตามในโค้ดทั้งโปรเจกต์** (ยกเว้น Phase 4 ที่เป็นระบบไลเซนส์ และต้องส่งเฉพาะ license key ไม่มีเนื้อหาผู้ใช้)
2. ห้าม obfuscate โค้ด (minify ได้) — ผิดนโยบาย Chrome Web Store โดยตรง
3. ห้ามขอ permission ที่โค้ดไม่ได้ใช้จริง และ **ห้ามใช้ `<all_urls>` หรือ `*://*/*` ใน `host_permissions`**

---

## 1. บริบทและเหตุผลของสินค้า

### 1.1 ปัญหา
พนักงานไทยวางข้อมูลลูกค้า (เลขบัตรประชาชน ชื่อ เบอร์โทร ที่อยู่ เลขบัญชี) ลงใน ChatGPT / Claude / Gemini ทุกวัน องค์กรไม่มีทางรู้และไม่มีเครื่องมือกั้น

### 1.2 ทำไมถึงมีที่ว่างในตลาด
มีส่วนขยาย PII redaction ในตลาดแล้วอย่างน้อย 8 ตัว (MaskPrompt, PrivacyScrubber, PasteSecure, ChatGPT PII Redactor, Caviard, Private Guard, redact.tools, PrivacyPromptAI) แต่**ทุกตัวจับเฉพาะ PII แบบอเมริกัน** (SSN, credit card, US phone/address)
ไม่มีตัวไหนรู้จัก:
- เลขบัตรประชาชนไทย 13 หลัก (ต้องใช้ checksum mod 11 ของกรมการปกครอง)
- เลขประจำตัวผู้เสียภาษีไทย
- ทะเบียนรถไทย / ที่อยู่แบบไทย (ตำบล-อำเภอ-จังหวัด) / คำนำหน้าชื่อไทย

### 1.3 แรงจูงใจในการจ่ายเงินของลูกค้า (ใช้เป็น copy ในหน้าสโตร์)
- PDPA มีโทษปรับทางปกครองสูงสุด **5,000,000 บาท**
- คดีจริง: **JIB Computer Group ถูกปรับรวม 7,000,000 บาท** (31 ก.ค. 2567) — ไม่แต่งตั้ง DPO 1 ล้าน, มาตรการความปลอดภัยไม่พอ 3 ล้าน, ไม่แจ้งเหตุละเมิดใน 72 ชม. อีก 3 ล้าน
- ธุรกิจไทย 43% ใช้ AI แล้ว แต่ 34% **ไม่มีนโยบายกำกับดูแล AI เลย** และ 47% มีแบบไม่เป็นทางการ

---

## 2. ขอบเขต

### 2.1 Single Purpose statement (ต้องใช้ประโยคนี้ตลอดทั้งโปรเจกต์)
> **"ตรวจจับและปิดบังข้อมูลส่วนบุคคลของไทยในกล่องข้อความก่อนผู้ใช้กดส่ง"**

Chrome Web Store ปฏิเสธส่วนขยายที่รวมหลายฟีเจอร์ที่ไม่เกี่ยวกัน ทุกฟีเจอร์ต้องตอบได้ว่ารับใช้ประโยคนี้

### 2.2 In scope (Phase 1–3)
- ตรวจจับ PII ไทย + สากลพื้นฐาน ในช่อง input/textarea/contenteditable
- ปิดบังด้วย placeholder ที่สื่อความหมายและคงเส้นคงวา
- ถอดกลับอัตโนมัติในข้อความตอบของ AI
- UI overlay แสดงรายการที่พบ + ปุ่มปิดบังทั้งหมด / เลือกทีละรายการ
- ตั้งค่าเปิด-ปิดแต่ละ detector
- i18n ไทย + อังกฤษ

### 2.3 Out of scope (อย่าทำในรอบนี้)
- ไม่ทำ backend / ไม่ทำ account system
- ไม่ทำ analytics ใดๆ ที่แตะเนื้อหาผู้ใช้
- ไม่ทำ OCR / ไม่แตะรูปภาพ
- ไม่ทำ auto-submit หรือแก้ไขข้อความแทนผู้ใช้โดยไม่ขออนุญาต
- ไม่ทำ browser อื่นในรอบนี้ (Firefox/Edge ค่อยว่ากัน)

---

## 3. Tech stack และข้อจำกัดของแพลตฟอร์ม

| หัวข้อ | ข้อกำหนด |
|---|---|
| Manifest | **V3 เท่านั้น** — MV2 ส่งใหม่ไม่ได้แล้ว |
| Background | Service worker (`type: "module"`) — **ถูกฆ่าเมื่อ idle ห้ามเก็บ state ในตัวแปร** |
| ภาษา | Vanilla JS (ES modules) — **ห้ามใช้ framework/bundler ในรอบนี้** เพื่อให้ reviewer อ่านโค้ดง่าย |
| Remote code | **ห้ามโหลดโค้ดจากภายนอกมารัน** ผิดนโยบาย MV3 |
| Obfuscation | ห้าม (minify ได้) |
| Storage | `chrome.storage.local` และ `chrome.storage.session` เท่านั้น |
| Test runner | Node.js + `node:test` (ไม่ต้องลง dependency เพิ่ม) |

### 3.1 Chrome Built-in AI (Gemini Nano) — ใช้ใน Phase 3
สถานะ ณ Chrome 148:
- **Stable:** Prompt API, Summarizer API, Translator API, Language Detector API
- **Origin trial:** Writer, Rewriter, Proofreader
- ต้นทุนต่อการเรียกโมเดล: **ศูนย์**
- ความเร็ว token แรก: ต่ำกว่า 200ms (เครื่องที่มี GPU แยก)
- **ข้อกำหนดเครื่อง: RAM ≥ 16 GB, พื้นที่ว่าง ≥ 22 GB (หรือ VRAM ≥ 4 GB)**
- ขนาดโมเดล 2.7–4 GB โหลดอัตโนมัติครั้งแรกที่เรียก
- **Context window แค่ 8,000 tokens** → ห้ามส่งข้อความยาวทั้งก้อน ต้องหั่นเป็นชิ้น
- ไม่รองรับ iOS

> ⚠️ **คำสั่งถึง agent:** surface ของ Prompt API เปลี่ยนชื่อมาหลายรอบในอดีต (`chrome.aiOriginTrial.languageModel` → `ai.languageModel` → `LanguageModel`)
> **ห้ามเดา** ให้เขียนเป็น adapter ที่ feature-detect หลายชื่อ และถ้าไม่เจอให้ fallback เงียบๆ ไปใช้ dictionary mode
> ถ้ามีเน็ต ให้เช็ค `https://developer.chrome.com/docs/ai/prompt-api` ก่อนเขียน

---

## 4. โครงสร้างไฟล์ที่ต้องสร้าง

```
/manifest.json
/sw.js                          # service worker: จัดการ settings, ไม่แตะเนื้อหา
/src/
  content.js                    # entry ของ content script
  core/
    scanner.js                  # orchestrator: รวมผลจากทุก detector
    mapper.js                   # mask ↔ unmask + ตารางแมป
    settings.js                 # อ่าน/เขียน chrome.storage
    types.js                    # JSDoc typedefs
  detectors/
    thai-id.js                  # เลขบัตรประชาชน + เลขผู้เสียภาษี (mod 11)
    thai-phone.js
    thai-plate.js               # ทะเบียนรถ
    thai-address.js             # ที่อยู่ (dictionary-based)
    thai-name.js                # ชื่อ (dictionary + Nano ใน Phase 3)
    bank-account.js
    credit-card.js              # Luhn
    email.js
    passport.js
    index.js                    # registry ของ detector ทั้งหมด
  ai/
    nano.js                     # adapter สำหรับ Prompt API + feature detection
  ui/
    overlay.js                  # แถบแจ้งเตือน + ไฮไลต์
    overlay.css
  data/
    provinces.th.js             # 77 จังหวัด
    districts-sample.th.js      # อำเภอ/เขต (ชุดย่อไว้ก่อน)
    titles.th.js                # นาย นาง นางสาว ด.ช. ด.ญ. ดร. ฯลฯ
    banks.th.js                 # ชื่อธนาคารไทย + คำพ้อง
/popup/
  popup.html  popup.js  popup.css
/options/
  options.html  options.js  options.css
/_locales/
  th/messages.json
  en/messages.json
/assets/
  icon-16.png icon-32.png icon-48.png icon-128.png
/test/
  fixtures/generate.js          # สร้างข้อมูลทดสอบสังเคราะห์
  thai-id.test.js
  scanner.test.js
  mapper.test.js
  negative-cases.test.js
/PRIVACY.md
/README.md
```

---

## 5. Manifest

```json
{
  "manifest_version": 3,
  "name": "__MSG_extName__",
  "description": "__MSG_extDesc__",
  "default_locale": "th",
  "version": "0.1.0",
  "minimum_chrome_version": "128",
  "icons": {
    "16": "assets/icon-16.png",
    "32": "assets/icon-32.png",
    "48": "assets/icon-48.png",
    "128": "assets/icon-128.png"
  },
  "permissions": ["storage", "activeTab", "scripting"],
  "host_permissions": [
    "https://chatgpt.com/*",
    "https://chat.openai.com/*",
    "https://claude.ai/*",
    "https://gemini.google.com/*"
  ],
  "optional_host_permissions": ["https://*/*"],
  "background": { "service_worker": "sw.js", "type": "module" },
  "content_scripts": [{
    "matches": [
      "https://chatgpt.com/*",
      "https://chat.openai.com/*",
      "https://claude.ai/*",
      "https://gemini.google.com/*"
    ],
    "js": ["src/content.js"],
    "css": ["src/ui/overlay.css"],
    "run_at": "document_idle"
  }],
  "action": { "default_popup": "popup/popup.html" },
  "options_page": "options/options.html"
}
```

**เหตุผลของการออกแบบ permission นี้:** Chrome ระบุชัดว่าสิ่งที่ทำให้รีวิวช้าคือ นักพัฒนาหน้าใหม่, host pattern แบบกว้าง, และ permission อ่อนไหว (tabs/cookies/webRequest/downloads)
เราเป็นนักพัฒนาหน้าใหม่อยู่แล้ว จึงต้องไม่โดนข้ออื่นเพิ่ม — ขอแค่ 4 โดเมน แล้วให้ผู้ใช้กดเพิ่มเว็บเองผ่าน `optional_host_permissions`

---

## 6. สเปก Detector

### 6.1 อินเทอร์เฟซกลาง

ทุก detector ต้อง export ฟังก์ชันหน้าตาเดียวกัน:

```js
/**
 * @typedef {Object} Finding
 * @property {string} type        - 'thai_id' | 'thai_phone' | 'email' | ...
 * @property {string} value       - ข้อความต้นฉบับที่ตรวจพบ
 * @property {number} start       - index เริ่ม ใน text
 * @property {number} end         - index จบ (exclusive)
 * @property {number} confidence  - 0..1
 * @property {string} [reason]    - เหตุผลที่ให้คะแนนนี้ (ไว้ debug)
 */

/**
 * @param {string} text
 * @returns {Finding[]}
 */
export function detect(text) { ... }
```

**กติกาคะแนน:**
- `confidence >= 0.80` → ปิดบังอัตโนมัติ (auto-mask)
- `0.50 <= confidence < 0.80` → แสดงเตือน ให้ผู้ใช้กดยืนยัน
- `< 0.50` → ทิ้ง ไม่แสดง

### 6.2 `thai-id.js` — ตัวสำคัญที่สุด

**อัลกอริทึม (ของกรมการปกครอง ตรวจสอบแล้ว):**
เอา 12 หลักแรกคูณน้ำหนักที่ไล่จาก 13 ลงมา 2 แล้วรวม จากนั้น
`check = (11 − (sum mod 11)) mod 10` ต้องตรงกับหลักที่ 13

**ข้อมูลสำคัญที่ต้องออกแบบรับ:** ทดสอบแล้วพบว่า **เลข 13 หลักที่สุ่มมามั่วๆ ผ่าน checksum ถึง 10.07%**
แปลว่า checksum อย่างเดียวจะ false positive เยอะมาก (เลขใบสั่งซื้อ เลข tracking เลขพัสดุ)
→ **บังคับใช้ระบบให้คะแนน 3 ปัจจัย**

```js
// src/detectors/thai-id.js
const WEIGHTS = [13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];

const CTX = /(บัตรประชาชน|ประจำตัวประชาชน|เลขประจำตัว|ผู้เสียภาษี|ภาษีอากร|เลขที่บัตร|national\s*id|citizen\s*id|tax\s*id)/i;
const FORMATTED = /^\d-\d{4}-\d{5}-\d{2}-\d$/;
const CANDIDATE = /(?<![\d-])(?:\d-\d{4}-\d{5}-\d{2}-\d|\d{13})(?![\d-])/g;

export function isValidThaiID(raw) {
  const d = String(raw).replace(/\D/g, '');
  if (d.length !== 13) return false;
  if (/^(\d)\1{12}$/.test(d)) return false;       // 1111111111111
  if (/^0/.test(d)) return false;                  // หลักแรกไม่เป็น 0
  const sum = WEIGHTS.reduce((a, w, i) => a + Number(d[i]) * w, 0);
  return ((11 - (sum % 11)) % 10) === Number(d[12]);
}

export function detect(text) {
  const out = [];
  for (const m of text.matchAll(CANDIDATE)) {
    const value = m[0];
    if (!isValidThaiID(value)) continue;
    let score = 0.50;                              // ผ่าน checksum
    const reasons = ['checksum'];
    if (FORMATTED.test(value)) { score += 0.35; reasons.push('formatted'); }
    const from = Math.max(0, m.index - 40);
    const win = text.slice(from, m.index + value.length + 40);
    if (CTX.test(win)) { score += 0.35; reasons.push('context'); }
    out.push({
      type: 'thai_id', value, start: m.index, end: m.index + value.length,
      confidence: Math.min(score, 1), reason: reasons.join('+')
    });
  }
  return out;
}
```

### 6.3 ตาราง detector ที่เหลือ

| ไฟล์ | จับอะไร | แนวทาง | คะแนนฐาน |
|---|---|---|---|
| `thai-phone.js` | มือถือ | `0[689]\d{8}` หรือ `\+66[689]\d{8}` (ยอมให้มี `-`/space คั่น) | 0.85 |
| | เบอร์บ้าน | `0(2\d{7}\|[3-7]\d{7})` | 0.55 + ต้องมีบริบท (โทร/เบอร์/Tel) |
| `email.js` | อีเมล | regex มาตรฐาน RFC-lite | 0.90 |
| `credit-card.js` | บัตรเครดิต | ความยาว 13–19 + **ผ่าน Luhn** | 0.85 |
| `bank-account.js` | เลขบัญชี | 10–12 หลัก + ต้องมีชื่อธนาคาร/คำว่า "บัญชี" ใน ±50 ตัวอักษร | 0.45 + 0.35 ถ้ามีบริบท |
| `thai-plate.js` | ทะเบียนรถ | `[ก-ฮ]{1,3}\s?\d{1,4}` + ต้องมีชื่อจังหวัด หรือคำว่า "ทะเบียน" ใกล้ๆ | 0.40 + 0.40 |
| `passport.js` | พาสปอร์ต | `[A-Z]{1,2}\d{6,7}` + บริบท (passport/หนังสือเดินทาง) | 0.35 + 0.45 |
| `thai-address.js` | ที่อยู่ | ต้องเจอ ≥2 สัญญาณ: คำบอกตำแหน่ง (ตำบล/แขวง/อำเภอ/เขต/หมู่/ซอย/ถนน) + ชื่อจังหวัดจาก `provinces.th.js` + รหัสไปรษณีย์ 5 หลัก | 0.40/สัญญาณ |
| `thai-name.js` | ชื่อคนไทย | Phase 1: คำนำหน้าจาก `titles.th.js` ตามด้วยคำไทย 1–3 คำ<br>Phase 3: ใช้ Nano ยืนยัน | 0.60 (dict) / 0.85 (Nano) |

**กฎรวมผล (ใน `scanner.js`):** ถ้าช่วง index ซ้อนทับกัน ให้เก็บอันที่ `confidence` สูงกว่า ถ้าเท่ากันให้เก็บอันที่ช่วงยาวกว่า

---

## 7. ระบบ Mask / Unmask (`core/mapper.js`)

### 7.1 รูปแบบ placeholder
ห้ามใช้ `████` เพราะทำให้คำตอบของ AI ใช้งานไม่ได้ ต้องใช้ตัวแทนที่**สื่อความหมายและคงเส้นคงวา**

```
[บุคคล_1]  [บัตรปชช_1]  [เบอร์_1]  [อีเมล_1]  [บัญชี_1]  [ที่อยู่_1]  [ทะเบียน_1]  [บัตรเครดิต_1]  [พาสปอร์ต_1]
```

ค่าเดิมที่ซ้ำกันในข้อความเดียวกันต้องได้ placeholder ตัวเดียวกันเสมอ

### 7.2 ตัวอย่างพฤติกรรมที่ต้องได้
```
ผู้ใช้พิมพ์:  ลูกค้าชื่อนายสมชาย ใจดี เลข 1-2345-67890-12-3 โทร 0812345678
ส่งไปให้ AI: ลูกค้าชื่อ[บุคคล_1] เลข[บัตรปชช_1] โทร[เบอร์_1]
AI ตอบกลับ:  แนะนำให้ติดต่อ[บุคคล_1] ที่[เบอร์_1] เพื่อยืนยัน[บัตรปชช_1]
แสดงให้ผู้ใช้: แนะนำให้ติดต่อนายสมชาย ใจดี ที่ 0812345678 เพื่อยืนยัน 1-2345-67890-12-3
```

### 7.3 API ที่ต้องมี
```js
export function createSession(tabId);          // เริ่ม session ใหม่ต่อแท็บ
export function mask(text, findings, session); // → { masked: string, session }
export function unmask(text, session);         // → string
export function clearSession(tabId);           // ลบตารางแมป
```

### 7.4 กฎความปลอดภัยของตารางแมป
- เก็บใน **`chrome.storage.session`** เท่านั้น (หายเมื่อปิดเบราว์เซอร์)
- key = `map:${tabId}`
- ล้างอัตโนมัติเมื่อแท็บถูกปิด (`chrome.tabs.onRemoved` ใน sw.js)
- **ห้ามเขียนตารางแมปลง `storage.local` และห้ามส่งออกนอกเครื่องเด็ดขาด** — ถ้าตารางนี้รั่ว สินค้าทั้งตัวไร้ความหมาย
- มีปุ่ม "ล้างข้อมูลทั้งหมดเดี๋ยวนี้" ใน popup

---

## 8. Content script และ UI

### 8.1 การดักข้อความ
- หา editor ด้วย selector ที่ครอบคลุม: `textarea`, `[contenteditable="true"]`, `[role="textbox"]`
- ใช้ `MutationObserver` จับ editor ที่โผล่มาทีหลัง (SPA)
- ฟัง `input` และ `paste` แล้ว **debounce 150ms** ก่อนสแกน
- ถ้าข้อความยาวเกิน 20,000 ตัวอักษร ให้สแกนเฉพาะ 5,000 ตัวอักษรท้าย เพื่อไม่ให้หน่วง

### 8.2 UI overlay
- แถบลอยเหนือกล่องข้อความ: `⚠️ พบข้อมูลส่วนบุคคล 3 รายการ` + ปุ่ม `ปิดบังทั้งหมด` / `ดูรายการ` / `ข้ามครั้งนี้`
- กด "ดูรายการ" → แสดง list แต่ละรายการ (ประเภท + ค่าที่ถูกตัดกลาง เช่น `1-2345-***-**-3`) พร้อม toggle รายตัว
- รายการที่ `confidence < 0.80` ต้องมีป้าย `น่าจะใช่` และ **ไม่ติ๊กมาให้ล่วงหน้า**
- รองรับ dark mode ผ่าน `prefers-color-scheme`
- ต้องเข้าถึงด้วยคีย์บอร์ดได้ (Tab/Enter/Esc) และมี `aria-label`

### 8.3 โหมดการทำงาน (ตั้งใน options)
| โหมด | พฤติกรรม |
|---|---|
| `warn` (ค่าเริ่มต้น) | แจ้งเตือนอย่างเดียว ผู้ใช้กดปิดบังเอง |
| `auto` | ปิดบังรายการที่ `confidence >= 0.80` อัตโนมัติ แล้วแจ้งว่าทำอะไรไป |
| `block` | ถ้าเจอรายการ `>= 0.80` ให้ปิดปุ่มส่งจนกว่าจะจัดการ (สำหรับองค์กร) |

---

## 9. Gemini Nano adapter (`src/ai/nano.js`) — Phase 3

```js
export async function isAvailable();   // → boolean, feature-detect หลายชื่อ API
export async function warmUp();        // โหลดโมเดลครั้งแรก (แสดง progress)
export async function findThaiEntities(chunk); // → Finding[] เฉพาะชื่อ/ที่อยู่
export function reason();              // → เหตุผลที่ใช้ไม่ได้ (ram/storage/browser/unsupported)
```

**ข้อบังคับ:**
- ต้อง feature-detect แบบไม่ throw — ถ้าไม่มี ให้ `isAvailable()` คืน `false` เงียบๆ แล้วระบบ fallback ไป dictionary mode โดยผู้ใช้ไม่เห็น error
- **หั่นข้อความให้ไม่เกิน ~1,500 tokens ต่อครั้ง** (context จำกัด 8,000 tokens และต้องเผื่อ prompt + output)
- prompt ต้องสั่งให้ output เป็น JSON array เท่านั้น และต้อง `try/catch` การ parse เสมอ — โมเดลเล็กหลุดฟอร์แมตได้
- ผลจาก Nano ต้องถูก **verify กลับ** ว่า substring ที่คืนมามีอยู่จริงใน text ต้นฉบับ ถ้าไม่มีให้ทิ้ง (กัน hallucination)
- ใน options ต้องมีสวิตช์ปิด Nano ได้ และแสดงสถานะ: `พร้อมใช้งาน` / `เครื่องไม่รองรับ (ต้องการ RAM 16GB, พื้นที่ว่าง 22GB)` / `ปิดอยู่`

---

## 10. Storage schema

```js
// chrome.storage.local
{
  "settings": {
    "mode": "warn",                 // warn | auto | block
    "detectors": {                  // เปิด/ปิดรายตัว
      "thai_id": true, "thai_phone": true, "email": true,
      "credit_card": true, "bank_account": true, "thai_plate": true,
      "thai_address": true, "thai_name": true, "passport": true
    },
    "useNano": true,
    "customPatterns": [],           // Phase 4 (Pro)
    "locale": "auto"
  },
  "stats": {                        // ตัวเลขล้วน ไม่มีเนื้อหาใดๆ
    "totalMasked": 0,
    "byType": { "thai_id": 0 },
    "lastResetAt": 0
  }
}

// chrome.storage.session  — ห้ามย้ายไป local
{
  "map:123": { "[บัตรปชช_1]": "1-2345-67890-12-3" }
}
```

**`stats` ห้ามเก็บค่าจริงหรือชิ้นส่วนของค่าจริงเป็นอันขาด เก็บได้แค่ตัวนับ**

---

## 11. i18n

ทำ `_locales/th/messages.json` และ `_locales/en/messages.json` ตั้งแต่ Phase 1
เหตุผล: ข้อมูลตลาดระบุว่าส่วนขยายหลายภาษามีผู้ใช้มัธยฐาน **6.5 เท่า** ของส่วนขยายภาษาเดียว

`default_locale` = `th`
ห้าม hardcode ข้อความใดๆ ใน JS/HTML ให้ใช้ `chrome.i18n.getMessage()` ทั้งหมด

คีย์ที่ต้องมีอย่างน้อย: `extName`, `extDesc`, `foundItems`, `maskAll`, `viewList`, `skipOnce`, `probablyPII`, `clearData`, `modeWarn`, `modeAuto`, `modeBlock`, `nanoReady`, `nanoUnsupported`

---

## 12. การทดสอบ

### 12.1 กฎเหล็กเรื่องข้อมูลทดสอบ
**ห้ามใส่เลขบัตรประชาชนจริงของคนจริง ลงใน fixture หรือใน repo เด็ดขาด**
ให้ `test/fixtures/generate.js` สร้างเลขสังเคราะห์จาก prefix สุ่ม แล้วคำนวณหลักตรวจสอบเอง

```js
// test/fixtures/generate.js
import { } from 'node:crypto';
const WEIGHTS = [13,12,11,10,9,8,7,6,5,4,3,2];
export function synthThaiID() {
  let p;
  do { p = Array.from({length:12}, () => Math.floor(Math.random()*10)).join(''); }
  while (p[0] === '0');
  const sum = WEIGHTS.reduce((a,w,i) => a + Number(p[i])*w, 0);
  return p + String((11 - (sum % 11)) % 10);
}
```

### 12.2 เคสที่ต้องผ่าน

**Positive (ต้องจับได้ confidence ≥ 0.80):**
1. `เลขบัตรประชาชน 1-2345-67890-12-3` → thai_id (checksum+formatted+context)
2. `โทร 0812345678` → thai_phone
3. `ส่งมาที่ somchai@example.com` → email
4. `บัญชีกสิกร 1234567890` → bank_account (มีชื่อธนาคาร)
5. `นายสมชาย ใจดี` → thai_name
6. `123 หมู่ 4 ต.บางรัก อ.เมือง จ.ชลบุรี 20000` → thai_address

**Negative (ต้องไม่จับ หรือ confidence < 0.50):**
1. `เลขที่ใบสั่งซื้อ 8234567891234` — 13 หลักที่บังเอิญผ่าน checksum แต่บริบทเป็นใบสั่งซื้อ
2. `1111111111111` — เลขซ้ำทั้งหมด
3. `0000000000000`
4. `เวอร์ชัน 1.2.3.4.5`
5. `0212345` — สั้นเกินไป
6. ข้อความที่มีเลข 13 หลักในบริบท tracking number

### 12.3 เป้าหมายคุณภาพ (Definition of Done ของ Phase 1)
- ชุดทดสอบ ≥ 200 เคส (สังเคราะห์ได้)
- **Precision ≥ 0.95** และ **Recall ≥ 0.90** บน `thai_id`
- **False positive rate บน negative corpus < 2%**
- สแกนข้อความ 5,000 ตัวอักษรเสร็จภายใน **< 50ms**
- `npm test` ผ่านทั้งหมด

---

## 13. เช็กลิสต์ก่อนส่งขึ้น Chrome Web Store

### 13.1 บัญชีและค่าธรรมเนียม
- [ ] จ่ายค่าลงทะเบียนนักพัฒนา **$5 ครั้งเดียว**
- [ ] เปิด **2-Step Verification** ในบัญชี Google (บังคับ)
- [ ] ยืนยันอีเมลติดต่อ (แจ้งเตือนนโยบายทั้งหมดมาทางนี้)

### 13.2 ไฟล์ประกอบ listing
- [ ] ไอคอน PNG **128×128** (และ 16/32/48)
- [ ] คำอธิบายสั้น **ไม่เกิน 132 ตัวอักษร**
- [ ] ภาพหน้าจอ **1280×800** อย่างน้อย 3 ภาพ แสดง UI จริง (ห้ามเป็นภาพโฆษณาลอยๆ)
- [ ] แผ่นโปรโมท **440×280**

### 13.3 แท็บความเป็นส่วนตัว
- [ ] ติ๊กประเภทข้อมูลที่เก็บ (ของเราควรเป็น "ไม่เก็บ")
- [ ] รับรอง **Limited Use** — นโยบายใหม่บังคับใช้ **1 ส.ค. 2026** ระบุว่าข้อมูลที่เก็บต้อง**จำเป็นอย่างเคร่งครัด**ต่อวัตถุประสงค์เดียวที่ประกาศไว้
- [ ] ใส่ URL นโยบายความเป็นส่วนตัวที่เข้าถึงได้สาธารณะ (ใช้ `PRIVACY.md` ที่ push ขึ้น GitHub Pages ได้)
- [ ] เขียนเหตุผลกำกับทุก permission

### 13.4 โค้ด
- [ ] ไม่มี obfuscation
- [ ] ไม่มีการโหลดโค้ดจากภายนอก
- [ ] ไม่มี credential ฝังในแพ็กเกจ
- [ ] ไม่มี `<all_urls>` ใน `host_permissions`
- [ ] `grep -r "fetch(\|XMLHttpRequest\|sendBeacon" src/` ต้องได้ผลลัพธ์ว่าง

### 13.5 ร่างข้อความ listing
```
ชื่อ: Thai PDPA Guard — ปิดบังข้อมูลส่วนบุคคลก่อนส่งให้ AI

คำอธิบายสั้น (127 ตัวอักษร):
ตรวจจับเลขบัตรประชาชน เบอร์โทร ชื่อ ที่อยู่แบบไทย แล้วปิดบังก่อนส่งให้ ChatGPT ทำงานในเครื่อง 100%

คำหลักที่ต้องมีในคำอธิบายยาว:
PDPA, ข้อมูลส่วนบุคคล, เลขบัตรประชาชน, ChatGPT, ความปลอดภัยข้อมูล, DPO, Thai PII, data privacy
```

**ระยะเวลารีวิว:** ปกติไม่กี่วัน อาจถึงหลายสัปดาห์ ถ้าเกิน 3 สัปดาห์ติดต่อฝ่ายสนับสนุน อุทธรณ์ได้จาก Dashboard ตอบกลับราว 3 วัน

---

## 14. ลำดับการสร้าง (สั่ง Claude Code ทีละเฟส)

### Phase 0 — โครงและเครื่องมือ (ครึ่งวัน)
สร้างโครงไฟล์ทั้งหมด, `manifest.json`, `package.json` (scripts: `test`, `lint`), `.gitignore`, `README.md`, `PRIVACY.md`
**เสร็จเมื่อ:** โหลด unpacked เข้า Chrome ได้โดยไม่ error และไอคอนขึ้นบนแถบ

### Phase 1 — เครื่องยนต์ตรวจจับ (3–4 วัน) ← **ทำก่อน ห้ามข้าม**
`detectors/*` ทั้งหมด (ยกเว้นส่วน Nano), `core/scanner.js`, ชุดทดสอบตามข้อ 12
**เสร็จเมื่อ:** `npm test` ผ่าน และได้ precision/recall ตามเป้าในข้อ 12.3

### Phase 2 — Mask/Unmask + UI (3–4 วัน)
`core/mapper.js`, `src/content.js`, `src/ui/overlay.js`, `popup/`, `options/`, `_locales/`
**เสร็จเมื่อ:** ใช้งานได้จริงบน chatgpt.com, claude.ai, gemini.google.com ครบวงจร mask → ส่ง → unmask

### Phase 3 — Gemini Nano (2 วัน)
`src/ai/nano.js` + เชื่อมกับ `thai-name.js` และ `thai-address.js` + UI แสดงสถานะ
**เสร็จเมื่อ:** เครื่องที่รองรับใช้ Nano ได้ เครื่องที่ไม่รองรับ fallback เงียบและยังทำงานครบ

### Phase 4 — เตรียมขึ้นสโตร์ (2 วัน)
ไอคอน, ภาพหน้าจอ, promo tile, เขียน listing, เก็บงาน a11y, ตรวจเช็กลิสต์ข้อ 13 ให้ครบ
**เสร็จเมื่อ:** ส่งรีวิวแล้ว

### Phase 5 — ระบบเก็บเงิน (หลังผ่านเกณฑ์ retention เท่านั้น)
> ⚠️ **ห้ามทำ Phase 5 จนกว่า weekly retention จะเกิน 30%**
> ข้อมูลตลาดระบุว่าส่วนขยายที่ retention ระดับฟรีเกิน 30% จะแปลงเป็นผู้จ่ายเงิน 3–8% ถ้าต่ำกว่านั้นการใส่ระบบจ่ายเงินคือการเสียเวลา

ใช้ **ExtensionPay (5%)** หรือ **crxpay (ฟรีจนถึง $2,500 แล้ว 2.5%)** — อย่าต่อ Stripe เองในรอบแรกเพราะกินเวลา 2–4 สัปดาห์
การตรวจไลเซนส์ต้องแคชในเครื่องและทำงานได้ตอนออฟไลน์

**แพ็กเกจ:**
| ระดับ | ราคา | ได้อะไร |
|---|---|---|
| ฟรี | 0 | 3 เว็บหลัก, thai_id/phone/email, unmask |
| Pro | 149 บ./เดือน หรือ 1,290 บ./ปี | ทุกเว็บ, Nano, กฎที่ตั้งเอง, ประวัติในเครื่อง |
| Team | 249 บ./ที่นั่ง/เดือน | ไฟล์นโยบายองค์กร, รายงานสำหรับ DPO |

---

## 15. สิ่งที่ห้ามทำ (สรุปให้ agent อ่านซ้ำ)

1. ❌ ห้ามเพิ่ม network request ใดๆ ใน Phase 0–4
2. ❌ ห้ามใช้ `<all_urls>` หรือ `*://*/*` ใน `host_permissions`
3. ❌ ห้ามเก็บตารางแมปหรือเนื้อหาผู้ใช้ลง `storage.local`
4. ❌ ห้าม obfuscate
5. ❌ ห้ามเพิ่มฟีเจอร์ที่ตอบไม่ได้ว่ารับใช้ Single Purpose ในข้อ 2.1
6. ❌ ห้ามใส่เลขบัตรประชาชนจริงลง repo
7. ❌ ห้ามแก้ข้อความของผู้ใช้โดยอัตโนมัติในโหมด `warn`
8. ❌ ห้ามเดาชื่อ API ของ Prompt API — ต้อง feature-detect
9. ❌ ห้ามลง dependency npm สำหรับโค้ดที่ ship (dev dependency สำหรับ test ได้)
10. ❌ ห้ามข้าม Phase 1 ไปทำ UI ก่อน

---

## 16. อ้างอิง

- อัลกอริทึมเลขบัตรประชาชน (mod 11): https://charin-nawaritloha.github.io/excel-vba-notes/20180111_check_sum_id.html
- คดี PDPA JIB ปรับ 7 ล้านบาท: https://www.dharmniti.co.th/pdpa-jib/
- Chrome Web Store review process: https://developer.chrome.com/docs/webstore/review-process
- นโยบาย Chrome Web Store 2026 (Limited Use, บังคับ 1 ส.ค. 2026): https://developer.chrome.com/blog/cws-policy-updates-2026
- Chrome Built-in AI / Prompt API: https://developer.chrome.com/docs/ai/prompt-api
- Extensions and AI: https://developer.chrome.com/docs/extensions/ai

---

## 17. บันทึกการตัดสินใจ (Decision log)

| วันที่ | การตัดสินใจ | เหตุผล |
|---|---|---|
| 2026-09-21 | ใช้ vanilla JS ไม่ใช้ framework | reviewer อ่านโค้ดง่าย ลดเวลารีวิว |
| 2026-09-21 | ขอแค่ 4 โดเมน ไม่ขอ `<all_urls>` | host pattern กว้างคือตัวถ่วงรีวิวอันดับต้นๆ |
| 2026-09-21 | placeholder สื่อความหมายแทน `████` | คำตอบของ AI ต้องยังใช้งานได้ นี่คือจุดต่างจากคู่แข่ง |
| 2026-09-21 | ตารางแมปอยู่ใน `storage.session` | ถ้ารั่ว สินค้าไร้ความหมาย |
| 2026-09-21 | Nano เป็น optional layer ไม่ใช่ core | ต้องใช้ RAM 16GB ซึ่งตัดผู้ใช้ออกเยอะ |
| 2026-09-21 | เลื่อนระบบเก็บเงินไป Phase 5 | ต้องพิสูจน์ retention ก่อน |
