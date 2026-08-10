# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**UA LabSign** — a zero-trust laboratory attendance system for the University of Assumption. Next.js (App Router) web portal with three roles: Student, Faculty (Teacher), Admin. There's a companion Android app (separate repo, `UA-Lab-Attendance-Mobile`) that consumes the same `/api/student/*` REST endpoints as this web app.

Core mechanism: each student device generates a non-exportable ECDSA P-256 keypair via the Web Crypto API on registration. The private key never leaves the device (stored in IndexedDB via `idb-keyval`). Every check-in is a client-signed payload (`${studentId}-${labRoom}-${timestamp}`) verified server-side against the student's stored public key, combined with a short-lived instructor-generated 4-digit room PIN.

## Commands

```bash
npm run dev              # start dev server
npm run build             # production build
npm run lint               # eslint

npx prisma generate        # regenerate client (also runs automatically on postinstall)
npx prisma migrate dev     # create/apply a migration in dev
npx prisma studio          # browse the DB
npx prisma db seed         # wipes and reseeds from schedules.json (see prisma/seed.ts)
npx tsx prisma/wipe-students.ts   # standalone script to wipe just the Student table
```

There is no test suite / test runner configured in this repo.

## Architecture

### Two parallel backend patterns — know which one you're editing

- **`app/actions/*.ts`** (`"use server"` Server Actions, barrel re-exported through `app/actions.ts`) — used by the **Admin** (`app/admin/`) and **Teacher** (`app/teacher/`) dashboards. Handles login/logout (httpOnly cookies `admin_session` / `teacher_session`), schedule CRUD, PIN generation, manual attendance overrides, audit logging.
- **`app/api/student/*/route.ts`** REST routes — used by the **Student** portal (`app/student/page.tsx`, plain `fetch()` calls) *and* by the Android app. Handles registration, Google OAuth exchange, device recovery, session/device-status polling, and PIN update.

**Attendance submission is duplicated on purpose, not by accident, but keep both in sync**: `app/actions/student.ts#submitAttendance` (invoked as a Server Action by the web student portal, verifies signatures with `crypto.subtle`) and `app/api/student/attendance/route.ts` (invoked over REST, presumably for the Android client, verifies with Node's `crypto.createVerify`). Both re-implement the same schedule/PIN/late-status/duplicate-check logic independently — if you change verification rules, late-threshold logic, or the duplicate-submission window in one, change it in the other too.

Also note: `registerStudentToDatabase`, `checkRevokedStatus`, and `recoverStudentDevice` are exported from `app/actions/student.ts` / `app/actions.ts` but are **not called anywhere in the web app** — the student portal uses the REST equivalents (`/api/student/register`, `/api/student/recover`) instead. Don't assume the Server Action versions are live code paths.

### Auth — three separate mechanisms, don't conflate them

1. **Admin/Teacher**: `user_id` + bcrypt-hashed password → httpOnly cookie (`admin_session` holds the literal user_id or `"MASTER_ADMIN"`; `MASTER_ADMIN_PASSWORD` env var is a backdoor superuser bypassing the `User` table). `middleware.ts` only gates `/admin/*` and `/teacher/*` paths but is currently a passthrough no-op — real enforcement happens in the Server Actions/pages checking the cookie value against the DB, not in middleware.
2. **Student identity**: Google OAuth (`@ua.edu.ph`, or whatever `ALLOWED_EMAIL_DOMAINS` lists) via `/api/student/auth/google`, which validates the ID token against Google's tokeninfo endpoint and checks `aud` against `GOOGLE_CLIENT_ID`/`EXPO_PUBLIC_GOOGLE_CLIENT_ID`.
3. **Student device binding**: separate from Google auth. A `session_token` (UUID) + the device's public key are both stored on the `Student` row and re-validated on every `/api/student/check-status` poll (used for the "single active device" / instant revocation UX — registering a new device or an admin reset invalidates the old one immediately, checked client-side by polling on tab focus).

### Geofencing is client-side only

`GeofenceGuard` (`app/student/components/GeofenceGuard.tsx`) checks `navigator.geolocation` against `NEXT_PUBLIC_CAMPUS_LAT/LNG` + `NEXT_PUBLIC_GEOFENCE_RADIUS_METERS` using `geolib`, purely to gate the UI. Coordinates are **not** sent to or re-verified by any server route — the server only checks the room PIN + signature + timing. Keep this in mind if asked to "harden" attendance verification.

### Data model (`prisma/schema.prisma`)

- `AcademicTerm` → `Schedule` (a `Schedule` is one class-room-timeslot; holds the ephemeral `active_pin` / `pin_expires_at` for the current check-in window, and an optional `teacher_id`).
- `User` (role `ADMIN` | `TEACHER`) owns `Schedule`s.
- `Student` (`public_key`, `session_token`, `recovery_pin`) — an empty string `""` public_key means the device is revoked (used as a sentinel throughout, not `null`).
- `AttendanceLog` — unique on `(student_id, schedule_id)`; "already checked in" is actually enforced in app code via a rolling 12-hour lookback window (`twelveHoursAgo`), not the DB unique constraint alone, since the same schedule recurs across days.
- `AuditLog` — free-text admin action trail, written via `logAdminAction` (`app/actions/audit.ts`).

Recovery PIN hashing is inconsistent across entry points: `app/actions/student.ts` uses bcrypt, `app/api/student/register/route.ts` uses SHA-256. Since the register route is the one actually used, that's the live behavior — don't assume bcrypt everywhere.

### Real-time (Pusher)

`lib/pusherServer.ts` / `lib/pusherClient.ts` + `hooks/usePusher.ts` (`usePusherEvent` hook). Channels in use: `attendance-channel` (`new-attendance` event, fired on both auto and manual check-in), `schedules-channel` (`schedule-created`/`schedule-updated`/`schedule-deleted`), and a per-student `student-${id}-channel` (`recovery-pin-updated`, used to force a client refetch when an admin resets a device).

### Rate limiting (`lib/ratelimit.ts`)

`checkRateLimit(type, identifier)` tries Upstash Redis REST (`UPSTASH_REDIS_REST_URL`/`TOKEN`) first, and falls back to an in-memory `Map` if Upstash isn't configured or the request fails. The in-memory fallback is per-process — it does not coordinate across serverless instances, so it's a soft limit only in that deployment shape.

### Misc

- `app/actions/utils.ts` holds the PH-timezone time math (`getCurrentPHTimeInMinutes`, `parseScheduleTime`) shared by both attendance-verification implementations — schedules store times as free-text like `"9:00 AM - 10:30 AM"`, parsed via regex.
- `next.config.ts` sets `Cross-Origin-Opener-Policy: same-origin-allow-popups` — required for the Google OAuth popup flow to work; don't remove without checking that flow.
- Line endings are enforced LF via `.gitattributes`.

## Companion repo
Mobile client lives at ../ua-lab-mobile (Expo, React Native).
It consumes app/api/student/**. Any change to request/response shape,
auth flow, or the device signing scheme in these routes must be mirrored in
../ua-lab-mobile/src/services/api.ts and src/utils/crypto.ts.

## Deployment
Production is live on Vercel. Do not modify vercel.json, prisma/migrations/**, or .env.
Schema changes require a new migration, never an edit to an existing one.

## Rules
- Never run git push, git commit --amend, or git rebase without explicit instruction.
- API responses must stay backward compatible with the deployed APK.
