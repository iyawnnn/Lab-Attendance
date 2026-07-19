"use client";

import React from "react";
import Link from "next/link";
import { MapPin, Mail, Globe, ArrowUpRight } from "lucide-react";
import { FaFacebook } from "react-icons/fa6";

interface FooterProps {
  onNavigateSection?: (sectionId: string) => void;
}

export default function Footer({ onNavigateSection }: FooterProps) {
  const handleNavClick = (sectionId: string) => {
    if (onNavigateSection) {
      onNavigateSection(sectionId);
    } else if (typeof window !== "undefined") {
      window.location.href = `/#${sectionId}`;
    }
  };

  return (
    <footer className="bg-[#011B51] text-white pt-12 pb-8 border-t border-white/10 relative overflow-hidden font-sans">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Tier 1: Top Brand & Partnership Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-white/10 mb-6 gap-6">
          
          {/* Left Side: Core Institutional Branding */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-white p-1.5 flex items-center justify-center shadow-md shrink-0">
              <img 
                src="/ua-logo.png" 
                alt="University of the Assumption Official Seal" 
                className="w-full h-full object-contain" 
              />
            </div>
            <div className="leading-tight">
              <span className="text-base font-extrabold tracking-tight block text-white">
                University of the Assumption
              </span>
              <span className="text-[10px] font-bold text-[#FED702] uppercase tracking-widest block">
                UA LabSign System
              </span>
            </div>
          </div>
          
          {/* Right Side: Structural flow for CIT Branding */}
          <a 
            href="https://ua-cit.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center space-x-3 group text-left transition-opacity hover:opacity-95"
          >
            <div className="w-10 h-10 rounded-full bg-white p-1.5 flex items-center justify-center shadow-md shrink-0 transition-transform group-hover:scale-105 active:scale-95">
              <img 
                src="/cit_logo.png" 
                alt="UA College of Information Technology Logo" 
                className="w-full h-full object-contain" 
              />
            </div>
            <div className="leading-tight">
              <span className="text-[10px] font-bold text-[#FED702] uppercase tracking-widest block mb-0.5">
                Presented By
              </span>
              <span className="text-base font-extrabold tracking-tight text-white group-hover:text-[#FED702] transition-colors flex items-center gap-1">
                College of Information Technology
                <ArrowUpRight className="w-3.5 h-3.5 text-white/40 group-hover:text-[#FED702] transition-colors shrink-0" />
              </span>
            </div>
          </a>
        </div>

        {/* 🟢 Tier 2: Updated to 5-column grid layout to squeeze out empty layout gaps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 mb-8 text-left items-start">
          
          {/* 🟢 Column 1: Core System Architecture Overview (Set to col-span-2 for text breathing room) */}
          <div className="space-y-3 md:col-span-2">
            <h3 className="font-extrabold text-[#FED702] text-xs uppercase tracking-widest">
              System Overview
            </h3>
            <p className="text-white/70 font-medium text-xs leading-relaxed max-w-sm">
              A Zero-Trust cryptographic attendance ecosystem engineered to secure laboratory session integrity and prevent proxy check-ins across University of the Assumption facilities.
            </p>
          </div>

          {/* Column 2: Quick Application Navigation */}
          <div className="space-y-3 md:col-span-1">
            <h3 className="font-extrabold text-[#FED702] text-xs uppercase tracking-widest">
              Navigation
            </h3>
            <ul className="space-y-2.5 text-xs font-semibold text-white/80">
              <li>
                <Link href="/student" className="hover:text-[#FED702] transition-colors">
                  Student Portal
                </Link>
              </li>
              <li>
                <button 
                  type="button"
                  onClick={() => handleNavClick("features")} 
                  className="hover:text-[#FED702] transition-colors text-left cursor-pointer"
                >
                  System Features
                </button>
              </li>
              <li>
                <button 
                  type="button"
                  onClick={() => handleNavClick("how-it-works")} 
                  className="hover:text-[#FED702] transition-colors text-left cursor-pointer"
                >
                  Verification Protocol
                </button>
              </li>
              <li>
                <button 
                  type="button"
                  onClick={() => handleNavClick("mobile")} 
                  className="hover:text-[#FED702] transition-colors text-left cursor-pointer"
                >
                  Mobile Application
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal Governance & Protocols */}
          <div className="space-y-3 md:col-span-1">
            <h3 className="font-extrabold text-[#FED702] text-xs uppercase tracking-widest">
              Governance &amp; Security
            </h3>
            <ul className="space-y-2.5 text-xs font-semibold text-white/80">
              <li>
                <Link href="/privacy" className="hover:text-[#FED702] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#FED702] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/security" className="hover:text-[#FED702] transition-colors">
                  Data Security Standards
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Official Communication Channels */}
          <div className="space-y-3 md:col-span-1">
            <h3 className="font-extrabold text-[#FED702] text-xs uppercase tracking-widest">
              Official Channels
            </h3>
            <ul className="space-y-2.5 text-xs font-semibold text-white/80">
              <li className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-[#FED702] flex-shrink-0 mt-0.5" />
                <span>City of San Fernando, Pampanga, Philippines</span>
              </li>
              <li>
                <a 
                  href="mailto:iero@ua.edu.ph" 
                  className="flex items-center space-x-2 hover:text-[#FED702] transition-colors"
                >
                  <Mail className="w-4 h-4 text-[#FED702] flex-shrink-0" />
                  <span>iero@ua.edu.ph</span>
                </a>
              </li>
              <li>
                <a 
                  href="https://web.ua.edu.ph/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center space-x-2 hover:text-[#FED702] transition-colors group"
                >
                  <Globe className="w-4 h-4 text-[#FED702] flex-shrink-0" />
                  <span>web.ua.edu.ph</span>
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
              <li>
                <a 
                  href="https://www.facebook.com/universityoftheassumption" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center space-x-2 hover:text-[#FED702] transition-colors group"
                >
                  <FaFacebook className="w-4 h-4 text-[#FED702] flex-shrink-0" />
                  <span>Facebook Page</span>
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Tier 3: Sub-Footer Copyright & Developer Panel Attribution */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-start text-xs font-semibold text-white/50 gap-4">
          <p className="pt-0.5">&copy; {new Date().getFullYear()} University of the Assumption. All rights reserved.</p>
          
          <div className="text-left sm:text-right">
            <p className="text-white/80 font-bold tracking-wider">
              Developed by <span className="text-[#FED702]">Team GACHODA</span>
            </p>
            <p className="text-[10px] text-white/40 font-medium tracking-wide mt-0.5 normal-case">
              Garcia, Ochoa, Pineda
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}