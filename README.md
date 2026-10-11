# ระบบนิเทศนักศึกษาฝึกสอน

คณะครุศาสตร์อุตสาหกรรม — ภาควิชาครุศาสตร์ไฟฟ้า (ออกแบบเผื่อขยายภาคอื่น)

> โครงสร้าง/สถาปัตยกรรมเต็มดูที่ [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## 🚀 เวอร์ชันที่ใช้งานจริง: Google Apps Script
ระบบจริงที่เลือกใช้อยู่ในโฟลเดอร์ **[`appscript/`](appscript/)** — รันบน Google Apps Script,
ใช้ Google Sheets เป็นฐานข้อมูล, ล็อกอินด้วยบัญชี `@…kmutnb.ac.th`
วิธีติดตั้งดูที่ [appscript/README-DEPLOY.md](appscript/README-DEPLOY.md)

> โฟลเดอร์ `src/`, `prisma/` ด้านล่างเป็นเวอร์ชันทางเลือก (Next.js + Postgres) เก็บไว้เผื่อขยายสเกลใหญ่ในอนาคต

---


## Tech Stack
Next.js 15 (App Router) · TypeScript · Tailwind CSS · Prisma · PostgreSQL

## เริ่มต้นใช้งาน

```bash
# 1. ติดตั้ง dependencies
npm install

# 2. ตั้งค่า env
cp .env.example .env

# 3. เปิดฐานข้อมูล PostgreSQL (ต้องมี Docker)
npm run db:up

# 4. สร้างตารางจาก schema
npm run db:push

# 5. ใส่ข้อมูลตัวอย่าง (ภาคไฟฟ้า + ผู้ใช้ + นักศึกษา)
npm run db:seed

# 6. รัน dev server
npm run dev      # http://localhost:3000
```

> ยังไม่มี Docker? ติดตั้ง Docker Desktop หรือชี้ `DATABASE_URL` ไปยัง PostgreSQL ที่มีอยู่แล้ว

## โครงสร้างโค้ด

```
prisma/schema.prisma          โมเดลข้อมูลทั้งหมด (M1–M7)
prisma/seed.ts                ข้อมูลตั้งต้น
src/lib/workflow/             state machine ของการฝึกสอน (หัวใจระบบ)
src/lib/rbac/                 สิทธิ์ตามบทบาท (RBAC)
src/lib/db.ts                 Prisma client
src/modules/enrollment/       บริการเปลี่ยนสถานะ + audit log
src/app/                      หน้าเว็บ (แดชบอร์ด)
```

## สถานะการพัฒนา
✅ Phase 0 — โครงระบบ, schema, state machine, RBAC, แดชบอร์ดภาพรวม
⬜ Phase 1 — ก่อนฝึก: เก็บกิจกรรม + รวมเอกสาร + verify 2 ชั้น
⬜ Phase 2 — จัดสรร + ระหว่างฝึก: แผนการสอน + บันทึกนิเทศ
⬜ Phase 3 — ประเมินผล + form builder
⬜ Phase 4 — ส่งคุรุสภา + export + แจ้งเตือน
⬜ Phase 5 — เปิดภาควิชาอื่น
```
