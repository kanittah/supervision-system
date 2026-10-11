# เว็บเวอร์ชัน GitHub Pages + Google Sheets

หน้าเว็บ static (เร็ว) โฮสต์บน **GitHub Pages** แล้วอ่าน/เขียนข้อมูลลง **Google Sheets ใน Google Drive** โดยตรงผ่านบัญชี Google ของผู้ใช้ (ไม่มีเซิร์ฟเวอร์ Apps Script คั่น จึงเร็วกว่า)

- เปิดไฟล์ `index.html` ตรง ๆ (หรือยังไม่ตั้งค่า `config.js`) = **โหมดเดโม่** ข้อมูลจำลอง
- ตั้งค่า `config.js` ครบ = **โหมดใช้งานจริง** ล็อกอิน Google + เก็บข้อมูลในชีต

## โครงสร้าง
| ไฟล์ | หน้าที่ |
|------|--------|
| `index.html` | หน้าเว็บทั้งหมด (UI + logic + ต่อ Sheets API) |
| `config.js` | ใส่ Client ID / Spreadsheet ID / โดเมน |

---

## ขั้นตอนตั้งค่าใช้งานจริง (ทำครั้งเดียว)

### 1) สร้างชีตข้อมูล + ตาราง
- สร้าง Google Sheet ใหม่ด้วยบัญชีมหาวิทยาลัย
- สร้างตาราง 3 แท็บง่าย ๆ ด้วยสคริปต์: เมนู **Extensions → Apps Script** วางไฟล์ [`../appscript/Setup.gs`](../appscript/Setup.gs) แล้วรัน `setupSpreadsheet` (จะได้แท็บ Users / Enrollments / AuditLog + ข้อมูลตัวอย่าง)
- คัดลอก **Spreadsheet ID** จาก URL ของชีต: `https://docs.google.com/spreadsheets/d/`**`<ID ตรงนี้>`**`/edit`

### 2) สร้าง OAuth Client ID (Google Cloud Console)
- ไปที่ [console.cloud.google.com](https://console.cloud.google.com) → สร้างโปรเจกต์ (หรือใช้ที่มี)
- **APIs & Services → Library** → เปิดใช้ **Google Sheets API**
- **APIs & Services → OAuth consent screen** → ตั้งค่า (User type = Internal ถ้าจำกัดในองค์กร)
- **APIs & Services → Credentials → Create Credentials → OAuth client ID**
  - Application type: **Web application**
  - **Authorized JavaScript origins:** ใส่ URL ของเว็บ เช่น
    - `https://kanittah.github.io`
    - (ทดสอบในเครื่อง) `http://localhost:8080`
  - กด Create → คัดลอก **Client ID** (ลงท้าย `.apps.googleusercontent.com`)

### 3) ใส่ค่าใน `config.js`
```js
window.APP_CONFIG = {
  CLIENT_ID: "xxxxx.apps.googleusercontent.com",
  SPREADSHEET_ID: "ไอดีชีตจากข้อ 1",
  DOMAIN: "kmutnb.ac.th"   // หรือเว้นว่างถ้าไม่จำกัดโดเมน
};
```

### 4) แชร์ชีตให้ผู้ใช้
- ผู้ใช้เข้าถึงชีตด้วย "บัญชีตนเอง" → ต้อง **แชร์ชีต** ให้คนที่จะใช้
  - ให้ **สิทธิ์แก้ไข (Editor)** กับคนที่ต้องเปลี่ยนสถานะ/บันทึก (นักศึกษา/อาจารย์/เจ้าหน้าที่)
  - แชร์แบบ "ทุกคนในองค์กรที่มีลิงก์ = ผู้แก้ไข" ก็ได้ ถ้าจำกัดในโดเมน

### 5) เปิด GitHub Pages
- repo ต้อง **Public** (ถ้าใช้ Pages ฟรี) — โค้ดไม่มีความลับ ข้อมูลจริงยังอยู่ในชีตหลัง Google login
- GitHub → **Settings → Pages → Source = GitHub Actions**
- ทุกครั้งที่ push โฟลเดอร์ `web/` จะ deploy อัตโนมัติ (ดู `.github/workflows/pages.yml`)
- ได้ URL: `https://kanittah.github.io/supervision-system/`

### 6) เสร็จ
เปิด URL → กด "เข้าสู่ระบบด้วย Google" → ถ้าอีเมลยังไม่อยู่ใน Users จะเจอหน้าลงทะเบียน

---

## ⚠️ เรื่องความปลอดภัย (อ่านก่อนใช้จริง)
เบราว์เซอร์เขียนชีตตรง ๆ → ผู้ใช้ที่มีสิทธิ์แก้ไขชีต **แก้ข้อมูลในชีตเองได้** (RBAC/กันข้ามขั้น บังคับที่หน้าเว็บเท่านั้น ไม่ได้บังคับระดับฐานข้อมูล). เหมาะกับรุ่นแรกในกลุ่มที่ไว้ใจกัน. ถ้าต้องการบังคับแน่นหนา:
- ย้าย "การเขียน" (เปลี่ยนสถานะ/บันทึก) กลับไปผ่าน Apps Script (เวอร์ชัน `../appscript/`) แล้วให้หน้าเว็บอ่านเร็ว ๆ จาก Sheets API — ได้ทั้งเร็วและปลอดภัย
- หรือย้ายไปฐานข้อมูลที่มี row-level security (เช่น Supabase)

## ทดลองในเครื่อง
```bash
cd web && python3 -m http.server 8080
# เปิด http://localhost:8080  (config.js ว่าง = โหมดเดโม่)
```
