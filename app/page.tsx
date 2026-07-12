// app/page.tsx

import Link from "next/link";
import { FaUserGraduate } from "react-icons/fa";

export default function LandingPage() {
  return (
    <main className="relative min-h-[100dvh] w-full flex items-center justify-center p-4 sm:p-6 font-sans overflow-x-hidden border-t-[8px] sm:border-t-[14px] border-b-[8px] sm:border-b-[14px] border-[#011B51]">
      <div className="absolute inset-0 z-0">
        <img
          src="/lab-background.jpg"
          alt="University Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      <div className="relative z-10 w-full max-w-2xl bg-white/30 backdrop-blur-2xl border border-white/20 rounded-[1.5rem] sm:rounded-[2.5rem] px-6 py-12 sm:px-14 sm:py-16 text-center shadow-2xl my-10 sm:mt-[-3vh]">
        <div className="absolute -top-10 sm:-top-16 left-1/2 transform -translate-x-1/2">
          <img
            src="/ua-logo.png"
            alt="UA Logo"
            className="w-20 h-20 sm:w-28 sm:h-28 object-contain drop-shadow-xl"
          />
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#FFFFFF] tracking-tight mb-2 mt-4 sm:mt-3 drop-shadow-xl">
          UA Laboratory Attendance
        </h1>
        <p className="text-[#F7F7F7]/90 font-medium text-xs sm:text-base mb-8 sm:mb-10 mt-2 drop-shadow-sm">
          University of the Assumption Cryptographic Attendance Tracking System.
        </p>

        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent mb-8 sm:mb-10" />

        <Link
          href="/student"
          className="group flex flex-col items-center justify-center p-6 sm:p-8 bg-[#011B51] hover:bg-[#022a7a] text-white rounded-xl sm:rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl border-b-[6px] border-b-[#A51A21] w-full max-w-md mx-auto"
        >
          <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-full bg-white/20 mb-4 transition-colors">
            <FaUserGraduate className="w-6 h-6 sm:w-7 sm:h-7 text-[#FED702]" />
          </div>
          <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight mb-1">
            Student Portal
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 font-medium text-center">
            Register your device or log laboratory attendance session
          </p>
        </Link>
      </div>
    </main>
  );
}