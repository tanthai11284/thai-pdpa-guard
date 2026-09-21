# สั่ง AI สร้างรูปไอคอน (ทางเลือกแทน icon.svg)

## Prompt (คัดลอกทั้งก้อน)

```
App icon for a Chrome extension called "Thai PDPA Guard" that hides personal data before sending to AI chat.

Design: a flat, modern shield filling almost the entire square canvas, edge to edge with only a tiny margin. Inside the shield: two horizontal rounded text-line bars (representing redacted text) and a small yellow-gold circular badge with a checkmark at the lower right of the bars.

Colors: shield in deep blue gradient (#2563eb to #1e3a8a), bars in white, badge in #fbbf24 with a navy checkmark. Background: solid rounded square in a slightly lighter blue, OR fully transparent background.

Style: minimal vector flat design, no text, no letters, no gradient shadows, no 3D, no photorealism, crisp edges, high contrast so it stays readable at 16×16 pixels. Centered composition, square 1:1, 1024×1024 pixels, PNG.
```

ถ้าเครื่องมือรองรับ negative prompt:
```
text, letters, watermark, 3D, glossy, photorealistic, small centered icon with large empty margin, thin lines, blurry
```

## เมื่อได้รูปแล้ว

1. บันทึกเป็น PNG ขนาด 1024×1024 (หรือ 512×512 อย่างต่ำ) พื้นหลังโปร่งใสถ้าเป็นไปได้
2. วางไฟล์ไว้ที่ `store/icon-source.png`
3. รัน

```bash
npm run icons -- --from store/icon-source.png
```

จะได้ `assets/icon-16/32/48/128.png` และ promo tile ใหม่อัตโนมัติ แล้วกดรีโหลด extension ใน `chrome://extensions`

หมายเหตุ: promo tile ยังใช้ `store/icon.svg` ถ้าอยากให้ promo ใช้รูปใหม่ด้วย ให้แก้ `src="icon.svg"` ใน `store/promo-440x280.html` เป็น `src="icon-source.png"`
