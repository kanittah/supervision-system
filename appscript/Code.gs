/**
 * ระบบนิเทศนักศึกษาฝึกสอน — Google Apps Script backend
 * ฐานข้อมูล: Google Sheets (แต่ละแท็บ = 1 ตาราง) · ล็อกอิน: บัญชี Google โดเมนมหาลัย
 *
 * ต่อ Sheets ผ่าน SpreadsheetApp.getActiveSpreadsheet() → ต้องเป็นสคริปต์แบบ
 * container-bound (สร้างจาก Google Sheet → เมนู Extensions → Apps Script)
 * ตั้งค่าเริ่มต้น: รันฟังก์ชัน setupSpreadsheet() หนึ่งครั้ง (ดู Setup.gs)
 */

const SHEETS = {
  USERS: "Users",
  ENROLL: "Enrollments",
  AUDIT: "AuditLog",
};

// ─────────────────────────────────────────────
// State machine + RBAC (ตรงกับดีไซน์ใน docs/ARCHITECTURE.md)
// ─────────────────────────────────────────────
const TRANSITIONS = {
  SUBMIT_DOCUMENTS: [{ from: "COLLECTING", to: "SUBMITTED", roles: ["STUDENT"] }],
  START_STAFF_REVIEW: [{ from: "SUBMITTED", to: "STAFF_VERIFYING", roles: ["STAFF", "ADMIN"] }],
  STAFF_APPROVE: [{ from: "STAFF_VERIFYING", to: "ADVISOR_APPROVING", roles: ["STAFF", "ADMIN"] }],
  ADVISOR_APPROVE: [{ from: "ADVISOR_APPROVING", to: "READY_TO_TEACH", roles: ["SUPERVISOR", "ADMIN"] }],
  START_TEACHING: [{ from: "READY_TO_TEACH", to: "TEACHING", roles: ["STAFF", "SUPERVISOR", "ADMIN"] }],
  START_EVALUATION: [{ from: "TEACHING", to: "EVALUATING", roles: ["SUPERVISOR", "ADMIN"] }],
  COMPLETE: [{ from: "EVALUATING", to: "COMPLETED", roles: ["SUPERVISOR", "ADMIN"] }],
  SUBMIT_TO_KURUSAPA: [{ from: "COMPLETED", to: "SUBMITTED_TO_KURUSAPA", roles: ["STAFF", "ADMIN"] }],
  RETURN: [
    { from: "STAFF_VERIFYING", to: "RETURNED", roles: ["STAFF", "ADMIN"] },
    { from: "ADVISOR_APPROVING", to: "RETURNED", roles: ["SUPERVISOR", "ADMIN"] },
  ],
  RESUBMIT: [{ from: "RETURNED", to: "SUBMITTED", roles: ["STUDENT"] }],
};

function canTransition_(current, event, role) {
  const cands = TRANSITIONS[event];
  if (!cands) return { ok: false, error: "ไม่รู้จัก event: " + event };
  const m = cands.find((t) => t.from === current);
  if (!m) return { ok: false, error: "ทำ " + event + " จากสถานะ " + current + " ไม่ได้" };
  if (m.roles.indexOf(role) < 0) return { ok: false, error: "บทบาท " + role + " ไม่มีสิทธิ์ทำรายการนี้" };
  return { ok: true, to: m.to };
}

// ─────────────────────────────────────────────
// Web entry point
// ─────────────────────────────────────────────
function doGet() {
  return HtmlService.createHtmlOutputFromFile("Index")
    .setTitle("ระบบนิเทศนักศึกษาฝึกสอน")
    .addMetaTag("viewport", "width=device-width, initial-scale=1")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ─────────────────────────────────────────────
// Sheet helpers
// ─────────────────────────────────────────────
function ss_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}
function headers_(name) {
  const sh = ss_().getSheetByName(name);
  return sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
}
function readObjects_(name) {
  const sh = ss_().getSheetByName(name);
  if (!sh) throw new Error("ไม่พบแท็บ " + name + " — รัน setupSpreadsheet() ก่อน");
  const values = sh.getDataRange().getValues();
  const heads = values.shift();
  return values
    .map((r, i) => {
      const o = { _row: i + 2 };
      heads.forEach((h, c) => (o[h] = r[c]));
      return o;
    })
    .filter((o) => o[heads[0]] !== "" && o[heads[0]] != null);
}

// ─────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────
function currentEmail_() {
  return (Session.getActiveUser().getEmail() || "").toLowerCase();
}
function currentUser_() {
  const email = currentEmail_();
  if (!email) return null;
  const u = readObjects_(SHEETS.USERS).find((x) => String(x.email).toLowerCase() === email);
  if (!u) return null;
  return { email: u.email, name: u.name, role: u.role, departmentId: u.departmentId };
}

