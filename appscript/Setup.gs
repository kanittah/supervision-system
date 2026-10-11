/**
 * ตั้งค่าเริ่มต้น — รันครั้งเดียวหลังสร้างสคริปต์
 * เมนู Apps Script → เลือกฟังก์ชัน setupSpreadsheet → กด Run (ครั้งแรกจะขออนุญาตสิทธิ์)
 *
 * สร้างแท็บ Users / Enrollments / AuditLog พร้อมหัวตาราง และใส่ข้อมูลตัวอย่าง
 * ⚠ ถ้ามีแท็บอยู่แล้วจะข้าม (ไม่ลบข้อมูลเดิม) — ใช้ resetAll() ถ้าต้องการล้างใหม่
 */

const HEADERS = {
  Users: ["email", "name", "role", "departmentId", "active", "createdAt"],
  Enrollments: [
    "id", "studentEmail", "studentName", "studentCode", "termName", "departmentId",
    "status", "supervisorEmail", "supervisorName", "schoolName", "activitiesDone",
    "createdAt", "updatedAt",
  ],
  AuditLog: ["id", "enrollmentId", "actorEmail", "actorRole", "action", "fromStatus", "toStatus", "note", "at"],
};

function setupSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(HEADERS).forEach(function (name) {
    let sh = ss.getSheetByName(name);
    if (!sh) {
      sh = ss.insertSheet(name);
      sh.appendRow(HEADERS[name]);
      sh.getRange(1, 1, 1, HEADERS[name].length).setFontWeight("bold").setBackground("#f3efeb");
      sh.setFrozenRows(1);
    }
  });
  // ลบแท็บ "Sheet1" ว่างถ้ามี
  const s1 = ss.getSheetByName("Sheet1");
  if (s1 && ss.getSheets().length > 1) ss.deleteSheet(s1);
  seedIfEmpty_(ss);
  SpreadsheetApp.getUi &&
    SpreadsheetApp.getActive().toast("ตั้งค่าเสร็จแล้ว — เปิด Web App ได้เลย", "สำเร็จ", 5);
}

function seedIfEmpty_(ss) {
  const users = ss.getSheetByName("Users");
  if (users.getLastRow() > 1) return; // มีข้อมูลแล้ว ไม่ seed ซ้ำ

  const now = new Date();
  const dom = "@fte.kmutnb.ac.th";
  users.getRange(2, 1, 7, 6).setValues([
    ["kittinan.p@fte.kmutnb.ac.th", "Kittinan (แอดมิน)", "ADMIN", "TE", true, now],
    ["panya.sys@fte.kmutnb.ac.th", "บัญชีระบบ (แอดมิน)", "ADMIN", "TE", true, now],
    ["staff" + dom, "เจ้าหน้าที่ภาควิชา", "STAFF", "TE", true, now],
    ["supervisor" + dom, "อ.สมชาย นิเทศ", "SUPERVISOR", "TE", true, now],
    ["student1" + dom, "นายเอกชัย ไฟฟ้า", "STUDENT", "TE", true, now],
    ["student2" + dom, "นางสาวมานี วงจร", "STUDENT", "TE", true, now],
    ["student3" + dom, "นายปิติ กระแส", "STUDENT", "TE", true, now],
  ]);

  const term = "ฝึกสอน 1/2568";
  const mk = function (id, semail, sname, scode, status, supE, supN, school, done) {
    return [
      id, semail, sname, scode, term, "TE", status, supE || "", supN || "", school || "",
      JSON.stringify(done), now, now,
    ];
  };
  ss.getSheetByName("Enrollments").getRange(2, 1, 4, HEADERS.Enrollments.length).setValues([
    mk("e1", "student1" + dom, "นายเอกชัย ไฟฟ้า", "6501011001", "COLLECTING", "", "", "", [true, true, false, false]),
    mk("e2", "student2" + dom, "นางสาวมานี วงจร", "6501011002", "STAFF_VERIFYING", "supervisor" + dom, "อ.สมชาย นิเทศ", "", [true, true, true, true]),
    mk("e3", "student3" + dom, "นายปิติ กระแส", "6501011003", "TEACHING", "supervisor" + dom, "อ.สมชาย นิเทศ", "วิทยาลัยเทคนิคกรุงเทพ", [true, true, true, true]),
    mk("e4", "student4" + dom, "นางสาวชูใจ ขดลวด", "6501011004", "COMPLETED", "supervisor" + dom, "อ.สมชาย นิเทศ", "วิทยาลัยเทคนิคกรุงเทพ", [true, true, true, true]),
  ]);
}

/** ล้างทุกแท็บแล้ว seed ใหม่ (ใช้ตอนทดสอบ — ระวังข้อมูลหาย) */
function resetAll() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(HEADERS).forEach(function (name) {
    const sh = ss.getSheetByName(name);
    if (sh) ss.deleteSheet(sh);
  });
  setupSpreadsheet();
}
