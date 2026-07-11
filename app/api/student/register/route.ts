// app/api/student/register/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { studentId, firstName, lastName, publicKey, recoveryPin } = await req.json();

    if (!studentId || !firstName || !lastName || !publicKey || !recoveryPin) {
      return NextResponse.json(
        { success: false, message: "All fields are required." },
        { status: 400 }
      );
    }

    // Check if student record already exists in the database
    const existingStudent = await db.student.findUnique({
      where: { student_id: studentId },
    });

    if (existingStudent) {
      return NextResponse.json(
        {
          success: false,
          message: "This Student ID is already registered in the system. Please use Account Recovery with your 4-digit PIN to authorize this device.",
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
        recovery_pin: recoveryPin,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Device registered successfully.",
      data: newStudent,
    });
  } catch (error) {
    console.error("Registration Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error during registration." },
      { status: 500 }
    );
  }
}