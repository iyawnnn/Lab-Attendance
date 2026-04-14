import Link from "next/link";
import Image from "next/image";
import { FaUserGraduate, FaUserShield, FaChalkboardTeacher } from "react-icons/fa";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen w-full flex items-center justify-center p-6 font-sans overflow-hidden">
      
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/lab-background.jpg" 
          alt="University Background" 
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      {/* Main Frosted Glass Container */}
      <div className="relative z-10 w-full max-w-5xl bg-white/20 backdrop-blur-xl border border-white/30 rounded-[2.5rem] px-6 pb-10 pt-16 sm:px-12 sm:pb-14 sm:pt-20 text-center shadow-2xl mt-[-5vh]">
        
        {/* Overlapping Top Logo */}
        <div className="absolute -top-12 sm:-top-16 left-1/2 transform -translate-x-1/2">
          <div className="relative w-24 h-24 sm:w-32 sm:h-32">
            <Image 
              src="/ua-logo.png" 
              alt="University of Assumption Logo" 
              fill
              className="object-contain drop-shadow-2xl" 
            />
          </div>
        </div>

        {/* Header Text */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mb-2 drop-shadow-xl">
          University of Assumption <br className="hidden sm:block" /> Laboratory System
        </h1>
        <p className="text-gray-100 font-medium text-sm sm:text-base mb-8 mt-4 sm:mb-12 drop-shadow-sm">
          Secure identity verification and attendance tracking.
        </p>

        {/* CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mx-auto">

          {/* STUDENT PORTAL CARD */}
          <Link
            href="/student"
            className="group flex flex-col items-start justify-center p-6 bg-[#011B51] text-white rounded-2xl transition-all duration-300 shadow-lg hover:shadow-2xl hover:-translate-y-2 border-b-[6px] border-[#FED702]"
          >
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 mb-4 transition-transform duration-300 group-hover:scale-110">
              <FaUserGraduate className="w-6 h-6 text-[#FED702]" />
            </div>

            <h2 className="text-xl font-bold mb-1">
              Student Portal
            </h2>
            <p className="text-sm text-gray-300 text-left">
              Register device or log attendance securely
            </p>
          </Link>

          {/* TEACHER PORTAL CARD */}
          <Link
            href="/teacher"
            className="group flex flex-col items-start justify-center p-6 bg-white text-[#011B51] rounded-2xl transition-all duration-300 shadow-lg hover:shadow-2xl hover:-translate-y-2 border-b-[6px] border-[#011B51]"
          >
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-100 mb-4 shadow-sm transition-transform duration-300 group-hover:scale-110">
              <FaChalkboardTeacher className="w-6 h-6 text-[#011B51]" />
            </div>

            <h2 className="text-xl font-bold mb-1">
              Faculty Access
            </h2>
            <p className="text-sm text-slate-500 text-left">
              Manage sessions & verify student logs
            </p>
          </Link>

          {/* ADMIN ACCESS CARD */}
          <Link
            href="/admin"
            className="group flex flex-col items-start justify-center p-6 bg-gray-100 text-[#011B51] rounded-2xl transition-all duration-300 shadow-lg hover:shadow-2xl hover:-translate-y-2 border-b-[6px] border-[#A51A21]"
          >
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-white mb-4 shadow-sm transition-transform duration-300 group-hover:scale-110">
              <FaUserShield className="w-6 h-6 text-[#A51A21]" />
            </div>

            <h2 className="text-xl font-bold mb-1">
              System Admin
            </h2>
            <p className="text-sm text-gray-600 text-left">
              Manage database and system staff
            </p>
          </Link>

        </div>
      </div>
      
    </main>
  );
}