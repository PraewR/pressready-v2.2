# PressReady V2 Prototype (AI + Question Library + Export + Share)

✅ Features
- ฟอร์ม briefing ครบตามที่กำหนด
- Country ถูกล็อกให้ “ตรงชื่อชีท” ใน question library
- ใช้ **Question Library** เป็น anchors (อยู่ใน `data/question_library.json`)
- Generate ผ่าน **OpenAI** แบบ Structured Output (ถ้ามี `OPENAI_API_KEY`)
- ไม่มี key → fallback เป็น **Mock** (เพื่อให้ demo ได้ทันทีหลัง deploy)
- Export **DOCX**, Export JSON, Print to PDF
- Share link แบบไม่ต้องใช้ DB (บีบอัดข้อมูลลง URL → `/share#data=...`)

## Deploy ให้ได้ลิงก์จริง (Vercel)
1) สร้าง GitHub repo ใหม่ เช่น `pressready-v2`
2) อัปโหลดไฟล์ทั้งหมดขึ้น repo
3) ไป Vercel → New Project → Import Git Repository → Deploy

## เปิดโหมด AI จริง
Vercel → Settings → Environment Variables
- `OPENAI_API_KEY` = คีย์ของคุณ
- (optional) `OPENAI_MODEL` = `gpt-5.2`

Redeploy แล้วกด Generate จะขึ้น Mode: AI

## Share
กดปุ่ม Share link → ระบบจะ copy link ให้
เปิด link บนเครื่องอื่นได้ทันที (read-only + export ได้)
