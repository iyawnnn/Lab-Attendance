import { NextResponse } from "next/server";
import { recoverStudentDevice } from "@/app/actions";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId, pin } = body;

    if (!studentId || !pin) {
      return NextResponse.json(
        { success: false, message: "Missing required recovery parameters." },
        { status: 400 }
      );
    }

    const result = await recoverStudentDevice(studentId, pin);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: true, message: result.message },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Internal server error during recovery." },
      { status: 500 }
    );
  }
}