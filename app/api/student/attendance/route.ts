// app/api/student/attendance/route.ts

import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/ratelimit";
import { pusherServer } from "@/lib/pusherServer"; // Integrated Pusher server instance

function verifyEcdsaSignature(
  message: string,
  signatureBase64: string,
  publicKeyPem: string
): boolean {
  try {
    const verify = crypto.createVerify("SHA256");
    verify.update(message);
    const signatureBuffer = Buffer.from(signatureBase64, "base64");

    return verify.verify(
      {
        key: publicKeyPem,
        format: "pem",
        type: "spki",
      },
      signatureBuffer
    );
  } catch (error) {
    console.error("ECDSA Verification Exception:", error);
    return false;
  }
}

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

    const rateLimit = await checkRateLimit("attendance", studentId);
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, message: rateLimit.message },
        { status: 429 }
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

    if (isNaN(clientTime) || Math.abs(serverTime - clientTime) > allowedDrift) {
      return NextResponse.json(
        { success: false, message: "Request rejected: Clock desynchronization detected." },
        { status: 400 }
      );
    }

    const messageToVerify = `${studentId}-${labRoom}-${timestamp}`;
    const isValid = verifyEcdsaSignature(
      messageToVerify,
      signature,
      student.public_key
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

    const newLog = await db.attendanceLog.create({
      data: {
        student_id: studentId,
        schedule_id: matchedSchedule.id,
        status: "ON_TIME",
        signature,
      },
    });

    // Safely trigger real-time updates for dashboards
    try {
      const studentDisplayName =
        (student as any).name ||
        `${(student as any).first_name || ""} ${(student as any).last_name || ""}`.trim() ||
        studentId;

      await pusherServer.trigger("attendance-channel", "new-attendance", {
        id: newLog.id,
        studentName: studentDisplayName,
        studentFirstName: student.first_name,
        studentLastName: student.last_name,
        studentId: studentId,
        status: "ON_TIME",
        roomName: labRoom,
        courseCode: matchedSchedule.course_code,
        section: matchedSchedule.section,
        createdAt: newLog.timestamp,
      });
    } catch (pusherError) {
      console.error("[REALTIME_BROADCAST_ERROR] Failed to push live attendance log:", pusherError);
    }

    return NextResponse.json({
      success: true,
      message: `Attendance securely recorded for ${labRoom}!`,
    });
  } catch (error: any) {
    console.error("Attendance API Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message ? `Server Error: ${error.message}` : "Server error while processing attendance."
      },
      { status: 500 }
    );
  }
}