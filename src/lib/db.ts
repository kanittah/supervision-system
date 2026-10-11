import { PrismaClient } from "@prisma/client";

// Prisma client singleton (กัน hot-reload สร้าง connection ซ้ำในโหมด dev)
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
