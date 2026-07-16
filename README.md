# UA LabSign

> **Zero-Trust Laboratory Attendance Tracking System**  
> **University of Assumption | College of Information Technology**

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Neon](https://img.shields.io/badge/Neon-00E599?style=for-the-badge&logo=neon&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Android](https://img.shields.io/badge/Android-3DDC84?style=for-the-badge&logo=android&logoColor=white)


## Overview

**UA LabSign** is a centralized, hardware-bound laboratory attendance tracking ecosystem engineered for the University of Assumption. Traditional paper-based logs and manual spreadsheets are vulnerable to proxy attendance, physical forgery, and data tampering. UA LabSign mitigates these security risks by implementing a **Zero-Trust Infrastructure** that combines asymmetric client-side digital signatures with instant geographic boundary verification.

The platform consists of a centralized Web Portal and an official companion [Android Application](https://github.com/iyawnnn/UA-Lab-Attendance-Mobile). Every check-in request is cryptographically signed by an isolated key pair locked directly inside the student's authorized terminal. The system verifies physical presence strictly at the moment of submission, providing unalterable audit trails while preserving user privacy outside check-in windows.


## Associated Repositories

* **Web Portal & Backend Infrastructure:** Current Repository
* **Official Companion Android Application:** [UA-Lab-Attendance-Mobile](https://github.com/iyawnnn/UA-Lab-Attendance-Mobile)


## Core Security Architecture

UA LabSign utilizes a defense-in-depth security model to guarantee data integrity and non-repudiation:

### 1. Device-Bound Asymmetric Cryptography (ECDSA P-256)
* Leverages the native **Web Crypto API** to generate non-exportable Elliptic Curve Digital Signature Algorithm (ECDSA P-256) key pairs directly on student devices during single registration.
* Private keys are stored locally in IndexedDB using `idb-keyval` (or secure hardware keystores on mobile) and are never transmitted to or stored on server infrastructure.
* Attendance payloads (combining Student ID, Facility ID, and timestamp) are signed locally. Server endpoints verify the signature against the registered public key before logging attendance.

### 2. Instant Geofencing Verification
* Cross-references device hardware GPS coordinates against a predefined laboratory campus perimeter (default radius of 65 meters).
* Evaluates location telemetry strictly at the exact second of session PIN submission.
* Eliminates continuous background location tracking, protecting student location privacy outside active check-in moments.

### 3. Time-Sensitive Session PINs
* Instructors generate dynamic 4-digit room PINs configured with active durations ranging from 1 to 15 minutes.
* Submissions attempted outside the active session timer or from unverified locations are automatically rejected.

### 4. Credential & Data Protection
* Enforces single-device registration tied to official university Google Accounts (`@ua.edu.ph`).
* Uses `bcrypt` password hashing (work factor 10) for all administrative credentials and student 6-digit Recovery PINs.
* All database interactions run through parameterized object-relational mapping (ORM) queries to eliminate SQL injection risks.


## Role-Based Feature Matrix

### Student Portal
* **Single Device Registration:** Binds identity to a single hardware terminal using Web Crypto ECDSA key pairs.
* **Instant Verification:** Evaluates GPS location and instructor session PINs in real time.
* **Account Recovery & Transfer:** Allows self-service hardware migration using a secure 6-digit Recovery PIN.
* **Attendance Ledger:** Searchable historical check-in records with a "Deauthorize This Device" action.

### Faculty Dashboard
* **Session Initialization:** Selects scheduled classes to generate time-sensitive, dynamic 4-digit room PINs.
* **Live Session Oversight:** Real-time visibility into active check-in logs, timestamps, and student statuses.
* **Manual Overrides & Reporting:** Allows manual attendance adjustment for edge cases and exports structured class reports.

### Admin Control Panel
* **Endpoint Management:** Centralized device registry to inspect or revoke student hardware bindings.
* **Schedule & Staff Allocation:** Management of class timetables, room assignments, and instructor roles.
* **System Audit Trail:** Immutable activity log tracking all system events, schedule modifications, and login attempts.


## Technology Stack

* **Framework:** Next.js (App Router, React)
* **Language:** TypeScript
* **Mobile Client:** Native Android Companion App ([GitHub Repository](https://github.com/iyawnnn/UA-Lab-Attendance-Mobile))
* **Styling:** Tailwind CSS, Lucide Icons, Framer Motion
* **Client Cryptography & Storage:** Web Crypto API (ECDSA P-256), `idb-keyval` (IndexedDB wrapper)
* **Backend & Security:** Next.js Server Actions, Node.js `crypto` module, `bcrypt`
* **Database & ORM:** Cloud-hosted serverless PostgreSQL (deployed via Neon), managed via Prisma ORM
