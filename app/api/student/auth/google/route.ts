import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { db } from "@/lib/db";
import crypto from "crypto";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json(
        { success: false, message: "Google ID token is required." },
        { status: 400 }
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

    const student = await db.student.findUnique({
      where: { email },
    });

    if (student) {
      // Generate a new session token to enforce single active session
      const sessionToken = crypto.randomUUID();

      // Save new session token in database to revoke previous device sessions
      await db.student.update({
        where: { id: student.id },
        data: { session_token: sessionToken },
      });

      return NextResponse.json({
        success: true,
        isRegistered: true,
        sessionToken,
        student: {
          id: student.id,
          studentId: student.student_id,
          email: student.email,
          firstName: student.first_name,
          lastName: student.last_name,
          publicKey: student.public_key,
        },
      });
    }

    return NextResponse.json({
      success: true,
      isRegistered: false,
      googleProfile: {
        email: payload.email,
        firstName: payload.given_name || "",
        lastName: payload.family_name || "",
      },
    });
  } catch (error) {
    console.error("Google Auth API Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to authenticate Google identity." },
      { status: 500 }
    );
  }
}