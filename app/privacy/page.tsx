export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 font-sans p-6 md:p-12 max-w-4xl mx-auto">
      <h1 className="text-3xl font-extrabold text-[#011B51] mb-2">
        Privacy Policy
      </h1>
      <p className="text-sm text-slate-500 mb-8">
        Last Updated: July 2026
      </p>

      <div className="space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-[#011B51] mb-2">
            1. Overview
          </h2>
          <p>
            UA Laboratory Attendance is an official attendance mapping system designed for university laboratory environments. This Privacy Policy explains how our mobile application and web portal collect, process, and protect your information.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#011B51] mb-2">
            2. Data We Collect
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Student Identity Data:</strong> Student ID number, First Name, and Last Name.</li>
            <li><strong>Device Security Data:</strong> Hardware-generated Elliptic Curve Cryptography (ECC) public key stored for single-device verification.</li>
            <li><strong>Location Data:</strong> Fine and coarse GPS location data processed strictly during check-in to verify laboratory room proximity.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#011B51] mb-2">
            3. How We Use Location Data
          </h2>
          <p>
            Location coordinates are accessed exclusively while actively logging attendance to confirm physical presence inside designated university laboratory facilities. Location data is never tracked in the background, stored long-term, or shared with third parties.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#011B51] mb-2">
            4. Data Security
          </h2>
          <p>
            Private cryptographic keys are generated locally and stored securely on your device using hardware-backed storage (SecureStore). Private keys are never transmitted to any remote server.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#011B51] mb-2">
            5. Contact Information
          </h2>
          <p>
            For questions regarding this privacy policy or account management, please contact your university department administrator.
          </p>
        </section>
      </div>
    </main>
  );
}