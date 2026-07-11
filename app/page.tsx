import Link from "next/link";
import { FaUserGraduate, FaUserShield, FaChalkboardTeacher } from "react-icons/fa";

export default function LandingPage() {
  return (
    
    <main className="relative min-h-[100dvh] w-full flex items-center justify-center p-4 sm:p-6 font-sans overflow-x-hidden border-t-[8px] sm:border-t-[14px] border-b-[8px] sm:border-b-[14px] border-[#011B51]">

      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="/lab-background.jpg"
          alt="University Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* Main Frosted Glass Container */}
      <div className="relative z-10 w-full max-w-5xl bg-white/30 backdrop-blur-2xl border border-white/20 rounded-[1.5rem] sm:rounded-[2.5rem] px-5 py-10 sm:px-12 sm:py-16 text-center shadow-2xl my-10 sm:mt-[-3vh]">

        {/* Overlapping Top Logo */}
        <div className="absolute -top-10 sm:-top-16 left-1/2 transform -translate-x-1/2">
          <img
            src="/ua-logo.png"
            alt="UA Logo"
            className="w-20 h-20 sm:w-30 sm:h-30 object-contain drop-shadow-xl"
          />
        </div>

        {/* Header Text */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#FFFFFF] tracking-tight mb-1 mt-4 sm:mt-3 drop-shadow-xl">
          UA Laboratory Attendance
        </h1>
        <p className="text-[#F7F7F7]/90 font-medium text-xs sm:text-base mb-6 sm:mb-8 mt-3 sm:mt-5 drop-shadow-sm">
          Secure identity verification and attendance tracking.
        </p>

        {/* Visual Separator Line */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent mb-8 sm:mb-10" />

        {/* CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 w-full mx-auto">

          {/* STUDENT PORTAL CARD */}
          <Link
            href="/student"
            className="group flex flex-col items-start justify-center p-5 sm:p-7 bg-[#011B51] text-white rounded-xl sm:rounded-2xl transition-all duration-300 shadow-lg hover:shadow-2xl sm:hover:-translate-y-1 border-b-[6px] border-b-[#00133b]"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full bg-white/30 mb-3 transition-colors">
              <FaUserGraduate className="w-4 h-4 sm:w-5 sm:h-5 text-[#fdfdfd]" />
            </div>
            <h2 className="text-base sm:text-lg font-bold mb-0.5">Student Portal</h2>
            <p className="text-[10px] sm:text-xs text-gray-400 text-left">Register device or log attendance</p>
          </Link>

          {/* FACULTY ACCESS CARD */}
          <Link
            href="/teacher"
            className="group flex flex-col items-start justify-center p-5 sm:p-7 bg-[#e5e7eb] text-[#011B51] rounded-xl sm:rounded-2xl transition-all duration-300 shadow-lg hover:shadow-2xl sm:hover:-translate-y-1 border-b-[6px] border-b-[#FED702]"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full bg-white mb-3 shadow-sm">
              <FaChalkboardTeacher className="w-4 h-4 sm:w-5 sm:h-5 text-[#011B51]" />
            </div>
            <h2 className="text-base sm:text-lg font-bold mb-0.5">Faculty Access</h2>
            <p className="text-[10px] sm:text-xs text-gray-600 text-left">Manage sessions & verify logs</p>
          </Link>

          {/* SYSTEM ADMIN CARD */}
          <Link
            href="/admin"
            className="group flex flex-col items-start justify-center p-5 sm:p-7 bg-[#e5e7eb] text-[#011B51] rounded-xl sm:rounded-2xl transition-all duration-300 shadow-lg hover:shadow-2xl sm:hover:-translate-y-1 border-b-[6px] border-b-[#A51A21]"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full bg-white mb-3 shadow-sm">
              <FaUserShield className="w-5 h-5 sm:w-6 sm:h-6 text-[#011B51]" />
            </div>
            <h2 className="text-base sm:text-lg font-bold mb-0.5">System Admin</h2>
            <p className="text-[10px] sm:text-xs text-gray-600 text-left">Manage database and staff</p>
          </Link>

        </div>
      </div>
    </main>
  );
}