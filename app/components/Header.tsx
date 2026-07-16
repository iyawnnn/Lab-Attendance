"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";

interface HeaderProps {
  onNavigateSection?: (sectionId: string) => void;
  forceSolid?: boolean;
}

export default function Header({ onNavigateSection, forceSolid = false }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  /* Monitors window scroll depth to transition header background from transparent to solid white */
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (sectionId: string) => {
    setIsMobileMenuOpen(false);
    if (onNavigateSection) {
      onNavigateSection(sectionId);
    } else if (typeof window !== "undefined") {
      window.location.href = `/#${sectionId}`;
    }
  };

  /* Navigation bar turns solid white if scrolled down, mobile drawer is open, or explicitly forced */
  const isSolidHeader = isScrolled || isMobileMenuOpen || forceSolid;

  return (
    <header
      className={`fixed top-0 left-0 right-0 h-20 z-50 transition-all duration-300 ${
        isSolidHeader
          ? "bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-xs"
          : "bg-gradient-to-b from-black/60 via-black/20 to-transparent border-none"
      }`}
    >
      <nav
        className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between"
        aria-label="Main Navigation"
      >
        {/* Brand Logo and Name */}
        <Link href="/" className="flex items-center space-x-2.5 sm:space-x-3.5 group shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 relative overflow-hidden transition-transform group-hover:scale-105 rounded-full bg-white p-1 shadow-xs shrink-0">
            <img
              src="/ua-logo.png"
              alt="University of Assumption Official Seal"
              width="40"
              height="40"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="leading-tight text-left">
            <span
              className={`text-base sm:text-lg font-black tracking-tight block transition-colors ${
                isSolidHeader ? "text-[#011B51]" : "text-white"
              }`}
            >
              UA LabSign
            </span>
            <span
              className={`text-[8px] sm:text-[9.5px] font-extrabold uppercase tracking-wider block -mt-0.5 transition-colors ${
                isSolidHeader ? "text-[#A51A21]" : "text-[#FED702]"
              }`}
            >
              UNIVERSITY OF ASSUMPTION
            </span>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center space-x-8">
          <button
            type="button"
            onClick={() => handleNavClick("about")}
            className={`text-sm font-bold transition-colors cursor-pointer ${
              isSolidHeader
                ? "text-[#011B51]/80 hover:text-[#A51A21]"
                : "text-white/90 hover:text-[#FED702]"
            }`}
          >
            About System
          </button>
          <button
            type="button"
            onClick={() => handleNavClick("features")}
            className={`text-sm font-bold transition-colors cursor-pointer ${
              isSolidHeader
                ? "text-[#011B51]/80 hover:text-[#A51A21]"
                : "text-white/90 hover:text-[#FED702]"
            }`}
          >
            Features
          </button>
          <button
            type="button"
            onClick={() => handleNavClick("mobile")}
            className={`text-sm font-bold transition-colors cursor-pointer ${
              isSolidHeader
                ? "text-[#011B51]/80 hover:text-[#A51A21]"
                : "text-white/90 hover:text-[#FED702]"
            }`}
          >
            Mobile App
          </button>
          <button
            type="button"
            onClick={() => handleNavClick("faq")}
            className={`text-sm font-bold transition-colors cursor-pointer ${
              isSolidHeader
                ? "text-[#011B51]/80 hover:text-[#A51A21]"
                : "text-white/90 hover:text-[#FED702]"
            }`}
          >
            FAQ
          </button>

          <div
            className={`flex items-center pl-6 ml-2 transition-colors ${
              isSolidHeader ? "border-l border-gray-200" : "border-l border-white/30"
            }`}
          >
            <Link
              href="/student"
              className={`inline-flex items-center text-sm font-extrabold px-5 py-2.5 rounded-xl transition-all shadow-md ${
                isSolidHeader
                  ? "bg-[#011B51] text-[#FED702] hover:bg-[#A51A21] hover:text-white"
                  : "bg-[#FED702] text-[#011B51] hover:bg-white"
              }`}
            >
              <span>Student Login</span>
              <ArrowRight className="ml-1.5 w-4 h-4 stroke-[2.5]" />
            </Link>
          </div>
        </div>

        {/* Mobile Navigation Toggle */}
        <button
          type="button"
          className={`lg:hidden p-2 rounded-xl transition-colors focus:outline-none ${
            isSolidHeader ? "text-[#011B51] hover:bg-gray-100" : "text-white hover:bg-white/10"
          }`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6 stroke-[2.5]" />
          ) : (
            <Menu className="w-6 h-6 stroke-[2.5]" />
          )}
        </button>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 top-20 z-40 lg:hidden">
            {/* Dark Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs cursor-pointer"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Menu Container */}
            <motion.div
              initial={{ y: -15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -15, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-xl p-6 flex flex-col space-y-3.5 font-bold text-base z-50 text-left text-[#011B51]"
            >
              <button
                type="button"
                onClick={() => handleNavClick("about")}
                className="text-left py-2.5 px-3 rounded-lg hover:bg-gray-50 cursor-pointer block w-full transition-colors"
              >
                About System
              </button>
              <button
                type="button"
                onClick={() => handleNavClick("features")}
                className="text-left py-2.5 px-3 rounded-lg hover:bg-gray-50 cursor-pointer block w-full transition-colors"
              >
                Features
              </button>
              <button
                type="button"
                onClick={() => handleNavClick("mobile")}
                className="text-left py-2.5 px-3 rounded-lg hover:bg-gray-50 cursor-pointer block w-full transition-colors"
              >
                Mobile App
              </button>
              <button
                type="button"
                onClick={() => handleNavClick("faq")}
                className="text-left py-2.5 px-3 rounded-lg hover:bg-gray-50 cursor-pointer block w-full transition-colors"
              >
                FAQ
              </button>

              <hr className="border-gray-100 my-1" />

              <Link
                href="/student"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-center w-full py-3.5 rounded-xl bg-[#011B51] text-[#FED702] shadow-md hover:bg-[#A51A21] hover:text-white transition-all uppercase text-xs font-black tracking-wider flex items-center justify-center space-x-2"
              >
                <span>Student Login</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </Link>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
}