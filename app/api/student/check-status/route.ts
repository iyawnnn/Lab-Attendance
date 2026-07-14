import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const sessionToken = searchParams.get("sessionToken");
    const devicePublicKey = searchParams.get("publicKey");

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

    // Session is revoked if public key is cleared OR session token/public key no longer match DB
    const isRevoked =
      !student.public_key ||
      student.public_key === "" ||
      (sessionToken ? student.session_token !== sessionToken : false) ||
      (devicePublicKey ? student.public_key !== devicePublicKey : false);

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