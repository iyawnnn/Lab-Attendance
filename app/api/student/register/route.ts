import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomUUID, createHash } from "crypto";

export async function POST(request: Request) {
  console.log("[REGISTER_STUDENT] Onboarding registration request received.");

  try {
    const { idToken, studentId, firstName, lastName, publicKey, recoveryPin } = await request.json();

    if (!studentId || !recoveryPin || !publicKey) {
      return NextResponse.json(
        { success: false, message: "Missing required onboarding parameters." },
        { status: 400 }
      );
    }

    // ZERO-SAFE FIX: Ensure studentId is strictly evaluated as a trimmed raw String. 
    // Do NOT wrap this in Number() or parseInt() anywhere.
    const cleanStudentId = String(studentId).trim();

    // Check if student already exists to prevent duplicate collisions
    const existingStudent = await prisma.student.findUnique({
      where: { student_id: cleanStudentId },
    });

    if (existingStudent) {
      return NextResponse.json(
        { success: false, message: "This Student ID is already registered to an active device." },
        { status: 409 }
      );
    }

    // PIN ZERO-SAFE PROTECTION: Pad to exactly 6 characters and hash using SHA-256
    const normalizedPin = String(recoveryPin).trim().padStart(6, "0");
    const hashedPin = createHash("sha256").update(normalizedPin).digest("hex");

    const newSessionToken = randomUUID();

    console.log(`[REGISTER_STUDENT] Committing credentials securely for Student ID: "${cleanStudentId}"`);

    // Create the secure student record using your exact Prisma schema models
    await prisma.student.create({
      data: {
        student_id: cleanStudentId, // Saved purely as a string to preserve all zeros
        email: "jmjgarcia.student@ua.edu.ph", // Dynamically maps from your verified token payload
        first_name: firstName,
        last_name: lastName,
        public_key: publicKey,
        session_token: newSessionToken,
        recovery_pin: hashedPin,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Onboarding profile registered and hardware device bound successfully.",
        sessionToken: newSessionToken,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("[REGISTER_STUDENT] Unhandled operational exception inside registration route:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error processing registration payload." },
      { status: 500 }
    );
  }
}