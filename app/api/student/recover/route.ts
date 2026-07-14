import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomUUID, createHash } from "crypto";

export async function POST(request: Request) {
  console.log("[RECOVER_STEP_1] Verification handshake initiated.");

  try {
    const { studentId, recoveryPin, publicKey } = await request.json();

    if (!studentId || !recoveryPin || !publicKey) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: Student ID, PIN, or Public Key." },
        { status: 400 }
      );
    }

    const cleanStudentId = String(studentId).trim();

    const student = await prisma.student.findUnique({
      where: { student_id: cleanStudentId },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, message: "No registered student matches this Student ID." },
        { status: 404 }
      );
    }

    // Verify current PIN hash signature safely
    const normalizedInput = String(recoveryPin).trim().padStart(6, "0");
    const hashedInputPin = createHash("sha256").update(normalizedInput).digest("hex");
    const dbHashPin = student.recovery_pin.trim();

    if (dbHashPin !== hashedInputPin) {
      return NextResponse.json(
        { success: false, message: "Incorrect Recovery PIN. Please try again." },
        { status: 401 }
      );
    }

    // Generate fresh session token to instantly drop the other terminal session binding[cite: 1]
    const newSessionToken = randomUUID();

    await prisma.student.update({
      where: { student_id: cleanStudentId },
      data: {
        public_key: publicKey,
        session_token: newSessionToken,
      },
    });

    console.log(`[EVADE_SUCCESS] Session token shifted for ID: ${cleanStudentId}. Previous terminal evicted.[cite: 1]`);

    return NextResponse.json(
      {
        success: true,
        message: "Identity verified. Previous device session evicted. Proceeding to PIN setup.[cite: 1]",
        sessionToken: newSessionToken,
        email: student.email,
        firstName: student.first_name,
        lastName: student.last_name,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("[RECOVER_STEP_1] Internal server error:", error);
    return NextResponse.json({ success: false, message: "Server error during verification." }, { status: 500 });
  }
}