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

    const logs = await db.attendanceLog.findMany({
      where: { student_id: studentId },
      include: {
        schedule: {
          select: {
            course_code: true,
            section: true,
            lab_room: true,
            schedule: true,
            date: true,
          },
        },
      },
      orderBy: { timestamp: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error("Fetch history API error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch student attendance history." },
      { status: 500 }
    );
  }
}