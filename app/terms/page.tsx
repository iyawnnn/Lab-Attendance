import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { 
  FileText, 
  ShieldAlert, 
  Smartphone, 
  MapPin, 
  UserX, 
  Scale, 
  AlertCircle,
  CheckCircle2,
  Database
} from "lucide-react";

export const metadata = {
  title: "Terms of Service",
  description: "Official Terms of Service detailing system usage rules, academic integrity policies, and user responsibilities for UA LabSign - University of Assumption.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800">
      <Header forceSolid />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-14">
        
        {/* HERO BANNER */}
        <div className="bg-[#011B51] rounded-2xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden mb-10 border-b-4 border-[#A51A21]">
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-[#FED702] text-xs font-bold uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4" />
              <span>Institutional Governance & Acceptable Use</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight uppercase">
              Terms of <span className="text-[#FED702]">Service</span>
            </h1>
            <p className="text-slate-200 text-xs sm:text-sm max-w-2xl font-medium leading-relaxed">
              UA LabSign: Zero-Trust Laboratory Attendance Tracking System | University of Assumption
            </p>
          </div>
        </div>

        {/* CONTENT CONTAINER */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-10">
          
          {/* SECTION 1: ACCEPTANCE OF TERMS */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-[#011B51]">
              <FileText className="w-5 h-5 text-[#011B51]" />
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight">
                1. Acceptance of Terms & Institutional Scope
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              By logging into, registering, or accessing UA LabSign through the web portal or companion mobile application, you agree to comply with these Terms of Service and all applicable academic guidelines established by the University of Assumption. Access is restricted exclusively to authorized students, faculty members, and system administrators possessing valid institutional credentials.
            </p>
          </section>

          <hr className="border-slate-100" />

          {/* SECTION 2: INSTITUTIONAL GOOGLE SSO & ACCOUNT CREATION */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5 text-[#011B51]">
              <CheckCircle2 className="w-5 h-5 text-[#011B51]" />
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight">
                2. Authentication & Student Onboarding
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              Users must authenticate using their official university Google account (@ua.edu.ph). When onboarding, students are required to provide their official Student ID number, verify their name, and create a 6-digit Recovery PIN.
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed list-disc list-inside pl-1">
              <li>Students must ensure their Student ID and account details match official university records.</li>
              <li>Students are solely responsible for maintaining the confidentiality of their 6-digit Recovery PIN.</li>
              <li>Sharing credentials or Recovery PINs with other individuals is strictly prohibited.</li>
            </ul>
          </section>

          <hr className="border-slate-100" />

          {/* SECTION 3: DEVICE BINDING & ANTI-PROXY RULES */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5 text-[#011B51]">
              <Smartphone className="w-5 h-5 text-[#011B51]" />
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight">
                3. Device Binding & Cryptographic Non-Repudiation
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              UA LabSign uses Elliptic Curve Cryptography (ECDSA P-256) to bind each student account to a single hardware device. The system enforces strict anti-proxy attendance rules:
            </p>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs sm:text-sm text-slate-700 font-medium">
              <p className="leading-relaxed">
                <strong>Single Active Terminal:</strong> An account may only be bound to one active web or mobile hardware terminal at a time.
              </p>
              <p className="leading-relaxed">
                <strong>Account Transfer:</strong> Logging in on a new device requires the 6-digit Recovery PIN and automatically invalidates the active security keys and session tokens on any previously authorized device.
              </p>
              <p className="leading-relaxed">
                <strong>Digital Signature Integrity:</strong> Every check-in submission generates a digital signature signed by the local private key stored on your device. Attempts to copy, export, or forge signatures are automatically detected and rejected.
              </p>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* SECTION 4: GEOFENCING & ROOM PIN RULES */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5 text-[#011B51]">
              <MapPin className="w-5 h-5 text-[#011B51]" />
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight">
                4. Location Verification & Check-In Requirements
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              To record attendance, students must fulfill both geographical and session verification steps:
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed list-disc list-inside pl-1">
              <li><strong>Physical Presence:</strong> Students must be physically located within the designated 65-meter geofence perimeter surrounding the assigned computer laboratory.</li>
              <li><strong>Room PIN Submission:</strong> Students must enter the active 4-digit session PIN generated by the laboratory instructor during class.</li>
              <li><strong>GPS Telemetry:</strong> Location permissions must be granted during submission. Location spoofing tools, virtual private networks (VPNs), or mock location applications will cause immediate submission failure.</li>
            </ul>
          </section>

          <hr className="border-slate-100" />

          {/* SECTION 5: DATA STORAGE & INFRASTRUCTURE GOVERNANCE */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5 text-[#011B51]">
              <Database className="w-5 h-5 text-[#011B51]" />
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight">
                5. Data Persistence & Infrastructure Security
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              Attendance records and institutional ledgers are stored inside an encrypted cloud-hosted PostgreSQL database using parameterized data access controls. Passwords and Recovery PINs are salted and hashed using Bcrypt encryption prior to storage, ensuring that credentials cannot be read in plaintext by database operators or unauthorized third parties.
            </p>
          </section>

          <hr className="border-slate-100" />

          {/* SECTION 6: PROHIBITED CONDUCT & ACADEMIC INTEGRITY */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5 text-[#011B51]">
              <UserX className="w-5 h-5 text-[#011B51]" />
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight">
                6. Prohibited Conduct & Disciplinary Action
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              Maintaining academic integrity is a fundamental requirement. The following actions constitute severe system violations:
            </p>
            <div className="p-4 rounded-xl bg-red-50/60 border border-red-100 space-y-2 text-xs sm:text-sm text-slate-700 font-medium">
              <ul className="space-y-1.5 list-disc list-inside">
                <li>Attempting to record attendance for another student (proxy attendance).</li>
                <li>Sharing device private keys, session tokens, or active room PINs outside the laboratory room.</li>
                <li>Utilizing software to falsify GPS location data or bypass geofence checks.</li>
                <li>Attempting to reverse engineer, disrupt, or execute denial of service attacks against UA LabSign infrastructure.</li>
              </ul>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium pt-1">
              Violations are recorded in immutable system audit logs and will be reported directly to university academic authorities for disciplinary evaluation under the University of Assumption Student Handbook.
            </p>
          </section>

          <hr className="border-slate-100" />

          {/* SECTION 7: SYSTEM AVAILABILITY & DISCLAIMERS */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-[#011B51]">
              <Scale className="w-5 h-5 text-[#011B51]" />
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight">
                7. Service Modifications & Liability Limitations
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              The University of Assumption reserves the right to modify system protocols, perform scheduled server maintenance, or adjust laboratory geofence parameters as needed. While UA LabSign strives for continuous operation, the university is not responsible for attendance check-in delays caused by personal hardware malfunctions, loss of cellular coverage, or unverified third-party device modifications.
            </p>
          </section>

          <hr className="border-slate-100" />

          {/* SECTION 8: CONTACT INFORMATION */}
          <section className="space-y-3 bg-slate-50 p-5 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-[#011B51]">
              <AlertCircle className="w-4 h-4 text-[#011B51]" />
              <h3 className="text-sm font-bold uppercase tracking-wider">
                Support & Inquiries
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              For questions regarding system terms, account transfers, or technical support, please consult your laboratory instructor or contact the College of Information Technology at the University of Assumption, City of San Fernando, Pampanga.
            </p>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}