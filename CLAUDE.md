# กติกาโปรเจกต์ Thai PDPA Guard

**ก่อนเริ่มงานใด ๆ ในโปรเจกต์นี้ ต้องอ่าน [HANDOFF.md](./HANDOFF.md) ให้จบก่อน** — มีเป้าหมาย การตัดสินใจ สถานะล่าสุด ลิงก์/ID ขั้นตอนถัดไป และความชอบของผู้ใช้

ก่อนจบเซสชัน (หรือเมื่อผู้ใช้สั่ง "สรุปสถานะ") ต้อง:
1. อัปเดต HANDOFF.md หัวข้อ 3 (สถานะล่าสุด) และ 6 (ขั้นตอนถัดไป) + วันที่/commit ล่าสุดบนหัวไฟล์
2. อัปเดตความจำ `project_thai_pdpa_guard.md` และแถว Thai PDPA Guard ใน `../CLAUDE.md`
3. commit + push (`git push origin main`)

ห้ามทำ (จากสเปก): เพิ่ม network request ในโค้ดที่ ship · ใช้ `<all_urls>` · เก็บตารางแมปลง storage.local · obfuscate · เพิ่มฟีเจอร์ที่ไม่รับใช้ single purpose · ใส่เลขบัตรประชาชนจริงลง repo · ทำ Phase 5 ก่อน retention > 30%