// ─────────────────────────────────────────────
// API (เรียกจาก client ผ่าน google.script.run)
// ─────────────────────────────────────────────

/** ข้อมูลตั้งต้นเมื่อเปิดแอป: ผู้ใช้ปัจจุบัน + รายการที่เห็นตามสิทธิ์ */
function getBootstrap() {
  const email = currentEmail_();
  const user = currentUser_();
  return {
    email: email,
    user: user, // null = ยังไม่ลงทะเบียน → client แสดงหน้าลงทะเบียน
    enrollments: user ? enrollmentsFor_(user) : [],
  };
}

/** ลงทะเบียนผู้ใช้ใหม่ (อีเมลจาก session — ปลอมไม่ได้) */
function registerUser(name, role) {
  const email = currentEmail_();
  if (!email) throw new Error("ไม่พบอีเมล — กรุณาเข้าสู่ระบบด้วยบัญชี Google ของมหาวิทยาลัย");
  if (["STUDENT", "SUPERVISOR", "STAFF"].indexOf(role) < 0) throw new Error("บทบาทไม่ถูกต้อง");
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const users = readObjects_(SHEETS.USERS);
    if (users.find((x) => String(x.email).toLowerCase() === email)) {
      return getBootstrap(); // มีอยู่แล้ว
    }
    ss_()
      .getSheetByName(SHEETS.USERS)
      .appendRow([email, name, role, "TE", true, new Date()]);
    return getBootstrap();
  } finally {
    lock.releaseLock();
  }
}

/** เปลี่ยนสถานะการฝึกผ่าน state machine + บันทึก audit log */
function transition(enrollmentId, event, note) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const me = currentUser_();
    if (!me) throw new Error("ยังไม่ได้ลงทะเบียน");
    const sh = ss_().getSheetByName(SHEETS.ENROLL);
    const e = readObjects_(SHEETS.ENROLL).find((r) => r.id === enrollmentId);
    if (!e) throw new Error("ไม่พบข้อมูลการฝึก");

    // นักศึกษาทำได้เฉพาะของตนเอง / อาจารย์เฉพาะที่รับผิดชอบ
    if (me.role === "STUDENT" && String(e.studentEmail).toLowerCase() !== me.email)
      throw new Error("ดำเนินการได้เฉพาะข้อมูลของตนเอง");
    if (me.role === "SUPERVISOR" && String(e.supervisorEmail).toLowerCase() !== me.email)
      throw new Error("ดำเนินการได้เฉพาะนักศึกษาในความดูแล");

    const res = canTransition_(e.status, event, me.role);
    if (!res.ok) throw new Error(res.error);

    const h = headers_(SHEETS.ENROLL);
    sh.getRange(e._row, h.indexOf("status") + 1).setValue(res.to);
    sh.getRange(e._row, h.indexOf("updatedAt") + 1).setValue(new Date());
    appendAudit_(enrollmentId, me, event, e.status, res.to, note || "");

    return enrollmentsFor_(me);
  } finally {
    lock.releaseLock();
  }
}

// ─────────────────────────────────────────────
// internal
// ─────────────────────────────────────────────
function enrollmentsFor_(user) {
  let rows = readObjects_(SHEETS.ENROLL);
  if (user.role === "SUPERVISOR")
    rows = rows.filter((r) => String(r.supervisorEmail).toLowerCase() === user.email);
  else if (user.role === "STUDENT")
    rows = rows.filter((r) => String(r.studentEmail).toLowerCase() === user.email);
  const audits = readObjects_(SHEETS.AUDIT);
  return rows.map((r) => toClientEnrollment_(r, audits));
}

function toClientEnrollment_(r, audits) {
  let done = [];
  try {
    done = JSON.parse(r.activitiesDone || "[]");
  } catch (e) {
    done = [];
  }
  const log = audits
    .filter((a) => a.enrollmentId === r.id)
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .map((a) => ({ action: a.action, by: a.actorEmail + " · " + a.actorRole, at: fmtDate_(a.at) }));
  return {
    id: r.id,
    name: r.studentName,
    email: r.studentEmail,
    code: r.studentCode || "",
    term: r.termName,
    status: r.status,
    supervisor: r.supervisorName || null,
    school: r.schoolName || null,
    done: done,
    log: log,
  };
}

function appendAudit_(enrollmentId, me, event, from, to, note) {
  ss_()
    .getSheetByName(SHEETS.AUDIT)
    .appendRow([
      Utilities.getUuid(),
      enrollmentId,
      me.email,
      me.role,
      "STATUS_CHANGE:" + event,
      from,
      to,
      note,
      new Date(),
    ]);
}

function fmtDate_(d) {
  if (!d) return "";
  return Utilities.formatDate(new Date(d), "Asia/Bangkok", "d MMM yyyy HH:mm");
}
