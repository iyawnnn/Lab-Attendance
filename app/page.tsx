import Link from "next/link";
import { FaUserGraduate, FaUserShield, FaChalkboardTeacher } from "react-icons/fa";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen w-full flex items-center justify-center p-6 font-sans overflow-hidden">
      
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/lab-background.jpg" 
          alt="University Background" 
          className="w-full h-full object-cover"
        />
        {/* Dark overlay to make the glass and text pop */}
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* Main Frosted Glass Container */}
      <div className="relative z-10 w-full max-w-5xl bg-white/30 backdrop-blur-xl border border-white/40 rounded-[2.5rem] px-6 pb-10 pt-16 sm:px-12 sm:pb-14 sm:pt-20 text-center shadow-2xl mt-[-5vh]">
        
        {/* Overlapping Top Logo */}
        <div className="absolute -top-12 sm:-top-16 left-1/2 transform -translate-x-1/2">
          <img 
            src="/ua-logo.png" 
            alt="UA Logo" 
            className="w-24 h-24 sm:w-32 sm:h-32 object-contain drop-shadow-xl" 
          />
        </div>

        {/* Header Text */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#FFFFFF] tracking-tight mb-2 drop-shadow-xl">
          UA Laboratory System
        </h1>
        <p className="text-[#F7F7F7]/90 font-small text-sm sm:text-base mb-8 mt-5 sm:mb-12 drop-shadow-sm">
          Secure identity verification and attendance tracking.
        </p>

        {/* CARDS GRID (Updated to 3 columns) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mx-auto">

          {/* STUDENT PORTAL CARD */}
          <Link
            href="/student"
            className="group flex flex-col items-start justify-center p-6 bg-[#011B51] text-white rounded-2xl transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1 border-b-[6px] border-[#FED702]"
          >
            {/* ICON */}
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 mb-3">
              <FaUserGraduate className="w-5 h-5" />
            </div>

            <h2 className="text-lg font-bold mb-1">
              Student Portal
            </h2>
            <p className="text-sm text-gray-200">
              Register device or log attendance
            </p>
          </Link>

          {/* TEACHER PORTAL CARD */}
          <Link
            href="/teacher"
            className="group flex flex-col items-start justify-center p-6 bg-white text-[#011B51] rounded-2xl transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1 border-b-[6px] border-[#011B51]"
          >
            {/* ICON */}
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 mb-3 shadow-sm">
              <FaChalkboardTeacher className="w-5 h-5 text-[#011B51]" />
            </div>

            <h2 className="text-lg font-bold mb-1">
              Faculty Access
            </h2>
            <p className="text-sm text-slate-500">
              Manage sessions & verify logs
            </p>
          </Link>

          {/* ADMIN ACCESS CARD */}
          <Link
            href="/admin"
            className="group flex flex-col items-start justify-center p-6 bg-gray-200 text-[#011B51] rounded-2xl transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1 border-b-[6px] border-[#A51A21]"
          >
            {/* ICON */}
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white mb-3 shadow-sm">
              <FaUserShield className="w-5 h-5 text-[#011B51]" />
            </div>

            <h2 className="text-lg font-bold mb-1">
              System Admin
            </h2>
            <p className="text-sm text-gray-600">
              Manage database and staff
            </p>
          </Link>

        </div>
      </div>
      
    </main>
  );
}