import { EnrollmentStatus } from "@prisma/client";

/**
 * ข้อมูลตัวอย่างสำหรับ "โหมด demo" — ใช้แสดงผลเมื่อยังเชื่อมต่อฐานข้อมูลจริงไม่ได้
 * (ชุดเดียวกับ prisma/seed.ts) พอเชื่อม DB ได้ ระบบจะดึงข้อมูลจริงแทนอัตโนมัติ
 */
export interface MockEnrollment {
  id: string;
  status: EnrollmentStatus;
  student: { name: string };
  supervisor: { name: string } | null;
  school: { name: string } | null;
  term: { name: string };
}

export const MOCK_ENROLLMENTS: MockEnrollment[] = [
  { id: "s1", status: "COLLECTING", student: { name: "นายเอกชัย ไฟฟ้า" }, supervisor: null, school: null, term: { name: "ฝึกสอน 1/2568" } },
  { id: "s2", status: "STAFF_VERIFYING", student: { name: "นางสาวมานี วงจร" }, supervisor: { name: "อ.สมชาย นิเทศ" }, school: null, term: { name: "ฝึกสอน 1/2568" } },
  { id: "s3", status: "TEACHING", student: { name: "นายปิติ กระแส" }, supervisor: { name: "อ.สมชาย นิเทศ" }, school: { name: "วิทยาลัยเทคนิคกรุงเทพ" }, term: { name: "ฝึกสอน 1/2568" } },
  { id: "s4", status: "COMPLETED", student: { name: "นางสาวชูใจ ขดลวด" }, supervisor: { name: "อ.สมชาย นิเทศ" }, school: { name: "วิทยาลัยเทคนิคกรุงเทพ" }, term: { name: "ฝึกสอน 1/2568" } },
  { id: "s5", status: "RETURNED", student: { name: "นายกิตติ มอเตอร์" }, supervisor: { name: "อ.สมชาย นิเทศ" }, school: null, term: { name: "ฝึกสอน 1/2568" } },
  { id: "s6", status: "READY_TO_TEACH", student: { name: "นางสาวพิมพ์ วัตต์" }, supervisor: { name: "อ.วิภา สนาม" }, school: { name: "วิทยาลัยเทคนิคนนทบุรี" }, term: { name: "ฝึกสอน 1/2568" } },
];

export function mockCounts() {
  const map = new Map<EnrollmentStatus, number>();
  for (const e of MOCK_ENROLLMENTS) map.set(e.status, (map.get(e.status) ?? 0) + 1);
  return [...map.entries()].map(([status, _count]) => ({ status, _count }));
}
