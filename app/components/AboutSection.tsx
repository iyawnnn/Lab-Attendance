"use client";

import React from "react";
import { MapPin, KeyRound, ShieldCheck } from "lucide-react";

export default function AboutSection() {
  return (
    <section id="about" className="bg-white text-[#011B51] py-20 md:py-28 border-b border-gray-200/80">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-start text-left">
          
          {/* Formal Section Identifier */}
          <div className="lg:col-span-4">
            <span className="text-xs font-black text-[#A51A21] uppercase tracking-widest block border-l-2 border-[#A51A21] pl-3">
              Academic Standard &amp; Operations
            </span>
          </div>

          {/* Institutional Statement & Core Verification Pillars */}
          <div className="lg:col-span-8 space-y-10">
            <div className="space-y-5">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-[#011B51] leading-snug tracking-tight">
                University of the Assumption is committed to academic excellence by modernizing classroom management and eliminating manual paper sign-in sheets.
              </h2>
              
              <p className="text-gray-700 text-base sm:text-lg font-medium leading-relaxed max-w-3xl">
                Our attendance system provides a structured, reliable method for faculty and students to verify presence during scheduled computer laboratory hours. By linking active sessions with room location parameters, the platform maintains clear records for academic reporting.
              </p>
            </div>

            {/* Verification Pillars */}
            <div className="grid sm:grid-cols-3 gap-8 pt-8 border-t border-gray-200">
              <div className="space-y-2">
                <div className="flex items-center text-[#A51A21] font-extrabold text-xs uppercase tracking-wider">
                  <MapPin className="w-4 h-4 mr-2 shrink-0 text-[#A51A21]" />
                  <span>Geofenced Boundary</span>
                </div>
                <p className="text-xs text-gray-600 font-semibold leading-relaxed">
                  Verifies presence within physical laboratory room limits.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center text-[#A51A21] font-extrabold text-xs uppercase tracking-wider">
                  <KeyRound className="w-4 h-4 mr-2 shrink-0 text-[#A51A21]" />
                  <span>Session Key</span>
                </div>
                <p className="text-xs text-gray-600 font-semibold leading-relaxed">
                  Requires a dynamic PIN generated per class hour.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center text-[#A51A21] font-extrabold text-xs uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 mr-2 shrink-0 text-[#A51A21]" />
                  <span>Single Registration</span>
                </div>
                <p className="text-xs text-gray-600 font-semibold leading-relaxed">
                  Binds attendance verification to an authorized device.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}