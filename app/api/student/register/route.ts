import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { SignJWT } from "jose";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/ratelimit";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function POST(req: Request) {
  try {
    const { idToken, studentId, firstName, lastName, publicKey, recoveryPin } =
      await req.json();

    if (
      !idToken ||
      !studentId ||
      !firstName ||
      !lastName ||
      !publicKey ||
      !recoveryPin
    ) {
      return NextResponse.json(
        { success: false, message: "All fields are required for onboarding." },
        { status: 400 }
      );
    }

    const rateLimit = await checkRateLimit("register", studentId);
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, message: rateLimit.message },
        { status: 429 }
      );
    }

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return NextResponse.json(
        { success: false, message: "Invalid Google token payload." },
        { status: 401 }
      );
    }

    const email = payload.email.toLowerCase();
    const emailDomain = email.split("@")[1];
    const allowedDomains = (process.env.ALLOWED_EMAIL_DOMAINS || "")
      .split(",")
      .map((domain) => domain.trim().toLowerCase());

    const isDomainAllowed = allowedDomains.some(
      (domain) => emailDomain === domain || emailDomain.endsWith("." + domain)
    );

    if (!isDomainAllowed) {
      return NextResponse.json(
        {
          success: false,
          message: "Access restricted to authorized institutional email accounts.",
        },
        { status: 403 }
      );
    }

    const existingEmail = await db.student.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return NextResponse.json(
        { success: false, message: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const existingStudentId = await db.student.findUnique({
      where: { student_id: studentId },
    });

    if (existingStudentId) {
      return NextResponse.json(
        { success: false, message: "This Student ID is already registered." },
        { status: 409 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPin = await bcrypt.hash(recoveryPin, salt);

    const newStudent = await db.student.create({
      data: {
        student_id: studentId,
        email,
        first_name: firstName,
        last_name: lastName,
        public_key: publicKey,
        recovery_pin: hashedPin,
      },
    });

    const jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET);
    const sessionToken = await new SignJWT({
      id: newStudent.id,
      studentId: newStudent.student_id,
      email: newStudent.email,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(jwtSecret);

    return NextResponse.json({
      success: true,
      message: "Student profile created and device registered successfully.",
      sessionToken,
      student: {
        id: newStudent.id,
        studentId: newStudent.student_id,
        email: newStudent.email,
        firstName: newStudent.first_name,
        lastName: newStudent.last_name,
        publicKey: newStudent.public_key,
      },
    });
  } catch (error) {
    console.error("Student Onboarding API Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error during student onboarding." },
      { status: 500 }
    );
  }
}