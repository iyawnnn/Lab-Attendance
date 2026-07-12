"use server";

import { prisma } from "@/lib/db";

export async function logAdminAction(
  action: string,
  details: string,
  target?: string,
  actor: string = "MASTER_ADMIN"
) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        actor,
        details,
        target: target || null,
      },
    });
  } catch (error) {
    console.error("Failed to write administrative audit log:", error);
  }
}