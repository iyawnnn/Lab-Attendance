import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  console.log("[CHECK_STATUS] Real-time session validation polling triggered.");

  try {
    const { searchParams } = new URL(request.url);

    const studentId = searchParams.get("studentId") || request.headers.get("x-student-id");
    const sessionToken = searchParams.get("sessionToken") || request.headers.get("x-session-token");
    const publicKey = searchParams.get("publicKey") || request.headers.get("x-public-key");

    if (!studentId) {
      console.warn("[CHECK_STATUS] Status validation rejected due to missing studentId identifier.");
      return NextResponse.json(
        { revoked: true, error: "Missing required parameter: studentId." },
        { status: 400 }
      );
    }

    // ZERO-SAFE FIX: Isolate ID string strictly to execute lookups without stripping formatting zeros
    const cleanStudentId = String(studentId).trim();
    console.log(`[CHECK_STATUS] Checking validation parameters for Student ID: "${cleanStudentId}"`);

    // Fetch the current state of the student record using Prisma ORM
    const student = await prisma.student.findUnique({
      where: { student_id: cleanStudentId },
    });

    if (!student) {
      console.warn(`[CHECK_STATUS] Identity lookup failed. No student record matches ID: ${cleanStudentId}`);
      return NextResponse.json(
        { revoked: true, error: "Student authorization signature record not found." },
        { status: 401 }
      );
    }

    // Catches when the admin completely wiped both fields using resetStudentDevice
    if (student.public_key === "" && student.recovery_pin === "") {
      console.log(`[CHECK_STATUS] Student ID: ${cleanStudentId} has no registered hardware key or recovery PIN. Forcing setup routing.`);
      return NextResponse.json(
        { 
          revoked: false, 
          status: "unconfigured",
          needsPinConfig: true,
          message: "Profile Recovery PIN configuration required." 
        },
        { status: 200 }
      );
    }

    // Strict Single Active Session Enforcement validation layer[cite: 1]
    if (sessionToken && student.session_token !== sessionToken) {
      console.warn(
        `[CHECK_STATUS] Session token mismatch on ID: ${cleanStudentId}.`
      );
      return NextResponse.json(
        { 
          revoked: true, 
          reason: "session_mismatch",
          error: "Session revoked. A newer active session was initiated on another terminal.[cite: 1]" 
        },
        { status: 401 }
      );
    }

    // Cryptographic Device Binding tracking check layer
    if (publicKey) {
      // 🟢 NORMALIZATION FIX: Strip spaces, newlines, and match '+' representations safely
      const normalizedDbKey = String(student.public_key).replace(/[\s\n\r]/g, "").replace(/\+/g, " ");
      const normalizedParamKey = String(publicKey).replace(/[\s\n\r]/g, "").replace(/\+/g, " ");

      if (normalizedDbKey !== normalizedParamKey) {
        console.warn(
          `[CHECK_STATUS] Cryptographic binding signature shift detected for student ID: ${cleanStudentId}.`
        );
        return NextResponse.json(
          { 
            revoked: true, 
            reason: "key_mismatch",
            error: "Device binding altered. Cryptographic hardware signature mismatch." 
          },
          { status: 401 }
        );
      }
    }

    console.log(`[CHECK_STATUS] Structural integrity verified for Student ID: ${cleanStudentId}. Session is valid.`);
    return NextResponse.json(
      { 
        revoked: false, 
        status: "active",
        message: "Client hardware synchronization binding remains fully secure." 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("[CHECK_STATUS] Internal parsing failure encountered during background validation pass:", error);
    return NextResponse.json(
      { revoked: true, error: "Internal operational exception monitored inside status router." },
      { status: 500 }
    );
  }
}