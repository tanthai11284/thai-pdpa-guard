# HANDOFF — Thai PDPA Guard

> **อ่านไฟล์นี้ก่อนทำงานต่อทุกครั้ง** แล้วอัปเดตหัวข้อ "สถานะล่าสุด" และ "ขั้นตอนถัดไป" ก่อนจบเซสชัน
> อัปเดตล่าสุด: 2026-10-05 (เย็น) · commit ล่าสุด ดู `git log -1`

---

## 1. เป้าหมายของงาน

- **สินค้า:** ส่วนขยาย Chrome (MV3) ตรวจจับข้อมูลส่วนบุคคลแบบไทยในกล่องข้อความของ ChatGPT / Claude / Gemini ปิดบังด้วยตัวแทน (`[บุคคล_1]`, `[เบอร์_1]`) ก่อนส่ง แล้ว**แสดงค่าจริงกลับในคำตอบ**บนจอผู้ใช้ ทำงานในเครื่อง 100% ไม่มีเซิร์ฟเวอร์
- **Single purpose (ใช้ประโยคนี้ทุกที่):** "ตรวจจับและปิดบังข้อมูลส่วนบุคคลของไทยในกล่องข้อความก่อนผู้ใช้กดส่ง"
- **เป้าธุรกิจของผู้ใช้:** รายได้ 5,000–10,000 บาท/เดือนก็ "เกินฝัน" · **ตัวแรกมีหน้าที่สร้างฐานลูกค้า** ไว้ขายสินค้าตัวต่อไป ไม่ใช่ทำเงินทันที · "เริ่มฟรี มีบางคนยอมจ่าย ไม่เน้นจำนวน ให้มีคนใช้ไว้ก่อน"
- **ทางที่เงินอยู่จริง:** องค์กรผ่าน DPO (แพลน Team) และงานบริการต่อยอด ไม่ใช่ผู้ใช้เดี่ยว ประเมินไว้ว่าส่วนขยายเดี่ยว ๆ ได้ไม่เกิน ~25k/เดือนในกรณีดีที่สุด ค่ากลาง ~3–5k

## 2. สิ่งที่ตัดสินใจไปแล้ว + เหตุผล

| เรื่อง | ตัดสินใจ | เหตุผล |
|---|---|---|
| Stack | Vanilla JS, ไม่มี bundler/dependency ที่ ship | reviewer อ่านง่าย รีวิวผ่านเร็ว |
| Permission | `storage` + 4 โดเมน (chatgpt.com, chat.openai.com, claude.ai, gemini.google.com) ไม่มี `<all_urls>`, ตัด `activeTab`/`scripting` | host กว้างทำให้รีวิวช้า ขอเท่าที่ใช้ |
| Network | **ห้ามมี network request ในโค้ดที่ ship** (lint ตรวจ) | จุดขายหลัก "ไม่ส่งข้อมูลออก" |
| ตารางแมป | เก็บใน `chrome.storage.session` เท่านั้น ห้ามลง `storage.local` | ถ้ารั่ว สินค้าไร้ความหมาย (แลกกับ: แชทเก่าหลังรีสตาร์ตเห็น placeholder) |
| Placeholder | สื่อความหมาย `[บุคคล_1]` ไม่ใช่ `████` | AI ยังเข้าใจและตอบได้ |
| เลขบัตร | checksum mod-11 + คะแนน 3 ปัจจัย (formatted/context/neg-context) | เลขสุ่ม 13 หลักผ่าน checksum ~10% |
| Gemini Nano | ชั้นเสริม รันใน service worker, fallback เงียบ | ต้องการเครื่องแรง |
| License | **Elastic License 2.0** | เปิดให้อ่านตรวจได้ แต่ห้ามขายแข่ง/ข้าม license key (Phase 5) — เป็น source-available ไม่ใช่ OSI open source |
| แบรนด์ | ชื่อผู้เผยแพร่ **TM8 Labs** ใช้ทุกที่ (สโตร์, LINE OA, เว็บ, อีเมล) | ใช้ซ้ำกับสินค้าตัวต่อไป ความน่าเชื่อถือส่งต่อ |
| สถานะผู้ค้า | "ไม่ใช่ผู้ค้า" ตอนนี้ | ยังฟรี ไม่ต้องเปิดเผยที่อยู่/เบอร์ · ต้องเปลี่ยนเป็น "ผู้ค้า" ก่อน Phase 5 |
| ภาพสโตร์ | JPEG (สโตร์ไม่รับ PNG ที่มีอัลฟา) | |
| ภาพหน้าจอสโตร์ | **ชุด v3**: แถบหัวน้ำเงิน (โทนเดียวกับ promo) + เลขขั้นวงกลมเหลือง + หัวข้อไทยตัวใหญ่ + ภาพแคปจริงซูมเฉพาะส่วนสำคัญ · ใช้ชุดเดียวกันทั้งหน้า th และ en | ภาพเดิมตัวหนังสือเล็กเกิน ไม่มีคำบรรยาย · แคปใหม่ความละเอียดสูงคมกว่าการขยายภาพเก่า (v2) · ชุดคำบรรยาย EN ทำทีหลังตอนบุกตลาดโลก |
| Promo tile | เลย์เอาต์เดิม (โล่ซ้าย + ชื่อ + คำอธิบาย + ป้ายเหลือง) ตัวหนังสือใหญ่ขึ้น | ผู้ใช้ไม่ชอบแบบเปลี่ยนเลย์เอาต์ |
| ชื่อสโตร์ v1.0.1 | "Thai PDPA Guard – ปิดบังข้อมูลส่วนบุคคลก่อนส่ง AI" / EN "…– Mask personal data before AI chat" · popup/options ใช้ key `brandName` (สั้น) | ชื่อมีน้ำหนักค้นหามากที่สุด |
| Phase 5 เก็บเงิน | **ห้ามทำจนกว่า weekly retention > 30%** · ใช้ ExtensionPay/crxpay | ต้องพิสูจน์ว่าคนใช้ต่อก่อน |

