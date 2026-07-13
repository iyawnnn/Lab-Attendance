"use client";

import React from "react";
import Header from "./components/Header";
import HeroSection from "./components/HeroSection";
import AboutSection from "./components/AboutSection";
import VerificationProtocolSection from "./components/VerificationProtocolSection";
import CoreCapabilitiesSection from "./components/CoreCapabilitiesSection";
import MobileShowcaseSection from "./components/MobileShowcaseSection";
import FaqSection from "./components/FaqSection";
import Footer from "./components/Footer";

export default function LandingPage() {
  const handleScroll = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#011B51] font-sans selection:bg-[#FED702] selection:text-[#011B51] antialiased">
      {/* Scroll-Reactive Navigation Header */}
      <Header onNavigateSection={handleScroll} />

      <main>
        {/* Section 1: Full-Screen Hero Canvas (#011B51) */}
        <HeroSection onNavigateSection={handleScroll} />

        {/* Section 2: Academic Standard & Operations (#FFFFFF) */}
        <AboutSection />

        {/* Section 3: Step-by-Step Verification Protocol (bg-slate-50/70) */}
        <VerificationProtocolSection />

        {/* Section 4: Institutional Governance & Capabilities (#FFFFFF) */}
        <CoreCapabilitiesSection />

        {/* Section 5: Mobile Companion Application Showcase (bg-slate-50/70) */}
        <MobileShowcaseSection screenshotPath="/mobile-app-screenshot.png" />

        {/* Section 6: Frequently Asked Questions (#FFFFFF) */}
        <FaqSection />
      </main>

      {/* Institutional Footer */}
      <Footer onNavigateSection={handleScroll} />
    </div>
  );
}