// app/api/student/check-status/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json(
        { success: false, message: "Missing studentId parameter." },
        { status: 400 }
      );
    }

    const student = await db.student.findUnique({
      where: { student_id: studentId },
    });

    if (!student) {
      return NextResponse.json({
        success: true,
        isRevoked: true,
        message: "Student record not found.",
      });
    }

    const isRevoked = !student.public_key || student.public_key === "";

    return NextResponse.json({
      success: true,
      isRevoked,
      firstName: student.first_name,
      lastName: student.last_name,
      first_name: student.first_name,
      last_name: student.last_name,
      currentPublicKey: student.public_key || "",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to check revocation status." },
      { status: 500 }
    );
  }
}