## 3. สถานะล่าสุด (2026-10-05)

### ✅ เสร็จและออนไลน์
- **Chrome Web Store v1.0.0 เผยแพร่สาธารณะ (4 ต.ค.)** — ค้น "pdpa" เจอเป็นอันดับ 1 · ผู้ใช้ 0 · คะแนน 0
- **pdpa.tm8labs.com** มีปุ่มติดตั้งจริง + `/privacy/`
- **LINE OA `@672wktjq`** ตั้งค่า+ทดสอบแล้ว (แชทเปิด, ตอบกลับอัตโนมัติ+แมนนวล, รูปโปรไฟล์ t8, ลิงก์เว็บไซต์)
- คลิปเดโม 30 วิ: `store/video/thai-pdpa-guard-demo-16x9.mp4`, `…-9x16.mp4`, YouTube `jrnNpIqK8Tk`
- GitHub repo + GitHub Pages privacy (ยังใช้อยู่)

- **การแก้ listing รอบก่อนผ่านรีวิวแล้ว (5 ต.ค.)**: privacy URL = pdpa.tm8labs.com/privacy/ ✅ · วิดีโอ YouTube ✅ → GitHub Pages ปิดได้แล้ว (ไม่บังคับ)

### ⏳ รอ — v1.0.1 ใน Dashboard (5 ต.ค. เย็น)
- **ผู้ใช้ตั้งค่าใน Dashboard ครบแล้ว** (ตรวจจากภาพหน้าจอ): แพ็กเกจร่าง = 1.0.1 (zip ตรงกับโค้ดล่าสุด เทียบไฟล์แล้ว · สิทธิ์ storage + host เหมือนเดิม) · ชื่อ/สรุปใหม่ขึ้นแล้ว · ภาพหน้าจอ v3 ครบ 5 ภาพเรียง 1→5 ทั้งหน้า **th และ en** (ช่องทั่วไป + ที่แปลแล้ว) · promo tile ใหม่ · URL หน้าแรก + URL การสนับสนุน = https://pdpa.tm8labs.com
- **ยังไม่ยืนยันว่ากด "บันทึกร่าง" → "ส่งเพื่อตรวจสอบ" แล้ว** — ภาพสุดท้ายปุ่มบันทึกร่างยังเป็นสีน้ำเงิน (มีการแก้ค้าง) → เริ่มแชทใหม่ให้ถามผู้ใช้/ขอภาพหน้าจอสถานะก่อน
- เนื้อหา v1.0.1: หน้า welcome + ปุ่ม LINE, แก้บั๊กกล่องร่าง AI, LICENSE, ชื่อ/คำอธิบายสั้นใหม่, ปุ่ม "วิธีใช้และติดต่อ" ใน popup

