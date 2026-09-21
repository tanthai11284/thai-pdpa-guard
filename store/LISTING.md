# Chrome Web Store Listing — Thai PDPA Guard

ใช้คัดลอกลงแบบฟอร์มใน Developer Dashboard ทีละช่อง

---

## ชื่อ (Name)

```
Thai PDPA Guard — ปิดบังข้อมูลส่วนบุคคลก่อนส่งให้ AI
```

## คำอธิบายสั้น (Summary) — ≤ 132 ตัวอักษร

ไทย (98 ตัวอักษร):
```
ตรวจจับเลขบัตรประชาชน เบอร์โทร ชื่อ ที่อยู่แบบไทย แล้วปิดบังก่อนส่งให้ ChatGPT ทำงานในเครื่อง 100%
```

English (111 chars):
```
Detects Thai ID numbers, phones, names and addresses and masks them before you send to ChatGPT. 100% on-device.
```

## หมวดหมู่ (Category)

`Productivity` → `Privacy & Security` (ถ้ามี) หรือ `Workflow & Planning`

## ภาษา (Language)

Thai (หลัก), English

---

## คำอธิบายยาว (Description) — ไทย

```
พนักงานไทยวางข้อมูลลูกค้าลงใน ChatGPT, Claude และ Gemini ทุกวัน — เลขบัตรประชาชน ชื่อ เบอร์โทร ที่อยู่ เลขบัญชี — โดยที่องค์กรไม่มีทางรู้ Thai PDPA Guard คือส่วนขยายตัวแรกที่เข้าใจข้อมูลส่วนบุคคลแบบไทยโดยเฉพาะ และปิดบังให้ก่อนที่ข้อความจะถูกส่งออกไป

■ ทำอะไรได้บ้าง
• ตรวจจับข้อมูลส่วนบุคคลขณะพิมพ์ในกล่องข้อความของ ChatGPT, Claude และ Gemini
• เลขบัตรประชาชน / เลขผู้เสียภาษี 13 หลัก — ตรวจสอบด้วยอัลกอริทึม checksum ของกรมการปกครอง ไม่ใช่แค่นับหลัก
• เบอร์มือถือและเบอร์บ้านไทย, อีเมล, บัตรเครดิต (Luhn), เลขบัญชีธนาคารไทย, ทะเบียนรถ, หนังสือเดินทาง
• ที่อยู่แบบไทย (ตำบล / อำเภอ / จังหวัด / รหัสไปรษณีย์) และชื่อคนไทยพร้อมคำนำหน้า
• ปิดบังด้วยตัวแทนที่สื่อความหมาย เช่น [บุคคล_1] [บัตรปชช_1] [เบอร์_1] — AI ยังเข้าใจบริบทและตอบได้ตามปกติ
• ถอดกลับอัตโนมัติ: เมื่อ AI ตอบกลับมาพร้อม [บุคคล_1] คุณจะเห็นชื่อจริงบนหน้าจอทันที
• 3 โหมด: แจ้งเตือน (ค่าเริ่มต้น) / ปิดบังอัตโนมัติ / ปิดปุ่มส่งจนกว่าจะจัดการ (สำหรับองค์กร)
• ใช้ Gemini Nano ในเครื่อง (ถ้า Chrome รองรับ) ช่วยจับชื่อที่ไม่มีคำนำหน้า — ไม่รองรับก็ยังใช้งานได้ครบ

■ ความเป็นส่วนตัว
• ทุกอย่างประมวลผลในเครื่องของคุณ โค้ดทั้งโปรเจกต์ไม่มีการเรียกเครือข่ายแม้แต่บรรทัดเดียว
• ตารางจับคู่ตัวแทน↔ค่าจริง เก็บในหน่วยความจำของแท็บเท่านั้น หายทันทีเมื่อปิดแท็บหรือปิดเบราว์เซอร์
• ไม่มีบัญชีผู้ใช้ ไม่มี analytics ไม่มีการเก็บเนื้อหาที่คุณพิมพ์
• เก็บได้แค่ตัวนับ เช่น "ปิดบังไปแล้ว 12 รายการ"

■ ทำไมต้องใช้
PDPA มีโทษปรับทางปกครองสูงสุด 5,000,000 บาท และเคยมีคดีจริงที่ถูกปรับรวม 7,000,000 บาท ธุรกิจไทยจำนวนมากใช้ AI แล้วแต่ยังไม่มีนโยบายกำกับดูแล ส่วนขยายนี้เป็นมาตรการทางเทคนิคที่ DPO นำไปใช้ได้ทันทีโดยไม่ต้องเปลี่ยนวิธีทำงานของพนักงาน

คำหลัก: PDPA, ข้อมูลส่วนบุคคล, เลขบัตรประชาชน, ChatGPT, ความปลอดภัยข้อมูล, DPO, Thai PII, data privacy
```

## คำอธิบายยาว (Description) — English

