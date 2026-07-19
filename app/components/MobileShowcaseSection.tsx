"use client";

import React from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { FaAndroid } from "react-icons/fa6";

interface MobileShowcaseSectionProps {
  screenshotPath?: string;
}

export default function MobileShowcaseSection({
  screenshotPath = "/mobile-app-screenshot.png",
}: MobileShowcaseSectionProps) {
  return (
    <section
      id="mobile"
      className="bg-slate-50/70 text-[#011B51] py-16 sm:py-20 md:py-28 border-b border-gray-200/80 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Main Card Container */}
        <div className="relative rounded-3xl p-6 sm:p-10 lg:p-14 xl:p-16 text-white overflow-hidden shadow-2xl bg-gradient-to-br from-[#011B51] via-[#022870] to-[#001035] border border-white/10">
          
          {/* Subtle Dot Matrix Grid Texture */}
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

          {/* Deep Navy and Maroon Ambient Flares */}
          <div className="absolute -right-24 -bottom-24 w-[350px] sm:w-[450px] h-[350px] sm:h-[450px] bg-[#A51A21]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-24 -top-24 w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] bg-[#022870]/40 rounded-full blur-3xl pointer-events-none" />

          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 xl:gap-12 items-center relative z-10">
            
            {/* Left Column: Narrative Copy */}
            <div className="lg:col-span-6 text-left space-y-5 sm:space-y-6">
              <span className="text-xs font-black text-[#FED702] uppercase tracking-widest block">
                Mobile Attendance Access
              </span>

              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                Take Attendance Anywhere
              </h2>

              <p className="text-xs sm:text-base font-semibold text-white/85 leading-relaxed max-w-xl">
                The official University of the Assumption mobile application allows students to securely record attendance through room PIN authorization and low-latency location checks directly on Android devices.
              </p>

              {/* Action Badges */}
              <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block transition-transform hover:-translate-y-0.5 shrink-0"
                >
                  <img
                    alt="Get it on Google Play badge for University of the Assumption Mobile App"
                    src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
                    className="h-12 sm:h-16 w-auto object-contain"
                  />
                </a>

                <span className="inline-flex items-center gap-2 text-[10px] sm:text-[11px] font-extrabold text-white uppercase tracking-wider bg-white/10 px-3.5 sm:px-4 py-3 sm:py-3.5 rounded-xl border border-white/15 backdrop-blur-md">
                  <FaAndroid className="w-4 h-4 text-[#FED702]" />
                  <span>Official Android App</span>
                </span>
              </div>
            </div>

            {/* Right Column: Mobile Device Display Frame */}
            <div className="lg:col-span-6 flex justify-center items-center py-6 lg:py-0">
              
              {/* Outer Wrapper with reserved desktop padding to accommodate badge offset clearance */}
              <div className="relative my-4 sm:my-6 lg:px-12">
                
                {/* Phone Frame */}
                <div className="relative w-[230px] xs:w-[260px] sm:w-[280px] lg:w-[290px] h-[470px] xs:h-[530px] sm:h-[560px] lg:h-[580px] bg-black border-[8px] sm:border-[10px] border-gray-900 rounded-[2.4rem] sm:rounded-[2.8rem] shadow-2xl overflow-hidden flex flex-col z-10">
                  
                  {/* Camera Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 sm:w-28 h-3.5 sm:h-4 bg-gray-900 rounded-b-xl z-30" />

                  {/* Viewport Area */}
                  <div className="w-full h-full bg-[#011B51] overflow-hidden relative">
                    {screenshotPath ? (
                      <img
                        src={screenshotPath}
                        alt="University of the Assumption Mobile Attendance Portal Interface"
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-full bg-white text-[#011B51] p-4 pt-8 flex flex-col justify-between text-left text-xs font-semibold">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2 pt-2">
                            <img
                              src="/ua-logo.png"
                              alt="University of the Assumption Seal"
                              width="24"
                              height="24"
                              className="w-6 h-6 object-contain"
                            />
                            <div>
                              <p className="text-[9px] font-black uppercase text-[#011B51]">Student Portal</p>
                              <p className="text-[8px] font-bold text-gray-500 uppercase">UA Mobile App</p>
                            </div>
                          </div>

                          <div className="bg-slate-100 p-2.5 rounded-lg space-y-1 text-[10px]">
                            <p className="text-gray-500 font-bold uppercase text-[8px]">Student ID</p>
                            <p className="font-extrabold text-[#011B51]">2023001839</p>
                          </div>

                          <div className="bg-slate-50 border border-gray-200 p-2.5 rounded-lg space-y-2 text-[10px]">
                            <p className="text-gray-500 font-bold uppercase text-[8px]">Selected Facility</p>
                            <p className="font-extrabold text-[#011B51]">Lab Room 402</p>
                          </div>

                          <div className="bg-slate-50 border border-gray-200 p-2.5 rounded-lg text-center font-mono font-extrabold text-sm tracking-widest text-[#011B51]">
                            ****
                          </div>
                        </div>

                        <div className="bg-[#011B51] text-[#FED702] py-3 rounded-lg text-center text-[10px] font-extrabold uppercase tracking-wider">
                          Submit Attendance
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Floating Status Badge 1 */}
                <div className="absolute top-6 -right-3 xs:-right-5 sm:top-10 sm:-right-8 lg:-right-20 xl:-right-24 bg-white text-[#011B51] p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl shadow-2xl border border-gray-100 flex items-center space-x-2.5 sm:space-x-3 z-20 pointer-events-none max-w-[140px] xs:max-w-[160px] sm:max-w-none">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-emerald-50 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-emerald-600 stroke-[2.5]" />
                  </div>
                  <div className="text-left leading-tight">
                    <p className="text-[9px] sm:text-[11px] font-extrabold text-[#011B51]">GPS Verified</p>
                    <p className="text-[7.5px] sm:text-[9px] text-gray-500 font-semibold">Inside Room Radius</p>
                  </div>
                </div>

                {/* Floating Status Badge 2 */}
                <div className="absolute bottom-6 -left-3 xs:-left-5 sm:bottom-10 sm:-left-8 lg:-left-20 xl:-left-24 bg-white text-[#011B51] p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl shadow-2xl border border-gray-100 flex items-center space-x-2.5 sm:space-x-3 z-20 pointer-events-none max-w-[140px] xs:max-w-[160px] sm:max-w-none">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-[#A51A21] stroke-[2.5]" />
                  </div>
                  <div className="text-left leading-tight">
                    <p className="text-[9px] sm:text-[11px] font-extrabold text-[#011B51]">Key Bound</p>
                    <p className="text-[7.5px] sm:text-[9px] text-gray-500 font-semibold">Device Signature Secured</p>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}