### ⬜ ยังไม่ได้ทำ
1. โปรโมทหาผู้ใช้ 10 คนแรก + รีวิว (ข้อความพร้อม `store/PROMO-POSTS.md` 5 ชุด)
2. เปิดใช้ `scripts/monitor.js` (แจ้ง LINE รายวันเมื่อเว็บ AI เปลี่ยนจนพัง)
3. ทดสอบกล่องร่าง Gmail บน Gemini จริง หลัง v1.0.1 ขึ้น (ทดสอบได้แค่ฉากจำลอง ถ้า Gemini ใช้ iframe จะไม่ได้ผล)
4. เช็คว่าข้อความต้อนรับ LINE OA เป็นของเราจริง (ตอนทดสอบยังได้ของตั้งต้น)
5. เอกสาร DPO 1 หน้า + ติดตั้งผ่าน Chrome policy (ทำเมื่อเริ่มคุยบริษัท)
6. Phase 5 (หลัง retention > 30%) · ขอเพิ่มโควตาเผยแพร่ (เมื่อมีผู้ใช้/รีวิว)

## 4. รายละเอียดที่ห้ามหาย

### บัญชีและลิงก์
- สโตร์: https://chromewebstore.google.com/detail/lhijhhodcnaaofgkibihakkdebkipphh · item id `lhijhhodcnaaofgkibihakkdebkipphh`
- Developer Dashboard: publisher id `aa876982-9adc-47ad-9063-63f2d5be7f9b` · เจ้าของ `tanthailove2012@gmail.com` (อีเมลผลรีวิวมาที่นี่) · อีเมลติดต่อสาธารณะ `tm8labs@gmail.com` · **โควตาเผยแพร่ 1/2** (บัญชีใหม่ได้แค่ 2 รายการ)
- LINE OA: `@672wktjq` · https://line.me/R/ti/p/@672wktjq · สมัครด้วย tm8labs@gmail.com · ยังเป็น "บัญชีทั่วไป" (ไม่ Verified)
- GitHub: https://github.com/tanthai11284/thai-pdpa-guard (gh CLI login แล้ว) · Pages privacy: https://tanthai11284.github.io/thai-pdpa-guard/PRIVACY — สโตร์เลิกใช้แล้ว (5 ต.ค.) ปิดได้
- เว็บ: https://pdpa.tm8labs.com (Cloudflare Worker `tm8labs-pdpa`, ไฟล์ `../sites/pdpa/`, deploy = ผู้ใช้ลากโฟลเดอร์ใน New deployment) · support@tm8labs.com ส่งต่อเข้า Gmail
- YouTube เดโม: https://youtu.be/jrnNpIqK8Tk

### ขั้นอัปโหลด v1.0.1 (ทำแล้ว 5 ต.ค. — เก็บไว้เป็นแบบสำหรับรุ่นถัดไป)
1. Dashboard → **แพ็กเกจ** → อัปโหลดแพ็กเกจใหม่ → `dist/thai-pdpa-guard-1.0.1.zip`
2. **ข้อมูลสินค้าใน Store** → ชิ้นส่วนโปรโมตขนาดเล็ก → ลบเก่า → `store/promo-440x280.png`
3. หน้าเดียวกัน → **ภาพหน้าจอ** → ลบ 5 ภาพเก่า → อัปโหลด `store/screenshots-v3/1-detect.jpg … 5-settings.jpg` **ตามลำดับเลข** (แคปใหม่ 5 ต.ค. ความละเอียดสูง `store/screenshots-src2/` + คำบรรยายไทย สร้างด้วย `node scripts/store-frames.cjs` · v2 = ชุดซูมจากภาพเก่า ไม่ใช้)
4. เปลี่ยนภาษาเป็น **อังกฤษ – en** แล้วทำข้อ 3 ซ้ำ
5. **บันทึกร่าง** → **ส่งเพื่อตรวจสอบ** → ติ๊กเผยแพร่อัตโนมัติ (ไอคอนไม่ต้องแตะ · ชื่อ/คำอธิบายสั้นมากับ zip)

