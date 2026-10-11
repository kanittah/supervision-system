import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * ข้อมูลตั้งต้น: ภาควิชาครุศาสตร์ไฟฟ้า + ผู้ใช้ตัวอย่างทุกบทบาท
 * + checklist กิจกรรมก่อนฝึก + แบบประเมิน + นักศึกษาตัวอย่างในหลายสถานะ
 */
async function main() {
  // ── ภาควิชา ──
  const dept = await prisma.department.upsert({
    where: { code: "TE" },
    update: {},
    create: {
      code: "TE",
      nameTh: "ครุศาสตร์ไฟฟ้า",
      nameEn: "Teacher Training in Electrical Engineering",
    },
  });

  // ── รอบฝึก ──
  const term = await prisma.academicTerm.upsert({
    where: { departmentId_year_semester: { departmentId: dept.id, year: 2568, semester: 1 } },
    update: {},
    create: {
      departmentId: dept.id,
      year: 2568,
      semester: 1,
      name: "ฝึกสอน 1/2568",
    },
  });

  // ── ผู้ใช้ ──
  const mkUser = (email: string, name: string, role: Role) =>
    prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, name, role, departmentId: dept.id },
    });

  const admin = await mkUser("admin@fte.kmutnb.ac.th", "ผู้ดูแลระบบ", Role.ADMIN);
  const staff = await mkUser("staff@fte.kmutnb.ac.th", "เจ้าหน้าที่ภาควิชา", Role.STAFF);
  const supervisor = await mkUser("supervisor@fte.kmutnb.ac.th", "อ.สมชาย นิเทศ", Role.SUPERVISOR);

  const students = await Promise.all([
    mkUser("student1@fte.kmutnb.ac.th", "นายเอกชัย ไฟฟ้า", Role.STUDENT),
    mkUser("student2@fte.kmutnb.ac.th", "นางสาวมานี วงจร", Role.STUDENT),
    mkUser("student3@fte.kmutnb.ac.th", "นายปิติ กระแส", Role.STUDENT),
    mkUser("student4@fte.kmutnb.ac.th", "นางสาวชูใจ ขดลวด", Role.STUDENT),
  ]);

  // ── สถานศึกษา ──
  const school = await prisma.school.create({
    data: {
      departmentId: dept.id,
      name: "วิทยาลัยเทคนิคกรุงเทพ",
      address: "กรุงเทพมหานคร",
    },
  });

  // ── checklist กิจกรรมก่อนฝึก (ตั้งค่าต่อภาค) ──
  const activities = [
    "อบรมเตรียมความพร้อมก่อนฝึกประสบการณ์",
    "ผ่านการตรวจสุขภาพ",
    "จัดทำแฟ้มสะสมผลงาน (Portfolio)",
    "ผ่านรายวิชาบังคับก่อนออกฝึก",
  ];
  await Promise.all(
    activities.map((title, i) =>
      prisma.activityTemplate.create({
        data: { departmentId: dept.id, title, order: i },
      })
    )
  );

  // ── แบบประเมิน + เกณฑ์ ──
  const evalForm = await prisma.formTemplate.create({
    data: {
      departmentId: dept.id,
      kind: "EVALUATION",
      name: "แบบประเมินการฝึกสอน",
      fields: {
        create: [
          { label: "การจัดการเรียนรู้", order: 0, maxScore: 30, weight: 1 },
          { label: "การจัดทำแผนการสอน", order: 1, maxScore: 20, weight: 1 },
          { label: "จิตวิญญาณความเป็นครู", order: 2, maxScore: 20, weight: 1 },
          { label: "การวัดและประเมินผล", order: 3, maxScore: 15, weight: 1 },
          { label: "การปฏิบัติงานร่วมกับสถานศึกษา", order: 4, maxScore: 15, weight: 1 },
        ],
      },
    },
  });

  // ── นักศึกษาตัวอย่างในหลายสถานะ (แสดง pipeline) ──
  const enrollmentData = [
    { student: students[0], status: "COLLECTING" as const, withPlacement: false },
    { student: students[1], status: "STAFF_VERIFYING" as const, withPlacement: false },
    { student: students[2], status: "TEACHING" as const, withPlacement: true },
    { student: students[3], status: "COMPLETED" as const, withPlacement: true },
  ];

  for (const d of enrollmentData) {
    await prisma.enrollment.upsert({
      where: { studentId_termId: { studentId: d.student.id, termId: term.id } },
      update: {},
      create: {
        studentId: d.student.id,
        termId: term.id,
        departmentId: dept.id,
        status: d.status,
        supervisorId: d.withPlacement ? supervisor.id : null,
        schoolId: d.withPlacement ? school.id : null,
      },
    });
  }

  console.log("✅ Seed สำเร็จ");
  console.log(`   ภาควิชา: ${dept.nameTh} (${dept.code})`);
  console.log(`   ผู้ใช้: admin/staff/supervisor + นักศึกษา ${students.length} คน`);
  console.log(`   แบบประเมิน: ${evalForm.name}`);
  console.log(`   Login ตัวอย่าง: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
