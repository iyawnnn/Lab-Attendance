import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  console.log("[AUTH_GOOGLE] Incoming authentication request received.");
  
  try {
    const body = await request.json();
    const { idToken } = body;

    if (!idToken) {
      console.warn("[AUTH_GOOGLE] Missing idToken in request body.");
      return NextResponse.json(
        { error: "Missing identity token (idToken)." },
        { status: 400 }
      );
    }

    console.log("[AUTH_GOOGLE] Verifying idToken with Google tokeninfo endpoint...");
    const googleResponse = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
    );

    if (!googleResponse.ok) {
      console.error("[AUTH_GOOGLE] Google token verification failed network check.");
      return NextResponse.json(
        { error: "Invalid identity token provided." },
        { status: 401 }
      );
    }

    const payload = await googleResponse.json();

    const validClientIds = [
      process.env.GOOGLE_CLIENT_ID,
      process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID
    ].filter(Boolean);

    if (validClientIds.length > 0 && !validClientIds.includes(payload.aud)) {
      console.warn(`[AUTH_GOOGLE] Audience mismatch. Expected: ${validClientIds}, Got: ${payload.aud}`);
      return NextResponse.json(
        { error: "Token audience verification failed token origin check." },
        { status: 403 }
      );
    }

    const email = payload.email;
    if (!email) {
      console.warn("[AUTH_GOOGLE] Google payload did not contain an email address.");
      return NextResponse.json(
        { error: "Unable to retrieve email from identity provider." },
        { status: 400 }
      );
    }

    if (!email.endsWith("@ua.edu.ph")) {
      console.warn(`[AUTH_GOOGLE] Access denied for non-institutional domain email: ${email}`);
      return NextResponse.json(
        { error: "Access restricted strictly to @ua.edu.ph institutional accounts." },
        { status: 403 }
      );
    }

    console.log(`[AUTH_GOOGLE] Validated institutional user: ${email}`);

    const student = await prisma.student.findUnique({
      where: { email: email },
    });

    if (!student) {
      console.log(`[AUTH_GOOGLE] Email ${email} not registered. Redirecting to onboarding profile setup.`);
      return NextResponse.json({
        isRegistered: false,
        email: email,
        firstName: payload.given_name || "",
        lastName: payload.family_name || ""
      }, { status: 200 });
    }

    console.log(`[AUTH_GOOGLE] Student found. Fetching active record data for ID: ${student.student_id}`);
    
    return NextResponse.json({
      isRegistered: true,
      studentId: student.student_id,
      email: student.email,
      firstName: student.first_name,
      lastName: student.last_name,
      sessionToken: student.session_token,
      publicKey: student.public_key
    }, { status: 200 });

  } catch (error) {
    console.error("[AUTH_GOOGLE] Unhandled exception occurred in authentication router:", error);
    return NextResponse.json(
      { error: "Internal Server Error occurred during authentication processing." },
      { status: 500 }
    );
  }
}