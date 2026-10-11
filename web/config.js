// ─────────────────────────────────────────────────────────────
// ตั้งค่าเชื่อม Google (เว้นค่าว่าง = เว็บรันโหมดเดโม่ข้อมูลจำลอง)
// ค่าเหล่านี้ไม่ใช่ความลับ — เปิดเผยในหน้าเว็บได้ (ความปลอดภัยอยู่ที่ Google login + การแชร์ชีต)
// ─────────────────────────────────────────────────────────────
window.APP_CONFIG = {
  // OAuth Client ID — โปรเจกต์ Google Cloud "supervision-system" (บัญชี panya.sys)
  CLIENT_ID: "804286508743-vn0crusm327mmuj9p827lripjua1der0.apps.googleusercontent.com",
  // ชีต "ฐานข้อมูลระบบนิเทศนักศึกษาฝึกสอน" ใน Drive ของ panya.sys
  SPREADSHEET_ID: "1dgeEQiuU2ape-Ga_KGMBjEobeOVVxAD9-FPCn5Sv90I",
  // อนุญาตเฉพาะอีเมลในโดเมนนี้ (รวมโดเมนย่อย เช่น @fte.kmutnb.ac.th)
  DOMAIN: "kmutnb.ac.th"
};