### ไฟล์สำคัญ
| ไฟล์ | คืออะไร |
|---|---|
| `THAI-PDPA-GUARD-SPEC.md` | สเปกต้นฉบับ (phase 0–5, กฎห้ามทำ ข้อ 15) |
| `store/LISTING.md` | ข้อความหน้าสโตร์, เหตุผล permission, คำตอบแท็บ privacy |
| `store/PROMO-POSTS.md` | ข้อความโปรโมท 5 ชุด + คำตอบ FAQ |
| `store/SUBMIT-CHECKLIST.md` | เช็กลิสต์ส่งสโตร์ |
| `store/screenshots-v3/1-detect.jpg … 5-settings.jpg` | **ภาพสโตร์ที่ใช้อยู่** 1280×800 JPEG มีคำบรรยาย |
| `store/screenshots-src2/*.png` | ภาพแคปต้นฉบับ (ผู้ใช้แคป 5 ต.ค.) ของชุด v3 |
| `store/screenshot-frame.html` + `scripts/store-frames.cjs` | แม่แบบ+สคริปต์สร้างภาพสโตร์ — แก้คำบรรยาย/ครอป/`cover` (ทาดำทับเศษข้อความ ChatGPT ที่โดนตัด) ใน `SHOTS` แล้วรัน |
| `store/screenshots/` · `store/screenshots-v2/` | ภาพชุดเก่า (v1 ไม่มีคำบรรยาย · v2 ซูมจากภาพเก่า) ไม่ใช้แล้ว |
| `store/promo-440x280.html/.png` · `store/icon-source.png` · `store/oa-profile.html/.jpg` | รูปปก, ไอคอนต้นฉบับ, รูป LINE OA |
| `src/sites/index.js` | selector ต่อเว็บ (`editor`, `send`, `response`, `ai`) — แก้ที่นี่เมื่อเว็บ AI เปลี่ยน |
| `welcome/welcome.js` | `LINKS.line` = ลิงก์ LINE OA |
| `_locales/th|en/messages.json` | ข้อความทั้งหมด (`extName`, `extDesc`, `brandName` …) |
| `scripts/monitor.js` + `monitor-install.ps1` + `monitor.config.example.json` | ระบบเฝ้าดูรายวัน (config จริงอยู่ใน .gitignore) |

### คำสั่ง
```bash
npm test                     # 41 เทสต์
npm run lint                 # ห้าม fetch/XHR/eval, ห้าม <all_urls>
npm run pack                 # lint+test+zip → dist/
npm run icons -- --from store/icon-source.png
node scripts/screenshots.js <ภาพ...>          # ครอป 1280x800 JPEG (แบบเก่า)
node scripts/store-frames.cjs                  # ภาพสโตร์ v3 มีคำบรรยาย → store/screenshots-v3/ (ต้องมี Chrome + ffmpeg)
bash scripts/video/build.sh <take1> <take2>   # ตัดต่อคลิป + คำบรรยายไทย
node scripts/dev-server.js   # http://localhost:8765 playground · หน้า extension ใส่ ?stub&lang=th
node scripts/monitor.js [--login|--show]
```
launch config ชื่อ `pdpa-playground` อยู่ที่ `../.claude/launch.json`

### เปิดใช้ monitor (ข้อ 3.2)
1. `node scripts/monitor.js --login` → ล็อกอิน ChatGPT/Claude/Gemini ในหน้าต่างที่เปิด แล้วปิด
2. LINE Developers → เปิด Messaging API ให้ OA → ได้ Channel access token (long-lived) + Your user ID → ใส่ `monitor.config.json`
3. `powershell -ExecutionPolicy Bypass -File scripts/monitor-install.ps1` (รันทุกวัน 09:00 เครื่องต้องเปิด)

### ข้อจำกัดเครื่องมือ/เครื่อง (เจอแล้ว)
- **Claude in Chrome แตะหน้า Chrome Web Store/Dashboard ไม่ได้** → ให้ผู้ใช้กดเองแล้วส่งภาพหน้าจอ
- Chrome headless ถูก Cloudflare บล็อก (chatgpt/claude) → monitor ใช้ CDP + หน้าต่างซ่อนนอกจอ
- Chrome headless ต้องใส่ `--user-data-dir` แยก · หน้าต่างเล็กกว่า ~512px ใช้ไม่ได้ (ย่อด้วย canvas)
- เครื่องผู้ใช้ RAM 8 GB + GTX 1650 Ti 4 GB → Nano ใช้ได้แต่ช้า ต้องพื้นที่ว่าง ≥22 GB
- PowerShell แสดงอักษรไทยเพี้ยน (ไฟล์ไม่เสีย) → ตรวจด้วย node
- ปุ่ม `e` บนคีย์บอร์ดผู้ใช้เสีย (แป้นไทยคือ "ำ") → ใช้วางข้อความแทนพิมพ์
- LINE: ชื่อเว็บไซต์ในโปรไฟล์ OA ไม่แสดง แสดงเป็น URL เปล่า
- Built-in browser pane เปิด chromewebstore.google.com ไม่ได้ → เช็กหน้าสโตร์สาธารณะด้วย `curl` + grep (HTML มี privacy URL, video id, version)
- PNG ที่แคปจากหน้าจอมีขนาดไม่ตายตัว (เช่น 1278×662) → `screenshot-frame.html` อ่านขนาดจริงเอง ครอปเป็นพิกัดของภาพต้นฉบับ

