// app/api/student/attendance/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Safely converts a PEM or Base64 string into a Uint8Array binary DER buffer.
 */
function parseKeyToUint8Array(base64OrPem: string): Uint8Array {
  const cleanBase64 = base64OrPem
    .replace(/-----BEGIN PUBLIC KEY-----/g, "")
    .replace(/-----END PUBLIC KEY-----/g, "")
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s+/g, ""); // Strips newlines, spaces, and carriage returns

  return new Uint8Array(Buffer.from(cleanBase64, "base64"));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { studentId, labRoom, timestamp, signature, roomPin } = body;

    // 1. Validate required payload parameters
    if (!studentId || !labRoom || !timestamp || !signature || !roomPin) {
      return NextResponse.json(
        { success: false, message: "Missing required attendance parameters." },
        { status: 400 }
      );
    }

    // 2. Query Student Record
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

    // 3. Time drift validation (allows maximum 60s skew between mobile device and server)
    const clientTime = new Date(timestamp).getTime();
    const serverTime = Date.now();
    const allowedDrift = parseInt(process.env.ALLOWED_TIME_DRIFT_MS || "60000", 10);

    if (isNaN(clientTime) || Math.abs(serverTime - clientTime) > allowedDrift) {
      return NextResponse.json(
        { success: false, message: "Request rejected: Clock desynchronization detected. Please check your phone's time settings." },
        { status: 400 }
      );
    }

    // 4. Reconstruct signed payload string and convert keys/signatures safely
    const encoder = new TextEncoder();
    const encodedMessage = encoder.encode(`${studentId}-${labRoom}-${timestamp}`);

    const binarySignature = parseKeyToUint8Array(signature);
    const binaryPublicKey = parseKeyToUint8Array(student.public_key);

    // 5. Import SPKI ECDSA Public Key into Web Crypto API
    let importedPublicKey: CryptoKey;
    try {
      importedPublicKey = await globalThis.crypto.subtle.importKey(
        "spki",
        binaryPublicKey,
        { name: "ECDSA", namedCurve: "P-256" },
        true,
        ["verify"]
      );
    } catch (keyErr) {
      console.error("Public key import failed:", keyErr);
      return NextResponse.json(
        { success: false, message: "Stored security key format is invalid. Please re-register your device." },
        { status: 400 }
      );
    }

    // 6. Verify ECDSA digital signature
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

    // 7. Verify active lab schedule and room PIN
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

    // 8. Prevent duplicate check-ins within 12 hours
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

    // 9. Record attendance in database
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

  } catch (error: any) {
    console.error("Attendance API Exception:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Server error while processing attendance." },
      { status: 500 }
    );
  }
}