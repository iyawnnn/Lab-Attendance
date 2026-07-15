import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createHash, randomUUID } from "crypto";

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
      email 
    } = body;

    if (!studentId || !recoveryPin || !publicKey || !email) {
      return NextResponse.json(
        { success: false, message: "Missing required onboarding parameters." },
        { status: 400 }
      );
    }

    const cleanStudentId = String(studentId).trim();

    // Standardize text strings to uppercase to maintain unified database formatting
    const cleanFirstName = String(firstName || "").trim().toUpperCase();
    const cleanLastName = String(lastName || "").trim().toUpperCase();

    // Pad recovery values to handle potential leading zeros and hash via SHA-256
    const normalizedPin = String(recoveryPin).trim().padStart(6, "0");
    const hashedPin = createHash("sha256").update(normalizedPin).digest("hex");

    const newSessionToken = randomUUID();

    const existingStudent = await prisma.student.findUnique({
      where: { student_id: cleanStudentId },
    });

    if (existingStudent) {
      if (!existingStudent.public_key || existingStudent.public_key === "") {
        console.log(`[REGISTER_STUDENT] Student "${cleanStudentId}" re-onboarding via device recovery.`);
        
        const dbHashPin = existingStudent.recovery_pin ? existingStudent.recovery_pin.trim() : "";
        
        if (dbHashPin && dbHashPin !== hashedPin) {
          return NextResponse.json(
            { success: false, message: "Incorrect Recovery PIN. Please try again." },
            { status: 401 }
          );
        }

        await prisma.student.update({
          where: { student_id: cleanStudentId },
          data: {
            public_key: publicKey,
            session_token: newSessionToken,
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
        return NextResponse.json(
          { success: false, message: "This Student ID is already registered to an active device." },
          { status: 409 }
        );
      }
    }

    console.log(`[REGISTER_STUDENT] Committing credentials securely for Student ID: "${cleanStudentId}"`);

    await prisma.student.create({
      data: {
        student_id: cleanStudentId,
        email: String(email).trim().toLowerCase(), 
        first_name: cleanFirstName,
        last_name: cleanLastName,
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