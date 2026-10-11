import { Role } from "@prisma/client";

/**
 * RBAC — สิทธิ์ย่อยต่อบทบาท (อ้างอิง docs/ARCHITECTURE.md §2)
 * เก็บใน code เพื่อความเรียบง่าย; ย้ายไปฐานข้อมูลได้ภายหลังหากต้องปรับต่อภาค
 */

export type Permission =
  | "department.manage"
  | "user.manage"
  | "term.manage"
  | "form.manage" // สร้าง checklist / แบบประเมิน
  | "placement.manage" // จับคู่ นศ.–อาจารย์–สถานศึกษา
  | "activity.record" // นักศึกษาบันทึกกิจกรรม
  | "document.submit" // นักศึกษาส่งรวมเล่ม
  | "document.verify.staff" // จนท.ตรวจ
  | "document.verify.advisor" // อาจารย์อนุมัติ
  | "workitem.submit" // ส่งแผนการสอน/งาน
  | "workitem.review" // ตรวจงาน
  | "visit.record" // บันทึกการนิเทศ
  | "evaluation.grade" // ประเมินผล
  | "kurusapa.export"; // รวบรวมส่งคุรุสภา

const ALL: Permission[] = [
  "department.manage",
  "user.manage",
  "term.manage",
  "form.manage",
  "placement.manage",
  "activity.record",
  "document.submit",
  "document.verify.staff",
  "document.verify.advisor",
  "workitem.submit",
  "workitem.review",
  "visit.record",
  "evaluation.grade",
  "kurusapa.export",
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: ALL,
  STAFF: [
    "term.manage",
    "form.manage",
    "placement.manage",
    "document.verify.staff",
    "kurusapa.export",
  ],
  SUPERVISOR: [
    "document.verify.advisor",
    "workitem.review",
    "visit.record",
    "evaluation.grade",
  ],
  STUDENT: ["activity.record", "document.submit", "workitem.submit"],
  MENTOR: ["evaluation.grade"],
};

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
