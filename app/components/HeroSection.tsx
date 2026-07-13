"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Smartphone } from "lucide-react";

interface HeroSectionProps {
  onNavigateSection?: (sectionId: string) => void;
}

export default function HeroSection({ onNavigateSection }: HeroSectionProps) {
  return (
    <section className="relative w-full h-screen min-h-[640px] bg-[#011B51] text-white flex items-end overflow-hidden">
      
      {/* Edge-to-Edge Background Image Canvas */}
      <div className="absolute inset-0 z-0">
        <img
          src="/lab-background.jpg"
          alt="University of Assumption Campus"
          width="1920"
          height="1080"
          className="w-full h-full object-cover object-center"
        />
        {/* Softened Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#011B51] via-[#011B51]/50 to-black/20" />
      </div>

      {/* Content Layout Grid */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full pb-16 sm:pb-20 md:pb-24">
        <div className="grid lg:grid-cols-12 gap-8 items-end text-left">
          
          {/* Headline */}
          <div className="lg:col-span-7 space-y-3">
            <span className="text-[#FED702] font-black text-xs sm:text-sm uppercase tracking-widest block drop-shadow-xs">
              University of Assumption
            </span>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.10] tracking-tight drop-shadow-sm">
              Every Session Counts. <br className="hidden sm:inline" />
              <span className="text-[#FED702]">Every Second Verified.</span>
            </h1>
          </div>

          {/* Functional Explanation & Actions */}
          <div className="lg:col-span-5 space-y-5">
            <p className="text-sm sm:text-base font-semibold text-white/90 leading-relaxed drop-shadow-xs">
              Official campus platform for validating student laboratory check-ins through room PIN authorization and location boundaries.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/student"
                className="inline-flex items-center px-6 py-3.5 rounded-xl bg-[#FED702] text-[#011B51] font-extrabold text-xs uppercase tracking-wider hover:bg-white transition-all shadow-lg"
                aria-label="Access Student Attendance Portal"
              >
                <span>Student Portal</span>
                <ArrowRight className="ml-2 w-4 h-4 stroke-[2.5]" />
              </Link>

              <button
                type="button"
                onClick={() => onNavigateSection && onNavigateSection("mobile")}
                className="inline-flex items-center px-6 py-3.5 rounded-xl bg-black/30 backdrop-blur-md text-white border border-white/40 font-extrabold text-xs uppercase tracking-wider hover:bg-white/20 transition-all cursor-pointer"
              >
                <Smartphone className="mr-2 w-4 h-4" />
                Download Mobile App
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}