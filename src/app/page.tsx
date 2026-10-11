import { prisma } from "@/lib/db";
import { STATUS_LABEL } from "@/lib/workflow/stateMachine";
import { EnrollmentStatus } from "@prisma/client";
import { MOCK_ENROLLMENTS, mockCounts } from "@/lib/mockData";

const PIPELINE: EnrollmentStatus[] = [
  "COLLECTING",
  "SUBMITTED",
  "STAFF_VERIFYING",
  "ADVISOR_APPROVING",
  "READY_TO_TEACH",
  "TEACHING",
  "EVALUATING",
  "COMPLETED",
  "SUBMITTED_TO_KURUSAPA",
];

// สีประจำสถานะ (อ้างอิง design token ใน globals.css)
const STATUS_COLOR: Record<string, string> = {
  COLLECTING: "var(--s-collecting)",
  SUBMITTED: "var(--s-submitted)",
  STAFF_VERIFYING: "var(--s-verifying)",
  ADVISOR_APPROVING: "var(--s-approving)",
  READY_TO_TEACH: "var(--s-ready)",
  TEACHING: "var(--s-teaching)",
  EVALUATING: "var(--s-evaluating)",
  COMPLETED: "var(--s-completed)",
  SUBMITTED_TO_KURUSAPA: "var(--s-kurusapa)",
  RETURNED: "var(--s-returned)",
  FAILED: "var(--s-returned)",
  EXTENDED: "var(--s-returned)",
};

const card = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  boxShadow: "var(--shadow)",
} as const;

async function loadData() {
  try {
    const [counts, enrollments] = await Promise.all([
      prisma.enrollment.groupBy({ by: ["status"], _count: true }),
      prisma.enrollment.findMany({
        include: { student: true, supervisor: true, school: true, term: true },
        orderBy: { updatedAt: "desc" },
        take: 50,
      }),
    ]);
    return { ok: true as const, demo: false, counts, enrollments };
  } catch {
    // ยังไม่มีฐานข้อมูล → แสดงข้อมูลตัวอย่างเพื่อดูหน้าตาระบบได้ทันที
    return {
      ok: true as const,
      demo: true,
      counts: mockCounts(),
      enrollments: MOCK_ENROLLMENTS,
    };
  }
}

function Pill({ status }: { status: EnrollmentStatus }) {
  const c = STATUS_COLOR[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ color: c, background: `color-mix(in srgb, ${c} 15%, transparent)` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
      {STATUS_LABEL[status]}
    </span>
  );
}

export default async function DashboardPage() {
  const data = await loadData();

  const countMap = new Map(data.counts.map((c) => [c.status, c._count]));

  return (
    <div className="space-y-8">
      {data.demo && (
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs"
          style={{
            color: "var(--accent-ink)",
            background: "var(--accent-soft)",
            border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
          }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--accent)" }} />
          โหมด demo — แสดงข้อมูลตัวอย่าง (ยังไม่ได้เชื่อมฐานข้อมูล) · เชื่อม DB
          แล้วระบบจะดึงข้อมูลจริงอัตโนมัติ
        </div>
      )}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--ink-faint)" }}>
          ภาพรวมความคืบหน้า
        </h2>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
          {PIPELINE.map((status) => (
            <div
              key={status}
              className="relative overflow-hidden rounded-xl p-3 text-center"
              style={card}
            >
              <span
                className="absolute inset-y-0 left-0 w-[3px]"
                style={{ background: STATUS_COLOR[status] }}
              />
              <div className="text-2xl font-bold tabular-nums" style={{ color: "var(--ink)" }}>
                {countMap.get(status) ?? 0}
              </div>
              <div className="mt-1 text-[10.5px] leading-tight" style={{ color: "var(--ink-soft)" }}>
                {STATUS_LABEL[status]}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--ink-faint)" }}>
          นักศึกษาในระบบ ({data.enrollments.length})
        </h2>
        <div className="overflow-x-auto rounded-xl" style={card}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide" style={{ color: "var(--ink-faint)" }}>
                <th className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>นักศึกษา</th>
                <th className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>รอบฝึก</th>
                <th className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>อาจารย์นิเทศ</th>
                <th className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>สถานศึกษา</th>
                <th className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {data.enrollments.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-3 font-semibold" style={{ borderTop: "1px solid var(--border)", color: "var(--ink)" }}>
                    {e.student.name}
                  </td>
                  <td className="px-4 py-3" style={{ borderTop: "1px solid var(--border)", color: "var(--ink-soft)" }}>{e.term.name}</td>
                  <td className="px-4 py-3" style={{ borderTop: "1px solid var(--border)", color: e.supervisor ? "var(--ink-soft)" : "var(--ink-faint)" }}>
                    {e.supervisor?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3" style={{ borderTop: "1px solid var(--border)", color: e.school ? "var(--ink-soft)" : "var(--ink-faint)" }}>
                    {e.school?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3" style={{ borderTop: "1px solid var(--border)" }}>
                    <Pill status={e.status} />
                  </td>
                </tr>
              ))}
              {data.enrollments.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center" style={{ color: "var(--ink-faint)" }}>
                    ยังไม่มีข้อมูล — รัน <code>npm run db:seed</code>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
