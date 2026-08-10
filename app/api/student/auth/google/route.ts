import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client();

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

    const validClientIds = [
      process.env.GOOGLE_CLIENT_ID,
      process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    ].filter((clientId): clientId is string => Boolean(clientId?.trim()));

    if (validClientIds.length === 0) {
      console.error("[AUTH_GOOGLE] No accepted Google OAuth client ID is configured.");
      return NextResponse.json(
        { error: "Google authentication is not configured on the server." },
        { status: 503 }
      );
    }

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: validClientIds,
      });
      payload = ticket.getPayload();
    } catch {
      console.warn("[AUTH_GOOGLE] Google ID token verification failed.");
      return NextResponse.json(
        { error: "Invalid identity token provided." },
        { status: 401 }
      );
    }

    if (!payload) {
      return NextResponse.json(
        { error: "Invalid identity token provided." },
        { status: 401 }
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

    const allowedDomainsString = process.env.ALLOWED_EMAIL_DOMAINS || "ua.edu.ph";
    const allowedDomains = allowedDomainsString.split(",").map(domain => domain.trim());
    const isDomainAuthorized = allowedDomains.some(domain => email.endsWith(`@${domain}`));

    if (!isDomainAuthorized) {
      console.warn(`[AUTH_GOOGLE] Access denied for non-institutional domain email: ${email}`);
      return NextResponse.json(
        { error: `Access restricted strictly to authorized institutional accounts (${allowedDomainsString}).` },
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
        firstName: (payload.given_name || "").trim().toUpperCase(),
        lastName: (payload.family_name || "").trim().toUpperCase()
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