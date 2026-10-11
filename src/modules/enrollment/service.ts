import { EnrollmentStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { canTransition, TransitionEvent } from "@/lib/workflow/stateMachine";

/**
 * เปลี่ยนสถานะ Enrollment ผ่าน state machine พร้อมบันทึก audit log
 * ทำใน transaction เดียวเพื่อความสอดคล้อง
 */
export async function transitionEnrollment(params: {
  enrollmentId: string;
  event: TransitionEvent;
  actorId: string;
  actorRole: Role;
  note?: string;
}) {
  const { enrollmentId, event, actorId, actorRole, note } = params;

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    select: { id: true, status: true },
  });
  if (!enrollment) throw new Error("ไม่พบข้อมูลการฝึกของนักศึกษา");

  const result = canTransition(enrollment.status, event, actorRole);
  if (!result.ok || !result.to) {
    throw new Error(result.error ?? "ไม่สามารถเปลี่ยนสถานะได้");
  }

  const nextStatus: EnrollmentStatus = result.to;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.enrollment.update({
      where: { id: enrollmentId },
      data: { status: nextStatus },
    });

    await tx.auditLog.create({
      data: {
        enrollmentId,
        actorId,
        action: `STATUS_CHANGE:${event}`,
        fromStatus: enrollment.status,
        toStatus: nextStatus,
        note,
      },
    });

    return updated;
  });
}