```
Thai employees paste customer data into ChatGPT, Claude and Gemini every day — national ID numbers, names, phone numbers, addresses, bank accounts — and the organization never knows. Thai PDPA Guard is the first extension built for Thai personal data: it detects and masks it before the message leaves the text box.

■ What it does
• Scans the chat input of ChatGPT, Claude and Gemini as you type
• Thai 13-digit national ID / tax ID — validated with the official mod-11 checksum, not just digit counting
• Thai mobile and landline numbers, emails, credit cards (Luhn), Thai bank accounts, license plates, passports
• Thai addresses (tambon / amphoe / province / postcode) and Thai names with titles
• Masks with meaningful placeholders such as [บุคคล_1] [บัตรปชช_1] [เบอร์_1] — the AI still understands the context
• Automatic unmask: when the reply contains [บุคคล_1], you see the real name on screen
• 3 modes: warn (default) / auto-mask / block send until handled (for organizations)
• Uses on-device Gemini Nano when Chrome supports it to catch names without titles — works fully without it

■ Privacy
• Everything runs on your device. The codebase contains no network calls at all.
• The placeholder↔value table lives only in the tab's session memory and is wiped when the tab or browser closes.
• No account, no analytics, no storage of what you type. Only counters such as "12 items masked".

■ Why
Thailand's PDPA carries administrative fines up to THB 5,000,000, and a real case has already resulted in THB 7,000,000 in combined fines. This extension is a technical safeguard a DPO can roll out today without changing how staff work.

Keywords: PDPA, Thai PII, national ID, ChatGPT, data privacy, DPO, ข้อมูลส่วนบุคคล, เลขบัตรประชาชน
```

---

## Single purpose (ช่อง "Single purpose description")

```
ตรวจจับและปิดบังข้อมูลส่วนบุคคลของไทยในกล่องข้อความก่อนผู้ใช้กดส่ง
Detect and mask Thai personal data in the chat input box before the user sends it.
```

## เหตุผลกำกับ permission (Permission justification)

| permission | justification |
|---|---|
| `storage` | Saves user settings (mode, enabled detectors) and anonymous counters in chrome.storage.local, and holds the per-tab placeholder↔value table in chrome.storage.session so it is wiped when the browser closes. No content is written to disk. |
| Host: `https://chatgpt.com/*`, `https://chat.openai.com/*`, `https://claude.ai/*`, `https://gemini.google.com/*` | The content script must run on these AI chat sites to read the text box the user is typing in, show the warning overlay, replace detected values with placeholders, and restore them in the AI's reply. No other sites are requested. |

## Remote code

```
No, I am not using remote code.
```

## แท็บ Privacy practices — การเก็บข้อมูล

ติ๊ก **ไม่เก็บ** ทุกหมวด (Personally identifiable information, Health, Financial, Authentication, Personal communications, Location, Web history, User activity, Website content)

รับรองทั้ง 3 ข้อ:
- [x] I do not sell or transfer user data to third parties, outside of the approved use cases
- [x] I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- [x] I do not use or transfer user data to determine creditworthiness or for lending purposes

Privacy policy URL: `https://<github-username>.github.io/thai-pdpa-guard/PRIVACY` (ดู README ส่วน "Publish privacy policy")

---

## ภาพหน้าจอ 1280×800 (อย่างน้อย 3 ภาพ — ต้องเป็นการใช้งานจริง)

ถ่ายจาก Chrome ที่ตั้งขนาดหน้าต่างพอดี หรือถ่ายเต็มจอแล้วครอปเป็น 1280×800 (อัตราส่วน 16:10)

| # | ฉาก | วิธีถ่าย |
|---|---|---|
| 1 | **ตรวจพบ** — overlay สีส้ม "พบข้อมูลส่วนบุคคล 3 รายการ" เหนือกล่องข้อความ ChatGPT ที่มีชื่อ เบอร์ อีเมล | พิมพ์ `ลูกค้าชื่อนายสมชาย ใจดี โทร 0812345678 อีเมล somchai@example.com` รอ 1 วิ |
| 2 | **ดูรายการ** — กด "ดูรายการ" ให้เห็น checkbox + ค่าที่ตัดกลาง `นายสม***ดี` | ต่อจากภาพ 1 |
| 3 | **ปิดบังแล้ว** — กล่องข้อความแสดง `ลูกค้าชื่อ[บุคคล_1] โทร [เบอร์_1] อีเมล [อีเมล_1]` พร้อมแถบเขียว "ปิดบังไปแล้ว 3 รายการ" | กด "ปิดบังทั้งหมด" |
| 4 | **ถอดกลับ** — คำตอบของ AI แสดงชื่อจริง/เบอร์จริง ทั้งที่ AI ได้รับแค่ placeholder | กดส่ง รอคำตอบ (ใช้ Gemini ซึ่งตอบเป็นรายการสวย) |
| 5 | **หน้าตั้งค่า** — 3 โหมด + สวิตช์ detector + สถานะ Gemini Nano "พร้อมใช้งาน" | เปิด options |

ใช้ข้อมูลสมมติเท่านั้น (ตามภาพ) ห้ามมีข้อมูลจริงของใครในภาพ และปิดแถบ bookmark / extension อื่นก่อนถ่ายให้สะอาด

## Promo tile 440×280

`store/promo-440x280.png` (สร้างใหม่ได้ด้วย `npm run icons`)
