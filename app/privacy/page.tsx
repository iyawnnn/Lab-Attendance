import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { 
  ShieldCheck, 
  Lock, 
  Database, 
  KeyRound, 
  MapPin, 
  UserCheck, 
  FileText, 
  AlertCircle 
} from "lucide-react";

export const metadata = {
  title: "Privacy Policy",
  description: "Official Privacy Policy detailing data collection, device-bound ECDSA P-256 cryptography, and privacy safeguards for UA LabSign - University of Assumption.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800">
      <Header forceSolid />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-14">
        
        {/* HERO BANNER */}
        <div className="bg-[#011B51] rounded-2xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden mb-10 border-b-4 border-[#A51A21]">
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-[#FED702] text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Data Protection & Privacy Governance</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight uppercase">
              Privacy <span className="text-[#FED702]">Policy</span>
            </h1>
            <p className="text-slate-200 text-xs sm:text-sm max-w-2xl font-medium leading-relaxed">
              UA LabSign: Zero-Trust Laboratory Attendance Tracking System | University of Assumption
            </p>
          </div>
        </div>

        {/* POLICY CONTENT CONTAINER */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-10">
          
          {/* SECTION 1: INSTITUTIONAL COMMITMENT */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-[#011B51]">
              <FileText className="w-5 h-5 text-[#011B51]" />
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight">
                1. Institutional Commitment & Zero-Trust Framework
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              The University of Assumption is committed to protecting student and faculty privacy while ensuring absolute record integrity across computer laboratory environments. UA LabSign operates under a strict Zero-Trust security model. This policy explains how institutional identity details, device cryptographic credentials, and instant location telemetry are collected, processed, and protected across our web and mobile applications.
            </p>
          </section>

          <hr className="border-slate-100" />

          {/* SECTION 2: INFORMATION WE COLLECT */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5 text-[#011B51]">
              <Database className="w-5 h-5 text-[#011B51]" />
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight">
                2. Information We Collect
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              To eliminate proxy attendance and secure institutional records, UA LabSign processes specific categories of academic and technical data:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="text-xs font-bold text-[#011B51] uppercase tracking-wider block">
                  Institutional Identity Data
                </span>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Authentication is restricted strictly to official university Google accounts (@ua.edu.ph). We collect student names, institutional email addresses, and official Student ID numbers during onboarding.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="text-xs font-bold text-[#011B51] uppercase tracking-wider block">
                  Cryptographic Key Material (ECDSA P-256)
                </span>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  During single registration, a unique key pair is generated via the native Web Crypto API. The public key is stored in our database, while your non-exportable private key remains bound locally to your device storage. Private keys are never uploaded to our servers.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="text-xs font-bold text-[#011B51] uppercase tracking-wider block">
                  Instant Location Check (Geofencing)
                </span>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  GPS coordinates are evaluated strictly at the exact second of room PIN submission to verify presence within a 65-meter laboratory perimeter. Continuous background location tracking is never enabled, preserving student location privacy outside check-in moments.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="text-xs font-bold text-[#011B51] uppercase tracking-wider block">
                  Security Credentials & Timestamps
                </span>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Time-sensitive session PINs, active session tokens, salted Bcrypt hashes of 6-digit Recovery PINs, and precise server-verified timestamps for attendance logs.
                </p>
              </div>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* SECTION 3: PURPOSE OF PROCESSING */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5 text-[#011B51]">
              <UserCheck className="w-5 h-5 text-[#011B51]" />
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight">
                3. Purpose of Data Processing
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              Data collected by UA LabSign is used exclusively for operational academic management:
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed list-disc list-inside pl-1">
              <li>Verifying student presence and preventing proxy check-ins using device-bound digital signatures.</li>
              <li>Confirming physical presence within designated 65-meter laboratory geofence zones during check-in.</li>
              <li>Providing real-time live monitoring dashboards for faculty members during active class sessions.</li>
              <li>Maintaining immutable administrative audit trails to ensure institutional compliance and equipment accountability.</li>
              <li>Generating official class attendance exports for university academic records.</li>
            </ul>
          </section>

          <hr className="border-slate-100" />

          {/* SECTION 4: CRYPTOGRAPHIC ANTI-PROXY SECURITY */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5 text-[#011B51]">
              <Lock className="w-5 h-5 text-[#011B51]" />
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight">
                4. Anti-Proxy Verification & Device Transfer
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              UA LabSign enforces strict single-device registration to mathematically prevent identity spoofing and shared account check-ins:
            </p>
            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 space-y-2 text-xs sm:text-sm text-slate-700 font-medium">
              <p className="leading-relaxed">
                <strong>Non-Repudiation:</strong> Attendance requests are signed using your local private key. Because private keys cannot be exported, another user cannot sign attendance on your behalf from a different phone or laptop.
              </p>
              <p className="leading-relaxed">
                <strong>Device Transfer & Revocation:</strong> If you change or replace your mobile device, logging in on the new hardware requires entering your 6-digit Recovery PIN. Authorizing a new terminal automatically revokes and evicts all previous device bindings and session tokens.
              </p>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* SECTION 5: DATA RETENTION & SECURITY SHARING */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-[#011B51]">
              <KeyRound className="w-5 h-5 text-[#011B51]" />
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight">
                5. Data Retention, Hashing & Disclosure
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              All stored administrative credentials, passwords, and 6-digit Recovery PINs are protected using industry-standard Bcrypt hashing algorithms. Attendance logs are maintained inside an encrypted, cloud-hosted PostgreSQL database with parameterized data access controls. Information stored in UA LabSign is never sold, rented, or shared with commercial entities. Access is strictly governed by Role-Based Access Control (RBAC) limited to authorized students, faculty instructors, and university system administrators.
            </p>
          </section>

          <hr className="border-slate-100" />

          {/* SECTION 6: USER RIGHTS */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-[#011B51]">
              <MapPin className="w-5 h-5 text-[#011B51]" />
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight">
                6. Student Rights & Control
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              Students have full visibility over their attendance history via the searchable student portal. You retain the right to clear local cryptographic keys at any time using the "Deauthorize This Device" button located inside the portal interface. System administrators also maintain endpoint tools to assist with unbinding lost or compromised hardware.
            </p>
          </section>

          <hr className="border-slate-100" />

          {/* SECTION 7: CONTACT INFORMATION */}
          <section className="space-y-3 bg-slate-50 p-5 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-[#011B51]">
              <AlertCircle className="w-4 h-4 text-[#011B51]" />
              <h3 className="text-sm font-bold uppercase tracking-wider">
                Inquiries & Security Contact
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              For questions regarding UA LabSign privacy safeguards, device binding issues, or security concerns, please contact the College of Information Technology or the Laboratory Administrator at the University of Assumption, City of San Fernando, Pampanga.
            </p>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}