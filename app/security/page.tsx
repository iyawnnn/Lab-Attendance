import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { 
  ShieldCheck, 
  Lock, 
  Database, 
  Key, 
  Cpu, 
  Server, 
  CheckCircle2,
  AlertCircle 
} from "lucide-react";

export const metadata = {
  title: "Data Security Standards",
  description: "Official Data Security Standards detailing technical safeguards, ECDSA P-256 encryption, and zero-trust architecture for UA LabSign - University of Assumption.",
};

export default function DataSecurityStandardsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800">
      <Header forceSolid />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-14">
        
        {/* HERO BANNER */}
        <div className="bg-[#011B51] rounded-2xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden mb-10 border-b-4 border-[#A51A21]">
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-[#FED702] text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Technical Safeguards & Infrastructure Security</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight uppercase">
              Data Security <span className="text-[#FED702]">Standards</span>
            </h1>
            <p className="text-slate-200 text-xs sm:text-sm max-w-2xl font-medium leading-relaxed">
              UA LabSign Architecture & Cryptographic Verification Framework | University of Assumption
            </p>
          </div>
        </div>

        {/* CONTENT CONTAINER */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-10">
          
          {/* SECTION 1: OVERVIEW & ZERO-TRUST MODEL */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-[#011B51]">
              <Lock className="w-5 h-5 text-[#011B51]" />
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight">
                1. Zero-Trust Security Architecture
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              UA LabSign operates on a Zero-Trust security model. Every attendance submission is treated as untrusted until mathematically verified through hardware-bound cryptographic signatures, institutional identity checks, time-sensitive room PINs, and physical geofence validation.
            </p>
          </section>

          <hr className="border-slate-100" />

          {/* SECTION 2: ASYMMETRIC CRYPTOGRAPHY */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5 text-[#011B51]">
              <Key className="w-5 h-5 text-[#011B51]" />
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight">
                2. Device-Bound ECDSA P-256 Cryptography
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              To guarantee non-repudiation and eliminate proxy check-ins, UA LabSign leverages Elliptic Curve Cryptography (ECC) generated directly on student hardware:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="text-xs font-bold text-[#011B51] uppercase tracking-wider block">
                  Web Crypto API Key Generation
                </span>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Private keys are generated locally using Web Crypto API or hardware-backed keystores. They are non-exportable and remain strictly isolated inside the student device.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="text-xs font-bold text-[#011B51] uppercase tracking-wider block">
                  Digital Payload Verification
                </span>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Attendance submissions contain a SHA-256 hashed signature combining Student ID, room location, and server timestamps, verified on the backend against the student public key.
                </p>
              </div>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* SECTION 3: DATABASE SECURITY & INJECTION PREVENTION */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5 text-[#011B51]">
              <Database className="w-5 h-5 text-[#011B51]" />
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight">
                3. Database Encryption & Query Parameterization
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              Institutional records and attendance ledgers are protected using enterprise-grade data persistence standards:
            </p>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs sm:text-sm text-slate-700 font-medium">
              <p className="leading-relaxed">
                <strong>Encrypted Database Storage:</strong> All persistence layers reside in a cloud-hosted PostgreSQL database enforcing TLS/SSL encrypted connections in transit and AES-256 encryption at rest.
              </p>
              <p className="leading-relaxed">
                <strong>SQL Injection Immunity:</strong> Database queries are executed strictly through an Object-Relational Mapping (ORM) layer utilizing automated query parameterization, completely neutralizing SQL Injection attacks.
              </p>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* SECTION 4: CREDENTIAL PROTECTION & ACCESS CONTROL */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5 text-[#011B51]">
              <Cpu className="w-5 h-5 text-[#011B51]" />
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight">
                4. Password Hashing & Role-Based Access Control (RBAC)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              Identity protection and administrative authorization strictly follow industry cryptographic recommendations:
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed list-disc list-inside pl-1">
              <li><strong>Bcrypt Key Derivation:</strong> All administrative passwords and student 6-digit Recovery PINs are stored as salted hashes using the Bcrypt algorithm (work factor 10). Plaintext credentials are never written to disk or logs.</li>
              <li><strong>Google SSO Token Validation:</strong> Student authentication requires verifying OAuth 2.0 ID tokens generated by Google Identity Services, restricted to official domain accounts (@ua.edu.ph).</li>
              <li><strong>Role-Based Access Control (RBAC):</strong> Administrative endpoints, audit logs, and teacher session controls are protected via HTTP-only server session cookies and middleware access checks.</li>
            </ul>
          </section>

          <hr className="border-slate-100" />

          {/* SECTION 5: NETWORK RATE LIMITING & AUDITING */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5 text-[#011B51]">
              <Server className="w-5 h-5 text-[#011B51]" />
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight">
                5. Rate Limiting & System Audit Trails
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              To defend against brute-force attacks and maintain system accountability, UA LabSign implements automated perimeter defenses:
            </p>
            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 space-y-2 text-xs sm:text-sm text-slate-700 font-medium">
              <p className="leading-relaxed">
                <strong>API Rate Limiting:</strong> High-frequency authentication requests, PIN validations, and check-in endpoints are rate-limited via sliding window memory counters to prevent automated denial of service or credential stuffing.
              </p>
              <p className="leading-relaxed">
                <strong>Immutable Audit Logging:</strong> Administrative changes (such as schedule creation, room PIN generations, and manual attendance overrides) record permanent log entries containing timestamp, actor ID, and IP metadata.
              </p>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* SECTION 6: COMPLIANCE SUMMARY */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-[#011B51]">
              <CheckCircle2 className="w-5 h-5 text-[#011B51]" />
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight">
                6. Security Safeguards Summary
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              By combining device-bound Web Crypto digital signatures, temporary 4-digit room PINs, instant 65-meter geofence checks, and salted Bcrypt hashing, UA LabSign ensures a tamper-resistant environment for the University of Assumption computer laboratory network.
            </p>
          </section>

          <hr className="border-slate-100" />

          {/* SECTION 7: CONTACT INFORMATION */}
          <section className="space-y-3 bg-slate-50 p-5 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-[#011B51]">
              <AlertCircle className="w-4 h-4 text-[#011B51]" />
              <h3 className="text-sm font-bold uppercase tracking-wider">
                Security Incident Reporting
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              If you discover a potential vulnerability or security concern within UA LabSign, please report it immediately to the Information Technology Department or the Laboratory Administrator at the University of Assumption, City of San Fernando, Pampanga.
            </p>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}