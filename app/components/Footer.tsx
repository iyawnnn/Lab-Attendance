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
    <footer className="bg-[#011B51] text-white pt-16 pb-10 border-t border-white/10 relative overflow-hidden font-sans">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-12 mb-16 text-left">
          
          {/* Brand & Institution Info */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-white p-1.5 flex items-center justify-center shadow-md shrink-0">
                <img 
                  src="/ua-logo.png" 
                  alt="University of Assumption Official Seal" 
                  className="w-full h-full object-contain" 
                />
              </div>
              <div className="leading-tight">
                <span className="text-base font-extrabold tracking-tight block text-white">
                  University of Assumption
                </span>
                <span className="text-[10px] font-bold text-[#FED702] uppercase tracking-widest block">
                  UA LabSign System
                </span>
              </div>
            </div>
            <p className="text-white/70 font-medium text-xs leading-relaxed">
              A Zero-Trust cryptographic attendance ecosystem engineered to secure laboratory session integrity and prevent proxy check-ins across University of Assumption facilities.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-[#FED702] text-xs uppercase tracking-widest">
              Navigation
            </h3>
            <ul className="space-y-3 text-xs font-semibold text-white/80">
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

          {/* Legal Pages */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-[#FED702] text-xs uppercase tracking-widest">
              Governance &amp; Security
            </h3>
            <ul className="space-y-3 text-xs font-semibold text-white/80">
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

          {/* Official Contact & Socials */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-[#FED702] text-xs uppercase tracking-widest">
              Official Channels
            </h3>
            <ul className="space-y-3 text-xs font-semibold text-white/80">
              <li className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-[#FED702] flex-shrink-0" />
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

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center text-xs font-semibold text-white/50">
          <p>&copy; {new Date().getFullYear()} University of Assumption. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Developed by BSIT Students of University of Assumption</p>
        </div>
      </div>
    </footer>
  );
}