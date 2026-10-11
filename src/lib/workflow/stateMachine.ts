import { EnrollmentStatus, Role } from "@prisma/client";

/**
 * State machine ของการฝึกสอน (อ้างอิง docs/ARCHITECTURE.md §3)
 *
 * แต่ละ transition ระบุว่า "บทบาทใดกดได้" เพื่อบังคับ gate ไม่ให้ข้ามขั้น
 */

export type TransitionEvent =
  | "SUBMIT_DOCUMENTS" // นักศึกษาส่งรวมเล่ม
  | "START_STAFF_REVIEW" // จนท.เริ่มตรวจ
  | "STAFF_APPROVE" // จนท.ผ่าน
  | "ADVISOR_APPROVE" // อาจารย์อนุมัติ -> พร้อมออกไปสอน
  | "START_TEACHING" // เริ่มฝึกสอน
  | "START_EVALUATION" // เริ่มประเมิน
  | "COMPLETE" // ผ่านการฝึก
  | "SUBMIT_TO_KURUSAPA" // ส่งคุรุสภา
  | "RETURN" // ตีกลับให้แก้
  | "RESUBMIT" // ส่งกลับมาใหม่หลังแก้
  | "FAIL"
  | "EXTEND";

interface Transition {
  from: EnrollmentStatus;
  to: EnrollmentStatus;
  roles: Role[]; // บทบาทที่มีสิทธิ์ทำ transition นี้
}

export const TRANSITIONS: Record<TransitionEvent, Transition[]> = {
  SUBMIT_DOCUMENTS: [
    { from: "COLLECTING", to: "SUBMITTED", roles: [Role.STUDENT] },
  ],
  START_STAFF_REVIEW: [
    { from: "SUBMITTED", to: "STAFF_VERIFYING", roles: [Role.STAFF, Role.ADMIN] },
  ],
  STAFF_APPROVE: [
    { from: "STAFF_VERIFYING", to: "ADVISOR_APPROVING", roles: [Role.STAFF, Role.ADMIN] },
  ],
  ADVISOR_APPROVE: [
    { from: "ADVISOR_APPROVING", to: "READY_TO_TEACH", roles: [Role.SUPERVISOR, Role.ADMIN] },
  ],
  START_TEACHING: [
    { from: "READY_TO_TEACH", to: "TEACHING", roles: [Role.STAFF, Role.SUPERVISOR, Role.ADMIN] },
  ],
  START_EVALUATION: [
    { from: "TEACHING", to: "EVALUATING", roles: [Role.SUPERVISOR, Role.ADMIN] },
  ],
  COMPLETE: [
    { from: "EVALUATING", to: "COMPLETED", roles: [Role.SUPERVISOR, Role.ADMIN] },
  ],
  SUBMIT_TO_KURUSAPA: [
    { from: "COMPLETED", to: "SUBMITTED_TO_KURUSAPA", roles: [Role.STAFF, Role.ADMIN] },
  ],
  // ตีกลับได้จากขั้นตรวจเอกสาร
  RETURN: [
    { from: "STAFF_VERIFYING", to: "RETURNED", roles: [Role.STAFF, Role.ADMIN] },
    { from: "ADVISOR_APPROVING", to: "RETURNED", roles: [Role.SUPERVISOR, Role.ADMIN] },
  ],
  RESUBMIT: [
    { from: "RETURNED", to: "SUBMITTED", roles: [Role.STUDENT] },
  ],
  FAIL: [
    { from: "EVALUATING", to: "FAILED", roles: [Role.SUPERVISOR, Role.ADMIN] },
  ],
  EXTEND: [
    { from: "EVALUATING", to: "EXTENDED", roles: [Role.SUPERVISOR, Role.ADMIN] },
  ],
};

export interface TransitionResult {
  ok: boolean;
  to?: EnrollmentStatus;
  error?: string;
}

/**
 * ตรวจว่า transition ทำได้ไหม (สถานะตรง + บทบาทมีสิทธิ์)
 * คืนสถานะปลายทางเมื่อผ่าน — ยังไม่เขียน DB (ให้ layer เรียกจัดการ + audit log)
 */
export function canTransition(
  current: EnrollmentStatus,
  event: TransitionEvent,
  role: Role
): TransitionResult {
  const candidates = TRANSITIONS[event];
  if (!candidates) return { ok: false, error: `ไม่รู้จัก event: ${event}` };

  const match = candidates.find((t) => t.from === current);
  if (!match) {
    return { ok: false, error: `ทำ ${event} จากสถานะ ${current} ไม่ได้` };
  }
  if (!match.roles.includes(role)) {
    return { ok: false, error: `บทบาท ${role} ไม่มีสิทธิ์ทำ ${event}` };
  }
  return { ok: true, to: match.to };
}

/** รายชื่อ event ที่บทบาทนี้ทำได้จากสถานะปัจจุบัน (ใช้ render ปุ่มบน UI) */
export function availableEvents(
  current: EnrollmentStatus,
  role: Role
): TransitionEvent[] {
  return (Object.keys(TRANSITIONS) as TransitionEvent[]).filter((event) =>
    TRANSITIONS[event].some((t) => t.from === current && t.roles.includes(role))
  );
}

/** ป้ายภาษาไทยของแต่ละสถานะ (ใช้แสดงผล) */
export const STATUS_LABEL: Record<EnrollmentStatus, string> = {
  COLLECTING: "กำลังเก็บกิจกรรม",
  SUBMITTED: "ส่งเอกสารแล้ว",
  STAFF_VERIFYING: "เจ้าหน้าที่กำลังตรวจ",
  ADVISOR_APPROVING: "อาจารย์กำลังอนุมัติ",
  READY_TO_TEACH: "พร้อมออกไปสอน",
  TEACHING: "กำลังฝึกสอน",
  EVALUATING: "กำลังประเมินผล",
  COMPLETED: "ผ่านการฝึก",
  SUBMITTED_TO_KURUSAPA: "ส่งคุรุสภาแล้ว",
  RETURNED: "ถูกตีกลับให้แก้ไข",
  FAILED: "ไม่ผ่าน",
  EXTENDED: "ต้องฝึกเพิ่ม",
};
