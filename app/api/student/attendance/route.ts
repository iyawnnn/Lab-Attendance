// app/api/student/attendance/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { studentId, labRoom, timestamp, signature, roomPin } = body;

    if (!studentId || !labRoom || !timestamp || !signature || !roomPin) {
      return NextResponse.json(
        { success: false, message: "Missing required attendance parameters." },
        { status: 400 }
      );
    }

    const student = await db.student.findUnique({
      where: { student_id: studentId },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, message: "Student not found in database. Please register." },
        { status: 404 }
      );
    }

    if (!student.public_key || student.public_key === "") {
      return NextResponse.json(
        { 
          success: false, 
          message: "DEVICE_REVOKED: Your device authorization has been revoked." 
        },
        { status: 403 }
      );
    }

    const clientTime = new Date(timestamp).getTime();
    const serverTime = Date.now();
    const allowedDrift = parseInt(process.env.ALLOWED_TIME_DRIFT_MS || "60000", 10);

    if (Math.abs(serverTime - clientTime) > allowedDrift) {
      return NextResponse.json(
        { success: false, message: "Request rejected: Timestamp desynchronization detected." },
        { status: 400 }
      );
    }

    const encoder = new TextEncoder();
    const encodedMessage = encoder.encode(`${studentId}-${labRoom}-${timestamp}`);

    const binarySignature = new Uint8Array(
      atob(signature).split("").map((c) => c.charCodeAt(0))
    );
    const binaryPublicKey = new Uint8Array(
      atob(student.public_key).split("").map((c) => c.charCodeAt(0))
    );

    const importedPublicKey = await globalThis.crypto.subtle.importKey(
      "spki",
      binaryPublicKey,
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["verify"]
    );

    const isValid = await globalThis.crypto.subtle.verify(
      { name: "ECDSA", hash: { name: "SHA-256" } },
      importedPublicKey,
      binarySignature,
      encodedMessage
    );

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "Security verification failed: Digital signature invalid." },
        { status: 401 }
      );
    }

    const matchedSchedule = await db.schedule.findFirst({
      where: {
        lab_room: labRoom,
        active_pin: roomPin,
        pin_expires_at: { gt: new Date() },
      },
    });

    if (!matchedSchedule) {
      return NextResponse.json(
        { success: false, message: "Verification failed: Invalid, expired, or incorrect Room PIN." },
        { status: 400 }
      );
    }

    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const existingLog = await db.attendanceLog.findFirst({
      where: {
        student_id: studentId,
        schedule_id: matchedSchedule.id,
        timestamp: { gte: twelveHoursAgo },
      },
    });

    if (existingLog) {
      return NextResponse.json(
        { success: false, message: "Attendance already recorded for this session today." },
        { status: 409 }
      );
    }

    await db.attendanceLog.create({
      data: {
        student_id: studentId,
        schedule_id: matchedSchedule.id,
        status: "ON_TIME",
        signature,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Attendance securely recorded for ${labRoom}!`,
    });
  } catch (error) {
    console.error("Attendance API Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error while processing attendance." },
      { status: 500 }
    );
  }
}