## 5. ความชอบ/สไตล์ของผู้ใช้

- **ตอบภาษาไทยเสมอ**
- ชอบคำอธิบาย**ละเอียด ตรงไปตรงมา ไม่ขายฝัน** ประเมินโอกาสเป็นตัวเลขได้
- **ตรวจไฟล์/ภาพจริงทุกชิ้นก่อนส่งให้ใช้** ห้ามอ้างว่าตรวจแล้วถ้าไม่ได้ตรวจ (เคยส่งภาพหน้าจอสโตร์เรียงกลับด้าน — ผู้ใช้สั่ง "ต้องละเอียดกว่านี้")
- งานหน้าตา (ภาพ/ดีไซน์): **ปรับจากของเดิมทีละน้อย** อย่าเปลี่ยนเลย์เอาต์ทั้งหมดถ้าไม่ได้ขอ
- ทำตาม `../CLAUDE.md`: ตรวจโมเดลก่อนเริ่มงาน · งานด้วย Opus เจอปัญหานอกขอบเขต → **รายงานก่อน อย่าเพิ่งแก้**
- ประหยัดโทเค็น: 1 แชท = 1 เรื่อง · เปิดแชทใหม่เมื่อจบงานหรือ context 60–70% · ก่อนปิดแชทให้สรุป+บันทึก+commit
- คำถามแนว "ควรทำไหม/คิดว่ายังไง" → ให้คำแนะนำพร้อมเหตุผล แล้วรอตกลงก่อนลงมือ
- การกระทำที่มองเห็นได้ภายนอก (กดส่ง/เผยแพร่/โพสต์) ผู้ใช้กดเอง
- ชอบให้ทำตัวอย่าง 1 ชิ้นให้ดูก่อน แล้วค่อยทำที่เหลือ · ชอบให้ไล่ขั้นตอนเป็นลำดับเลข ระบุชื่อเมนู/ปุ่มตามภาษาไทยใน Dashboard
- ผู้ใช้ส่งภาพหน้าจอ Dashboard มาให้ตรวจ → ตรวจทุกภาพแล้วบอกว่าอะไรถูก/ยังขาด

## 6. ขั้นตอนถัดไป (เรียงลำดับ)

1. **ยืนยันว่าส่ง v1.0.1 ตรวจแล้ว** — ขอภาพหน้าจอ Dashboard (สถานะ/แพ็กเกจ) · ถ้ายังไม่ส่ง: บันทึกร่าง → ส่งเพื่อตรวจสอบ → ติ๊กเผยแพร่อัตโนมัติ
2. **หลังผ่านรีวิว:** เช็กหน้าสโตร์สาธารณะ (curl) ว่า version 1.0.1 + ชื่อใหม่ + ภาพ 5 ภาพ
3. ทดสอบในเครื่องผู้ใช้: ถอน-ติดตั้งใหม่ → หน้า welcome เปิดเอง → ปุ่ม LINE ไป @672wktjq · popup ปุ่ม "วิธีใช้และติดต่อ" · ChatGPT/Claude/Gemini ตรวจจับ-ปิดบัง-ถอดกลับ · **Gemini สั่งร่างอีเมล Gmail → กล่องร่างถอดกลับไหม** (ถ้าไม่ได้ น่าจะเป็น iframe → ไล่หาสาเหตุ)
4. **โปรโมท 10 คนแรก** ด้วย `store/PROMO-POSTS.md` ชุดที่ 1 (เล่าได้ว่าค้น "pdpa" เจออันดับ 1)
5. เปิดใช้ monitor (ดูหัวข้อ "เปิดใช้ monitor")
6. ปิด GitHub Pages privacy เดิมได้ (ไม่บังคับ — สโตร์ใช้ URL ใหม่แล้ว)
7. (ทีหลัง) ภาพหน้าจอชุดคำบรรยายอังกฤษสำหรับหน้า en — แก้ข้อความใน `scripts/store-frames.cjs` ใช้ภาพแคปเดิม
8. เก็บตัวเลข installs/users ทุกสัปดาห์ 6 สัปดาห์ → ตัดสิน Phase 5

**ประโยคเปิดแชทใหม่ที่แนะนำ:** `ทำต่อ Thai PDPA Guard อ่าน HANDOFF.md แล้วเช็คสถานะรีวิว v1.0.1`
