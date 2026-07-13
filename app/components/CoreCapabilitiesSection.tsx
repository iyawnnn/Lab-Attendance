"use client";

import React from "react";
import { ShieldCheck, Eye, MapPin, FileCheck } from "lucide-react";

interface Capability {
  title: string;
  category: string;
  description: string;
  icon: React.ElementType;
}

const capabilities: Capability[] = [
  {
    title: "Anti-Proxy Verification",
    category: "Security Protocol",
    description:
      "Binds attendance check-ins directly to authorized student device keys upon initial registration. This prevents absent peers from remotely logging in or faking class attendance on behalf of others.",
    icon: ShieldCheck,
  },
  {
    title: "Live Faculty Oversight",
    category: "Classroom Control",
    description:
      "Provides laboratory instructors with real-time verification dashboards during scheduled class hours. Replaces manual paper sign-in sheets while giving faculty instant visibility over room check-ins.",
    icon: Eye,
  },
  {
    title: "Instant Location Check",
    category: "Privacy & Location",
    description:
      "Validates physical presence by evaluating device GPS coordinates strictly at the instant of PIN submission. Continuous background tracking is never enabled, preserving student privacy outside check-in moments.",
    icon: MapPin,
  },
  {
    title: "Automated Audit Records",
    category: "Academic Compliance",
    description:
      "Generates structured, tamper-resistant attendance logs formatted for university grading records and departmental reviews. Ensures transparent documentation for course coordinators and academic chairs.",
    icon: FileCheck,
  },
];

export default function CoreCapabilitiesSection() {
  return (
    <section
      id="features"
      className="bg-white text-[#011B51] py-20 md:py-28 border-b border-gray-200/80"
    >
      <div className="max-w-7xl mx-auto px-6 space-y-12 md:space-y-16">
        
        {/* Section Header */}
        <div className="grid lg:grid-cols-12 gap-8 items-start text-left">
          <div className="lg:col-span-4">
            <span className="text-xs font-black text-[#A51A21] uppercase tracking-widest block border-l-2 border-[#A51A21] pl-3">
              Institutional Governance
            </span>
          </div>
          <div className="lg:col-span-8 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#011B51] tracking-tight leading-snug">
              System Governance &amp; Safeguards
            </h2>
            <p className="text-base sm:text-lg font-semibold text-gray-700 leading-relaxed max-w-3xl">
              Essential safeguards engineered to maintain physical classroom integrity and streamline departmental reporting across all university computer laboratories.
            </p>
          </div>
        </div>

        {/* Editorial Row List with Enhanced Typography */}
        <div className="divide-y divide-gray-200 border-t border-b border-gray-200 text-left">
          {capabilities.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="py-8 sm:py-10 grid md:grid-cols-12 gap-6 items-start hover:bg-slate-50/60 transition-colors px-3 rounded-lg"
              >
                <div className="md:col-span-5 space-y-1.5">
                  <span className="text-[11px] font-extrabold text-[#A51A21] uppercase tracking-widest block">
                    {item.category}
                  </span>
                  <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5 text-[#011B51] shrink-0 stroke-[2]" />
                    <h3 className="text-lg sm:text-xl font-extrabold text-[#011B51] tracking-tight">
                      {item.title}
                    </h3>
                  </div>
                </div>

                <div className="md:col-span-7">
                  <p className="text-sm sm:text-base text-gray-700 font-medium leading-relaxed max-w-2xl">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}