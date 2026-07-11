// app/api/student/recover/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId, pin, newPublicKey } = body;

    if (!studentId || !pin) {
      return NextResponse.json(
        { success: false, message: "Missing required recovery parameters." },
        { status: 400 }
      );
    }

    const student = await db.student.findUnique({
      where: { student_id: studentId },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, message: "Student ID not found in the system." },
        { status: 404 }
      );
    }

    if (!student.recovery_pin) {
      return NextResponse.json(
        { success: false, message: "No recovery PIN set for this account. Please contact administrator." },
        { status: 400 }
      );
    }

    const isPinValid = await bcrypt.compare(pin, student.recovery_pin);
    if (!isPinValid) {
      return NextResponse.json(
        { success: false, message: "Incorrect Recovery PIN." },
        { status: 401 }
      );
    }

    // If a new public key is provided (Mobile App Recovery), link it immediately.
    // If no key is provided (Web App Revocation), just clear the existing key.
    const updatedPublicKey = newPublicKey ? newPublicKey : "";

    await db.student.update({
      where: { student_id: studentId },
      data: { public_key: updatedPublicKey },
    });

    return NextResponse.json(
      { 
        success: true, 
        message: newPublicKey 
          ? "Account recovered and linked to this device successfully." 
          : "Device access revoked successfully."
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Recovery API Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error during recovery." },
      { status: 500 }
    );
  }
}