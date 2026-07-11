// app/api/student/register/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { studentId, firstName, lastName, publicKey, recoveryPin } = await req.json();

    if (!studentId || !firstName || !lastName || !publicKey || !recoveryPin) {
      return NextResponse.json(
        { success: false, message: "All fields are required." },
        { status: 400 }
      );
    }

    const existingStudent = await db.student.findUnique({
      where: { student_id: studentId },
    });

    const salt = await bcrypt.genSalt(10);
    const hashedPin = await bcrypt.hash(recoveryPin, salt);

    if (existingStudent) {
      // Allow registration if the device key was wiped via revocation
      if (!existingStudent.public_key || existingStudent.public_key === "") {
        const updatedStudent = await db.student.update({
          where: { student_id: studentId },
          data: {
            public_key: publicKey,
            recovery_pin: hashedPin,
          },
        });

        return NextResponse.json({
          success: true,
          message: `Welcome back, ${existingStudent.first_name}! Device registered successfully.`,
          data: updatedStudent,
        });
      }

      // Block registration only if an active device key exists
      return NextResponse.json(
        {
          success: false,
          message: "This Student ID is already registered to an active device.",
        },
        { status: 409 }
      );
    }

    // Register brand new student record
    const newStudent = await db.student.create({
      data: {
        student_id: studentId,
        first_name: firstName,
        last_name: lastName,
        public_key: publicKey,
        recovery_pin: hashedPin,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Device registered successfully.",
      data: newStudent,
    });
  } catch (error) {
    console.error("Registration API Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error during registration." },
      { status: 500 }
    );
  }
}