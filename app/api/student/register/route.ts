import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomUUID, createHash } from "crypto";

export async function POST(request: Request) {
  console.log("[REGISTER_STUDENT] Onboarding registration request received.");

  try {
    const body = await request.json();
    const { 
      studentId, 
      firstName, 
      lastName, 
      publicKey, 
      recoveryPin, 
      email // ◄ Dynamic email capture added here
    } = body;

    if (!studentId || !recoveryPin || !publicKey || !email) {
      return NextResponse.json(
        { success: false, message: "Missing required onboarding parameters." },
        { status: 400 }
      );
    }

    // ZERO-SAFE FIX: Ensure studentId is strictly evaluated as a trimmed raw String.[cite: 1]
    const cleanStudentId = String(studentId).trim();

    // PIN ZERO-SAFE PROTECTION: Pad to exactly 6 characters and hash using SHA-256[cite: 1]
    const normalizedPin = String(recoveryPin).trim().padStart(6, "0");
    const hashedPin = createHash("sha256").update(normalizedPin).digest("hex");

    const newSessionToken = randomUUID();

    // Check if student already exists to manage reboarding vs block collisions
    const existingStudent = await prisma.student.findUnique({
      where: { student_id: cleanStudentId },
    });

    if (existingStudent) {
      // FIX: Account Recovery Reboarding Flow (Wiped device public keys)[cite: 1]
      if (!existingStudent.public_key || existingStudent.public_key === "") {
        console.log(`[REGISTER_STUDENT] Student "${cleanStudentId}" re-onboarding via device recovery.`);
        
        await prisma.student.update({
          where: { student_id: cleanStudentId },
          data: {
            public_key: publicKey,
            recovery_pin: hashedPin,
            session_token: newSessionToken, // Establishes pristine session state[cite: 1]
          },
        });

        return NextResponse.json(
          {
            success: true,
            message: `Welcome back, ${existingStudent.first_name}! New device bound successfully.`,
            sessionToken: newSessionToken,
          },
          { status: 200 }
        );
      } else {
        // Prevent generic unauthorized duplicate collisions
        return NextResponse.json(
          { success: false, message: "This Student ID is already registered to an active device." },
          { status: 409 }
        );
      }
    }

    console.log(`[REGISTER_STUDENT] Committing credentials securely for Student ID: "${cleanStudentId}"`);

    // Create pristine secure student record mapping the payload dynamics cleanly
    await prisma.student.create({
      data: {
        student_id: cleanStudentId, // Preserves prepended zeros safely[cite: 1]
        email: String(email).trim().toLowerCase(), // ◄ FIX: Now completely dynamic and unique
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