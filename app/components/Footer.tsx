"use client";

import React from "react";
import Link from "next/link";
import { MapPin, Mail, Globe, ArrowUpRight } from "lucide-react";
import { FaFacebook } from "react-icons/fa6";

interface FooterProps {
  onNavigateSection?: (sectionId: string) => void;
}

export default function Footer({ onNavigateSection }: FooterProps) {
  return (
    <footer className="bg-school-blue text-white pt-16 pb-10 border-t border-white/10 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-12 mb-16 text-left">
          
          {/* Brand & Institution Info */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-white p-1.5 flex items-center justify-center shadow-md">
                <img 
                  src="/ua-logo.png" 
                  alt="University of Assumption Seal Logo" 
                  className="w-full h-full object-contain" 
                />
              </div>
              <div className="leading-tight">
                <span className="text-base font-extrabold tracking-tight block text-white">
                  University of Assumption
                </span>
                <span className="text-[10px] font-bold text-school-yellow uppercase tracking-widest block">
                  Laboratory Attendance System
                </span>
              </div>
            </div>
            <p className="text-white/70 font-semibold text-xs leading-relaxed">
              Official hardware-bound attendance verification portal for University of Assumption computer laboratory facilities.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-school-yellow text-xs uppercase tracking-widest">
              Navigation
            </h3>
            <ul className="space-y-3 text-xs font-semibold text-white/80">
              <li>
                <Link href="/student" className="hover:text-school-yellow transition-colors">
                  Student Portal
                </Link>
              </li>
              {onNavigateSection && (
                <>
                  <li>
                    <button 
                      onClick={() => onNavigateSection("features")} 
                      className="hover:text-school-yellow transition-colors text-left cursor-pointer"
                    >
                      System Features
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => onNavigateSection("how-it-works")} 
                      className="hover:text-school-yellow transition-colors text-left cursor-pointer"
                    >
                      Verification Protocol
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => onNavigateSection("mobile")} 
                      className="hover:text-school-yellow transition-colors text-left cursor-pointer"
                    >
                      Mobile Application
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Legal Pages */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-school-yellow text-xs uppercase tracking-widest">
              Governance &amp; Privacy
            </h3>
            <ul className="space-y-3 text-xs font-semibold text-white/80">
              <li>
                <Link href="/privacy" className="hover:text-school-yellow transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-school-yellow transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-school-yellow transition-colors">
                  Data Security Standards
                </Link>
              </li>
            </ul>
          </div>

          {/* Official Contact & Socials */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-school-yellow text-xs uppercase tracking-widest">
              Official Channels
            </h3>
            <ul className="space-y-3 text-xs font-semibold text-white/80">
              <li className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-school-yellow flex-shrink-0" />
                <span>City of San Fernando, Pampanga, Philippines</span>
              </li>
              <li>
                <a 
                  href="mailto:iero@ua.edu.ph" 
                  className="flex items-center space-x-2 hover:text-school-yellow transition-colors"
                >
                  <Mail className="w-4 h-4 text-school-yellow flex-shrink-0" />
                  <span>iero@ua.edu.ph</span>
                </a>
              </li>
              <li>
                <a 
                  href="https://web.ua.edu.ph/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center space-x-2 hover:text-school-yellow transition-colors group"
                >
                  <Globe className="w-4 h-4 text-school-yellow flex-shrink-0" />
                  <span>web.ua.edu.ph</span>
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
              <li>
                <a 
                  href="https://www.facebook.com/universityoftheassumption" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center space-x-2 hover:text-school-yellow transition-colors group"
                >
                  <FaFacebook className="w-4 h-4 text-school-yellow flex-shrink-0" />
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
          <p className="mt-2 sm:mt-0">Built for Computer Laboratory Facilities</p>
        </div>
      </div>
    </footer>
  );
}