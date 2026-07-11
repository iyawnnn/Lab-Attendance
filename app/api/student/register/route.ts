import { NextResponse } from "next/server";
import { registerStudentToDatabase } from "@/app/actions";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId, firstName, lastName, publicKey, recoveryPin } = body;

    if (!studentId || !firstName || !lastName || !publicKey || !recoveryPin) {
      return NextResponse.json(
        { success: false, message: "Missing required registration parameters." },
        { status: 400 }
      );
    }

    const result = await registerStudentToDatabase({
      studentId,
      firstName,
      lastName,
      publicKey,
      recoveryPin,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: result.message.includes("already registered") ? 409 : 400 }
      );
    }

    return NextResponse.json(
      { success: true, message: result.message },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Internal server error during registration processing." },
      { status: 500 }
    );
  }
}