import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createHash } from "crypto";

export async function POST(request: Request) {
  console.log("[RECOVER_STEP_2] Committing fresh PIN credentials.");

  try {
    const { studentId, newPin, sessionToken } = await request.json();

    if (!studentId || !newPin || !sessionToken) {
      return NextResponse.json({ success: false, message: "Missing required parameters." }, { status: 400 });
    }

    const cleanStudentId = String(studentId).trim();

    const student = await prisma.student.findUnique({
      where: { student_id: cleanStudentId },
    });

    if (!student || student.session_token !== sessionToken) {
      return NextResponse.json({ success: false, message: "Unauthorized session context." }, { status: 401 });
    }

    // Securely hash the replacement PIN sequence string
    const normalizedNewPin = String(newPin).trim().padStart(6, "0");
    const hashedPin = createHash("sha256").update(normalizedNewPin).digest("hex");

    await prisma.student.update({
      where: { student_id: cleanStudentId },
      data: { recovery_pin: hashedPin },
    });

    console.log(`[PIN_UPDATE] Recovery PIN successfully updated for Student ID: ${cleanStudentId}`);

    return NextResponse.json({ success: true, message: "Recovery PIN successfully updated." }, { status: 200 });

  } catch (error) {
    console.error("[RECOVER_STEP_2] Internal server error:", error);
    return NextResponse.json({ success: false, message: "Server error updating credentials." }, { status: 500 });
  }
}