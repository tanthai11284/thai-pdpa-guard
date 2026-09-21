# เช็กลิสต์ก่อนส่งขึ้น Chrome Web Store

## บัญชี (ทำครั้งเดียว)
- [ ] เปิด 2-Step Verification ในบัญชี Google ที่จะใช้ (บังคับ)
- [ ] สมัคร Developer account ที่ https://chrome.google.com/webstore/devconsole และจ่ายค่าลงทะเบียน $5
- [ ] ยืนยันอีเมลติดต่อใน Account tab (แจ้งเตือนนโยบายทั้งหมดมาทางนี้)

## ไฟล์
- [ ] `npm run pack` ผ่าน → ได้ `dist/thai-pdpa-guard-<version>.zip`
- [ ] ไอคอน 128×128 `assets/icon-128.png` (อยู่ใน zip แล้ว; ต้องอัปโหลดซ้ำในช่อง Store icon)
- [ ] ภาพหน้าจอ 1280×800 อย่างน้อย 3 ภาพ (ดู `store/LISTING.md`)
- [ ] Promo tile 440×280 `store/promo-440x280.png`
- [ ] Privacy policy ขึ้น URL สาธารณะแล้ว (GitHub Pages)

## โค้ด (ตรวจโดย `npm run lint` + มือ)
- [x] Manifest V3
- [x] ไม่มี `<all_urls>` / `*://*/*` ใน host_permissions
- [x] ไม่มี fetch / XMLHttpRequest / sendBeacon / WebSocket / eval ในโค้ดที่ ship
- [x] ไม่มี remote code, ไม่มี obfuscation (โค้ดอ่านได้ทุกบรรทัด ไม่ minify)
- [x] ไม่มี credential ฝังในแพ็กเกจ
- [x] ขอ permission เท่าที่ใช้จริง (`storage` + 4 โดเมน)
- [x] ข้อความทั้งหมดผ่าน `chrome.i18n` มี th + en
- [x] ตารางแมปอยู่ใน `storage.session` เท่านั้น
- [x] stats เก็บเฉพาะตัวนับ

## Developer Dashboard — กรอกตาม `store/LISTING.md`
- [ ] Store listing: ชื่อ, summary, description (ไทย + English), category, ภาพ
- [ ] Privacy: single purpose, permission justification, remote code = No, data usage = ไม่เก็บทุกหมวด, รับรอง 3 ข้อ, privacy policy URL
- [ ] Distribution: Public, ทุกภูมิภาค (หรือเลือกไทยก่อน)
- [ ] Submit for review

## หลังส่ง
- รีวิวปกติไม่กี่วัน อาจถึงหลายสัปดาห์ — เกิน 3 สัปดาห์ติดต่อ support จาก Dashboard
- ถ้าถูกปฏิเสธ อ่านเหตุผลในอีเมล แก้ แล้วส่งใหม่ (อุทธรณ์ได้จาก Dashboard ตอบราว 3 วัน)
- อย่าเริ่ม Phase 5 (เก็บเงิน) จนกว่า weekly retention > 30%
