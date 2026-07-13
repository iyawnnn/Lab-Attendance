"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, Variants, useInView } from "framer-motion";
import { 
  MapPin, 
  Lock, 
  History, 
  Users, 
  ShieldCheck, 
  Clock,
  CheckCircle2,
  ChevronDown,
  Menu,
  X,
  ArrowRight,
  Database,
  Smartphone,
  Cpu,
  Check,
  Activity
} from "lucide-react";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

interface AnimatedCounterProps {
  value: string;
}

function AnimatedCounter({ value }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    if (!inView) return;

    const numericPart = value.replace(/[^0-9]/g, "");
    const target = parseInt(numericPart, 10);
    if (isNaN(target)) {
      setDisplayValue(value);
      return;
    }

    const suffix = value.replace(/[0-9,]/g, "");
    const hasComma = value.includes(",");
    const duration = 2000;
    const startTime = performance.now();

    /* Exponential ease-out interpolation for counter animations */
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.floor(easeProgress * target);
      
      let formatted = current.toString();
      if (hasComma) {
        formatted = current.toLocaleString();
      }
      
      setDisplayValue(formatted + suffix);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, inView]);

  return <span ref={ref}>{displayValue}</span>;
}

function HeroMockup() {
  const [step, setStep] = useState(0);

  /* Automated step progression cycling through validation sequence visualization */
  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % 4);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full max-w-lg mx-auto">
      <div className="absolute -inset-4 bg-gradient-to-tr from-school-maroon/10 to-school-blue/10 rounded-[2.5rem] blur-3xl opacity-75" />
      
      <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-155 overflow-hidden backdrop-blur-xs">
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50/80 border-b border-gray-100">
          <div className="flex space-x-2">
            <span className="w-3 h-3 rounded-full bg-school-maroon/90" />
            <span className="w-3 h-3 rounded-full bg-school-yellow" />
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
          </div>
          <div className="text-[10px] font-mono text-school-blue/55 font-bold tracking-widest uppercase">ATTENDANCE CONSOLE</div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider hidden sm:inline">LIVE</span>
          </div>
        </div>

        <div className="p-6 space-y-6 min-h-[380px] flex flex-col justify-between text-school-blue">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
                className="space-y-4 flex-1 flex flex-col justify-center"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-school-maroon uppercase tracking-widest">Step 1: GPS Check</span>
                    <h4 className="text-lg font-extrabold mt-1">Verifying Geofence</h4>
                  </div>
                  <div className="bg-school-blue/5 border border-school-blue/10 p-2 rounded-xl">
                    <MapPin className="text-school-maroon w-5 h-5 animate-bounce" />
                  </div>
                </div>
                
                <div className="bg-gray-50 border-2 border-gray-100 rounded-2xl p-6 flex flex-col items-center justify-center space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 bg-school-blue rounded-full flex items-center justify-center border border-white/10 z-10 relative shadow-md">
                      <MapPin className="text-school-yellow w-8 h-8" />
                    </div>
                    <div className="absolute inset-0 bg-school-maroon/20 rounded-full animate-ping scale-125" />
                    <div className="absolute -inset-4 bg-school-blue/5 rounded-full animate-pulse" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold">Scanning Device Location...</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden shadow-inner">
                    <motion.div 
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 4, ease: "easeInOut" }}
                      className="bg-school-maroon h-full rounded-full" 
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
                className="space-y-4 flex-1 flex flex-col justify-center"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-school-maroon uppercase tracking-widest">Step 2: Authorization</span>
                    <h4 className="text-lg font-extrabold mt-1">Enter Laboratory PIN</h4>
                  </div>
                  <div className="bg-school-blue/5 border border-school-blue/10 p-2 rounded-xl">
                    <Lock className="text-school-maroon w-5 h-5" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-center space-x-3 my-4">
                    {[1, 2, 3, 4].map((digit, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0.9, opacity: 0.5 }}
                        animate={{ 
                          scale: i < 3 ? 1.05 : 1, 
                          opacity: i < 3 ? 1 : 0.6,
                          borderColor: i < 3 ? "#A51A21" : "rgba(1, 27, 81, 0.1)"
                        }}
                        transition={{ delay: i * 0.6 }}
                        className="w-12 h-14 bg-gray-50 border-2 rounded-2xl flex items-center justify-center text-xl font-bold font-mono shadow-sm"
                      >
                        {i === 0 ? "4" : i === 1 ? "0" : i === 2 ? "2" : "•"}
                      </motion.div>
                    ))}
                  </div>
                  <p className="text-center text-xs text-school-blue/60 font-semibold">Input the temporary active PIN provided by faculty</p>
                  <div className="grid grid-cols-3 gap-1.5 max-w-[180px] mx-auto text-center text-[10px] font-bold font-mono text-school-blue/70">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                      <div key={n} className="py-1 rounded-lg bg-gray-100 shadow-2xs">{n}</div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
                className="space-y-4 flex-1 flex flex-col justify-center"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-school-maroon uppercase tracking-widest">Step 3: Security Signing</span>
                    <h4 className="text-lg font-extrabold mt-1">ECDSA Cryptographic Signing</h4>
                  </div>
                  <div className="bg-school-blue/5 border border-school-blue/10 p-2 rounded-xl">
                    <Cpu className="text-school-maroon w-5 h-5 animate-spin" />
                  </div>
                </div>

                <div className="bg-school-blue text-white rounded-2xl p-4 space-y-3 font-mono text-[9px] overflow-hidden shadow-inner border border-school-blue/25">
                  <div className="flex justify-between text-school-yellow font-bold">
                    <span>GENERATE KEYPAIR</span>
                    <span className="text-emerald-400">SUCCESS</span>
                  </div>
                  <div className="truncate text-white/50">Stored Key: secp256r1://Student_Local_Signature</div>
                  <div className="space-y-1">
                    <span className="text-school-yellow font-bold">SIGNING PAYLOAD:</span>
                    <div className="bg-black/20 p-2 rounded text-white/80 space-y-0.5">
                      <div>{"{"}</div>
                      <div>  &quot;studentId&quot;: &quot;2026-993&quot;,</div>
                      <div>  &quot;room&quot;: &quot;Room-402&quot;,</div>
                      <div>  &quot;coordinates&quot;: &quot;15.0298, 120.6931&quot;</div>
                      <div>{"}"}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5 text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="truncate">Digital Signature: 30440220269f83a...</span>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
                className="space-y-4 flex-1 flex flex-col justify-center text-center"
              >
                <div className="flex justify-center mb-2">
                  <motion.div 
                    initial={{ scale: 0.5, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-emerald-100 shadow-xl shadow-emerald-500/10"
                  >
                    <Check className="text-white w-8 h-8 stroke-[3.5]" />
                  </motion.div>
                </div>
                <h4 className="text-xl font-extrabold text-school-blue">Attendance Signed &amp; Logged</h4>
                <p className="text-sm text-school-blue/70 max-w-xs mx-auto font-medium">
                  Student <span className="text-school-maroon font-bold">2026-993</span> successfully recorded attendance in <span className="text-school-blue font-bold">Computer Laboratory (Room 402)</span>.
                </p>
                <div className="inline-block bg-emerald-50 border border-emerald-100 rounded-full px-4 py-1.5 text-[10px] font-bold text-emerald-700 font-mono shadow-sm">
                  Record Encrypted: <span className="text-school-blue font-bold">ecc_9fa12b918f</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-school-blue/50 font-semibold">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Database Online</span>
            </div>
            <span>v2.2.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileAppMockup() {
  return (
    <div className="relative mx-auto w-[290px] h-[590px]">
      <div className="absolute -inset-4 bg-gradient-to-tr from-school-maroon/20 to-school-blue/10 rounded-[3rem] blur-2xl opacity-60 animate-pulse" />
      
      <div className="relative w-full h-full bg-[#0b0f19] rounded-[3rem] border-[10px] border-gray-900 p-3.5 shadow-2xl flex flex-col justify-between overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl z-45 flex items-center justify-center">
          <div className="w-12 h-1.5 bg-black/40 rounded-full mb-1" />
        </div>

        <div className="w-full h-full bg-white rounded-[2.2rem] overflow-hidden flex flex-col justify-between relative text-school-blue select-none">
          <div className="absolute top-1 left-0 right-0 flex justify-between items-center text-[8px] text-white/80 font-mono px-4 z-40 font-bold">
            <span>09:41</span>
            <div className="flex items-center space-x-1">
              <span>LTE</span>
              <div className="w-4 h-2 border border-white/30 rounded-2xs p-0.5 flex items-center">
                <div className="w-full h-full bg-white rounded-3xs" />
              </div>
            </div>
          </div>

          <div className="relative h-[135px] overflow-hidden flex items-center justify-start px-3.5 pt-4 text-white flex-shrink-0">
            <img 
              src="/labs.jpg" 
              alt="University of Assumption Computer Laboratory Room Interior" 
              className="absolute inset-0 w-full h-full object-cover" 
            />
            <div className="absolute inset-0 bg-[#011B51]/80 mix-blend-multiply" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/20" />
            
            <div className="relative z-10 flex items-center space-x-2 mt-3.5">
              <div className="w-8.5 h-8.5 rounded-full bg-white p-0.5 flex items-center justify-center shadow-md">
                <img 
                  src="/ua-logo.png" 
                  alt="University of Assumption Official Crest Logo" 
                  className="w-full h-full object-contain" 
                />
              </div>
              <div className="font-extrabold text-[9.5px] tracking-tight leading-tight uppercase text-left">
                <div>
                  <span className="text-white">STUDENT </span>
                  <span className="text-school-yellow font-black">LAB</span>
                </div>
                <div className="mt-0.5">
                  <span className="text-school-yellow font-black">ATTENDANCE </span>
                  <span className="text-white">SYSTEM</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-white p-3.5 space-y-3.5 overflow-y-auto custom-scrollbar flex flex-col justify-between text-[9px] text-school-blue font-semibold">
            <div className="text-right">
              <span className="text-[7.5px] font-black tracking-widest text-[#566A96]/80 cursor-pointer hover:text-school-maroon uppercase">
                &larr; MAIN PORTAL
              </span>
            </div>

            <div className="flex justify-center">
              <div className="px-4 py-1 bg-[#011B51]/5 border border-[#011B51]/10 rounded-full font-bold text-school-blue text-[8px] shadow-3xs">
                STUDENT ID: <span className="font-black text-school-blue">2023001839</span>
              </div>
            </div>

            <div className="flex space-x-2">
              <div className="w-1/2 bg-[#011B51] text-white font-extrabold text-center py-2.5 rounded-lg text-[8px] cursor-pointer shadow-sm shadow-school-blue/15">
                LOG ATTENDANCE
              </div>
              <div className="w-1/2 bg-[#f1f5f9] text-gray-500 font-bold text-center py-2.5 rounded-lg text-[8px] cursor-pointer border border-gray-100 hover:bg-gray-100">
                MY HISTORY
              </div>
            </div>

            <div className="bg-white border border-gray-155 rounded-xl p-2 flex items-center space-x-2.5 shadow-3xs">
              <Clock className="w-3.5 h-3.5 text-school-blue flex-shrink-0" />
              <div className="leading-tight text-left">
                <p className="text-[6.5px] text-gray-400 font-black uppercase tracking-wider">LOCAL STANDARD TIME</p>
                <p className="text-[8px] font-black text-gray-800 mt-0.5">Sunday, July 12, 2026 &bull; 11:19 PM</p>
              </div>
            </div>

            <div className="space-y-1 text-left">
              <p className="text-[7px] text-gray-400 font-black tracking-wider uppercase">FACILITY SELECTION</p>
              <div className="w-full bg-gray-50 border border-gray-150 rounded-xl p-2.5 text-[8.5px] text-gray-400 font-bold flex justify-between items-center shadow-3xs cursor-pointer">
                <span>Select your laboratory room...</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </div>
            </div>

            <div className="space-y-1 text-left">
              <p className="text-[7px] text-gray-400 font-black tracking-wider uppercase">ROOM PIN</p>
              <div className="w-full bg-gray-50 border border-gray-150 rounded-xl py-2.5 text-center text-[10px] font-bold tracking-[0.2em] text-gray-400 font-mono shadow-3xs">
                0000
              </div>
            </div>

            <div className="w-full bg-[#566A96] hover:bg-[#4f5e80] text-white font-extrabold text-[9px] py-2.5 rounded-xl text-center shadow-md shadow-[#566A96]/15 cursor-pointer transition-colors mt-2">
              SECURELY LOG ATTENDANCE
            </div>

            <div className="text-center pt-2">
              <span className="text-[7.5px] font-bold text-gray-400 underline hover:text-school-maroon cursor-pointer uppercase tracking-wider">
                DEAUTHORIZE THIS DEVICE
              </span>
            </div>
          </div>
        </div>
      </div>

      <motion.div 
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        className="absolute -right-8 top-1/4 bg-white/95 text-school-blue rounded-2xl p-3 shadow-lg border border-gray-100 flex items-center space-x-2.5 max-w-[140px] z-20"
      >
        <div className="w-7 h-7 bg-emerald-50 rounded-xl flex items-center justify-center shadow-xs">
          <CheckCircle2 className="text-emerald-600 w-4.5 h-4.5" />
        </div>
        <div className="text-[9px] leading-tight text-left">
          <p className="font-extrabold">GPS Approved</p>
          <p className="text-gray-400 font-bold">Inside boundary</p>
        </div>
      </motion.div>

      <motion.div 
        animate={{ y: [0, 6, 0] }}
        transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
        className="absolute -left-12 bottom-1/4 bg-white/95 text-school-blue rounded-2xl p-3 shadow-lg border border-gray-100 flex items-center space-x-2.5 max-w-[150px] z-20"
      >
        <div className="w-7 h-7 bg-school-blue/5 rounded-xl flex items-center justify-center shadow-xs">
          <ShieldCheck className="text-school-maroon w-4.5 h-4.5" />
        </div>
        <div className="text-[9px] leading-tight text-left">
          <p className="font-extrabold text-school-blue">Zero-Trust ECC</p>
          <p className="text-gray-400 font-bold">Signatures Secured</p>
        </div>
      </motion.div>
    </div>
  );
}

function BenefitsIllustration() {
  return (
    <div className="relative w-full max-w-md mx-auto aspect-square flex items-center justify-center p-6 bg-school-blue/5 border border-school-blue/10 rounded-[2.5rem] overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-school-blue/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-school-maroon/5 rounded-full blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(1,27,81,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(1,27,81,0.04)_1px,transparent_1px)] bg-[size:20px_20px]" />

      <div className="relative space-y-6 w-full max-w-xs">
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 max-w-[270px]"
        >
          <div className="w-10 h-10 bg-school-blue rounded-xl flex items-center justify-center shadow-sm">
            <Smartphone className="text-school-yellow w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-school-blue">Student Device (ECDSA)</p>
            <p className="text-[9px] font-bold text-gray-400 truncate">Device Cryptographic Register</p>
          </div>
        </motion.div>

        <div className="ml-14 h-10 w-0.5 border-l-2 border-dashed border-school-blue/20 relative">
          <motion.div 
            animate={{ y: [0, 40] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
            className="absolute top-0 -left-1 w-2.5 h-2.5 bg-school-blue/20 rounded-full shadow-sm" 
          />
        </div>

        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 max-w-[270px] self-end ml-auto"
        >
          <div className="w-10 h-10 bg-school-maroon rounded-xl flex items-center justify-center shadow-sm">
            <MapPin className="text-school-yellow w-5 h-5 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-school-blue">Geofence Validation</p>
            <p className="text-[9px] font-bold text-emerald-600">65m Boundary Verification</p>
          </div>
        </motion.div>

        <div className="mr-14 h-10 w-0.5 border-l-2 border-dashed border-school-blue/20 relative ml-auto">
          <motion.div 
            animate={{ y: [0, 40] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: "linear", delay: 1.1 }}
            className="absolute top-0 -left-1 w-2.5 h-2.5 bg-school-maroon rounded-full shadow-sm" 
          />
        </div>

        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white p-4 rounded-2xl shadow-sm border border-gray-150 flex items-center space-x-4 max-w-[270px]"
        >
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center shadow-sm">
            <Database className="text-emerald-700 w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-school-blue">Attendance Record</p>
            <p className="text-[9px] font-bold text-gray-400">Neon Cloud Database Sync (PostgreSQL)</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

interface FaqItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}

function FaqItem({ question, answer, isOpen, onClick }: FaqItemProps) {
  return (
    <div className="border-b border-gray-200 py-3 transition-all duration-300">
      <button
        onClick={onClick}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between py-4 text-left focus:outline-none group cursor-pointer"
      >
        <span className="font-extrabold text-base md:text-lg text-school-blue leading-snug group-hover:text-school-maroon transition-colors">{question}</span>
        <div className={`text-school-blue transition-transform duration-300 ${isOpen ? "rotate-180 text-school-maroon" : ""}`}>
          <ChevronDown className="w-5 h-5 stroke-[2.5]" />
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <div className="pb-4 text-school-blue/75 text-sm md:text-base leading-relaxed font-semibold pt-2">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  /* Smooth scroll implementation compensating for fixed navigation header offset */
  const handleScroll = (id: string) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-school-blue font-sans selection:bg-school-yellow selection:text-school-blue overflow-x-hidden antialiased">
      <header>
        <nav className="fixed top-0 left-0 right-0 h-20 z-50 bg-white/75 backdrop-blur-md border-b border-gray-200/50 shadow-xs animate-none">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3.5 group">
              <div className="w-10 h-10 relative overflow-hidden transition-transform group-hover:scale-105">
                <img 
                  src="/ua-logo.png" 
                  alt="University of Assumption Seal Logo" 
                  className="w-full h-full object-contain" 
                />
              </div>
              <div className="leading-tight">
                <span className="text-lg font-extrabold text-school-blue tracking-tight block">University of Assumption</span>
                <span className="text-[9px] font-bold text-school-maroon uppercase tracking-widest block -mt-0.5">Laboratory Attendance System</span>
              </div>
            </Link>

            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => handleScroll("features")}
                className="text-sm font-bold text-school-blue/80 hover:text-school-maroon transition-colors cursor-pointer"
              >
                Features
              </button>
              <button 
                onClick={() => handleScroll("how-it-works")}
                className="text-sm font-bold text-school-blue/80 hover:text-school-maroon transition-colors cursor-pointer"
              >
                How it Works
              </button>
              <button 
                onClick={() => handleScroll("mobile")}
                className="text-sm font-bold text-school-blue/80 hover:text-school-maroon transition-colors cursor-pointer"
              >
                Mobile App
              </button>
              <div className="flex items-center border-l border-gray-200/60 pl-6 ml-2">
                <Link 
                  href="/student" 
                  className="text-sm font-bold bg-school-blue text-school-yellow px-5 py-2.5 rounded-xl hover:bg-school-maroon hover:text-white shadow-md shadow-school-blue/15 hover:shadow-lg transition-all"
                >
                  Student Login
                </Link>
              </div>
            </div>

            <button 
              className="md:hidden p-2 rounded-xl text-school-blue hover:bg-gray-100 transition-colors focus:outline-none"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6 stroke-[2.5]" /> : <Menu className="w-6 h-6 stroke-[2.5]" />}
            </button>
          </div>

          <AnimatePresence>
            {isMobileMenuOpen && (
              <div className="fixed inset-0 top-20 z-40 md:hidden">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="absolute inset-0 bg-black/20 backdrop-blur-2xs cursor-pointer"
                  onClick={() => setIsMobileMenuOpen(false)}
                />

                <motion.div 
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute top-0 left-0 right-0 bg-white border-b border-gray-250 shadow-xl p-6 flex flex-col space-y-4 font-bold text-base z-50"
                >
                  <button 
                    onClick={() => handleScroll("features")}
                    className="text-left text-school-blue hover:text-school-maroon transition-colors py-3 px-2 rounded-lg hover:bg-gray-55 cursor-pointer block w-full"
                  >
                    Features
                  </button>
                  <button 
                    onClick={() => handleScroll("how-it-works")}
                    className="text-left text-school-blue hover:text-school-maroon transition-colors py-3 px-2 rounded-lg hover:bg-gray-55 cursor-pointer block w-full"
                  >
                    How it Works
                  </button>
                  <button 
                    onClick={() => handleScroll("mobile")}
                    className="text-left text-school-blue hover:text-school-maroon transition-colors py-3 px-2 rounded-lg hover:bg-gray-55 cursor-pointer block w-full"
                  >
                    Mobile App
                  </button>
                  <hr className="border-gray-100 my-2" />
                  <Link href="/student" onClick={() => setIsMobileMenuOpen(false)} className="text-center w-full py-3.5 rounded-xl bg-school-blue text-school-yellow shadow-md shadow-school-blue/15 hover:bg-school-maroon hover:text-white transition-all">Student Login</Link>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </nav>
      </header>

      <main className="pt-20">
        <section className="relative overflow-hidden pt-10 pb-16 md:pt-20 md:pb-28 lg:pt-24 lg:pb-36 bg-white">
          <div className="absolute inset-0 bg-[radial-gradient(rgba(1,27,81,0.06)_1.2px,transparent_1.2px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_80%,transparent_100%)] pointer-events-none" />
          
          <div className="absolute top-[-10%] left-[-5%] w-[48%] h-[48%] bg-school-maroon/5 rounded-full blur-[115px] pointer-events-none" />
          <div className="absolute top-[15%] right-[-8%] w-[42%] h-[55%] bg-school-blue/5 rounded-full blur-[130px] pointer-events-none" />
          <div className="absolute top-[10%] left-[38%] w-[32%] h-[42%] bg-school-maroon/3 rounded-full blur-[110px] pointer-events-none" />
          
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <motion.div 
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="max-w-2xl text-left space-y-4 md:space-y-6"
              >
                <motion.h1 
                  variants={fadeInUp} 
                  className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-school-blue leading-[1.12] mt-2 animate-none"
                >
                  Smart Laboratory <br className="hidden sm:inline"/>
                  <span className="text-[#D4A000] block sm:inline mt-1 sm:mt-0">
                    Attendance Made Simple
                  </span>
                </motion.h1>
                
                <motion.p 
                  variants={fadeInUp} 
                  className="text-base sm:text-lg text-school-blue/80 leading-relaxed font-semibold max-w-xl"
                >
                  The University of Assumption Laboratory Attendance System provides a secure and convenient way for students to record laboratory attendance using PIN verification and Geolocation verification, ensuring students are physically present before attendance is recorded.
                </motion.p>
                
                <motion.div 
                  variants={fadeInUp} 
                  className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-5 pt-2"
                >
                  <Link 
                    href="/student" 
                    className="inline-flex justify-center items-center px-8 py-4 rounded-2xl bg-school-blue text-school-yellow font-extrabold text-base hover:bg-school-maroon hover:text-white shadow-xl shadow-school-blue/15 hover:shadow-2xl transition-all hover:-translate-y-0.5 group"
                  >
                    Get Started
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <button 
                    onClick={() => handleScroll("how-it-works")}
                    className="inline-flex justify-center items-center px-8 py-4 rounded-2xl bg-white border border-gray-250 text-school-blue font-extrabold text-base hover:bg-gray-50 hover:border-gray-300 transition-all shadow-2xs cursor-pointer"
                  >
                    Learn More
                  </button>
                </motion.div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.15 }}
                className="w-full relative p-2 sm:p-4 bg-gray-50/50 border border-gray-200/50 rounded-[2.5rem] shadow-xs"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-school-maroon/5 via-transparent to-school-blue/5 rounded-[2.5rem] pointer-events-none" />
                <HeroMockup />
              </motion.div>
            </div>
          </div>
        </section>

        <section className="bg-school-blue py-10 md:py-16 shadow-inner relative overflow-hidden">
          <div className="absolute inset-0 bg-white/5 opacity-5 pointer-events-none" />
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12">
              <StatItem label="Students Registered" value="2,500+" delay={0.0} />
              <StatItem label="Attendance Records" value="45,005+" delay={0.1} />
              <StatItem label="Laboratory Rooms" value="18" delay={0.2} />
              <StatItem label="Faculty Members" value="42" delay={0.3} />
            </div>
          </div>
        </section>

        <section id="features" className="py-12 md:py-24 lg:py-32 bg-slate-50/60 relative scroll-mt-20">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-school-blue/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-12 md:mb-20">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-school-blue mt-2 mb-4 md:mb-6">Designed for Security &amp; Speed</h2>
              <p className="text-base sm:text-lg text-school-blue/70 font-semibold leading-relaxed">Our platform combines Elliptic Curve cryptography and precise geofencing parameters to ensure attendance logs are accurate, reliable, and completely fraud-resistant.</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {[
                { icon: Lock, title: "PIN Authentication", desc: "Secure PIN-based attendance verification. Instructors generate dynamic, session-specific codes that students input on their personal dashboard to check in." },
                { icon: MapPin, title: "Geolocation Verification", desc: "Ensures students are physically inside the laboratory boundaries before attendance is accepted, comparing mobile GPS data against target room coordinates." },
                { icon: Activity, title: "Real-Time Attendance", desc: "Attendance records are updated instantly. Faculty dashboards utilize active web sockets and direct databases to show student logins as they occur." },
                { icon: History, title: "Attendance History", desc: "Students can view previous attendance records inside their personalized log, maintaining font tracking transparency and academic records." },
                { icon: Users, title: "Faculty Monitoring", desc: "Teachers can monitor attendance in real time, generate digital logs, manage schedule overrides, and export reports with zero paperwork." },
                { icon: Database, title: "Secure Records", desc: "Attendance records are securely stored and managed using PostgreSQL on Neon with ECDSA cryptographic signature checks to block transit tampering." }
              ].map((feature, i) => (
                <motion.div 
                  key={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  variants={fadeInUp}
                  className="bg-white p-6 md:p-8 rounded-3xl shadow-xs border border-gray-155 hover:border-t-2 hover:border-t-school-maroon hover:-translate-y-1 transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 bg-school-blue rounded-2xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform shadow-xs">
                      <feature.icon className="w-5.5 h-5.5 text-school-yellow" />
                    </div>
                    <h3 className="text-xl font-extrabold text-school-blue mb-3">{feature.title}</h3>
                    <p className="text-school-blue/70 text-sm font-semibold leading-relaxed">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-12 md:py-20 lg:py-28 bg-white border-y border-gray-200/60 overflow-hidden scroll-mt-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12 md:mb-20">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-school-blue mt-2 mb-4 md:mb-6">Seamless Step-by-Step Check-in</h2>
              <p className="text-school-blue/70 font-semibold text-base sm:text-lg max-w-2xl mx-auto">Five simple actions to securely verify and lock in your class attendance.</p>
            </div>
            
            <div className="relative pt-4">
              <div className="hidden md:block absolute top-[44px] left-[10%] right-[10%] h-[3px] bg-gray-100" />
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-10 md:gap-6 relative">
                {[
                  { step: "01", title: "Login", desc: "Login to the system using your registered credentials.", icon: Users },
                  { step: "02", title: "Select Session", desc: "Select the active laboratory session on your dashboard.", icon: Clock },
                  { step: "03", title: "Enter PIN", desc: "Enter the attendance PIN generated by your instructor.", icon: Lock },
                  { step: "04", title: "Verify GPS", desc: "System verifies GPS location to ensure you are in the lab room.", icon: MapPin },
                  { step: "05", title: "Success", desc: "Attendance is successfully recorded in the database.", icon: CheckCircle2 }
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 25 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: i * 0.12 }}
                    className="flex flex-col items-center text-center group"
                  >
                    <div className="w-20 h-20 rounded-2xl bg-white border border-gray-155 flex items-center justify-center font-extrabold text-lg mb-6 shadow-xs relative group-hover:border-school-maroon group-hover:shadow-md transition-all z-10">
                      <item.icon className="w-8 h-8 text-school-blue group-hover:text-school-maroon transition-colors" />
                      <span className="absolute -top-3 -right-3 w-6.5 h-6.5 rounded-full bg-school-yellow border-2 border-white flex items-center justify-center text-[10px] font-extrabold text-school-blue shadow-sm animate-pulse">
                        {item.step}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-school-blue mb-2">{item.title}</h3>
                    <p className="text-xs font-semibold text-school-blue/65 leading-relaxed max-w-[190px]">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-24 lg:py-32 bg-slate-50/70">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-12 md:mb-20">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-school-blue mt-2 mb-4 md:mb-6">Why Choose This System</h2>
              <p className="text-base sm:text-lg text-school-blue/70 font-semibold leading-relaxed">Built from the ground up to improve efficiency and maintain zero-trust security inside campus labs.</p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
              {[
                { title: "Fast attendance", desc: "Submit and confirm presence in less than 5 seconds." },
                { title: "Accurate verification", desc: "Dual check constraints (PIN + coordinates) leave zero room for errors." },
                { title: "Eliminates manual attendance", desc: "No more signing physical sheets, reducing admin workloads for teachers." },
                { title: "Reduces proxy attendance", desc: "Stops students from checking in friends remotely." },
                { title: "Mobile-friendly", desc: "Clean responsive web app layouts optimized for all browser screens." },
                { title: "Secure authentication", desc: "ECDSA standard cryptography prevents server spoofing or code bypass." },
                { title: "Reliable attendance reports", desc: "Export authentic Excel/PDF logs generated directly from the database." },
                { title: "Automated Device Locks", desc: "Binds student keys to unique browser IDs for high device integrity." }
              ].map((benefit, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, scale: 0.97 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="bg-white p-5 md:p-6 rounded-2xl shadow-2xs border border-gray-155 hover:border-school-maroon/20 hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
                    </div>
                    <span className="font-extrabold text-sm text-school-blue">{benefit.title}</span>
                  </div>
                  <p className="text-xs text-school-blue/65 font-bold leading-relaxed">{benefit.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="mobile" className="py-12 md:py-20 lg:py-28 bg-white relative overflow-hidden scroll-mt-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="bg-school-blue rounded-[3rem] p-6 md:p-16 overflow-hidden relative shadow-2xl">
              <div className="absolute right-0 bottom-0 w-96 h-96 bg-school-maroon rounded-full blur-[150px] opacity-60" />
              
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center relative z-10">
                <div className="text-left space-y-4 md:space-y-6">
                  <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">Take Attendance Anywhere</h2>
                  <p className="text-sm md:text-base text-white/80 font-semibold leading-relaxed">
                    The Laboratory Attendance mobile application allows students to securely check in using PIN and GPS verification directly from their Android devices. Redesigned with custom maps and lightweight telemetry, it is built to run smoothly even inside deep classroom structures.
                  </p>
                  
                  <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                    <div className="inline-block transition-transform hover:-translate-y-0.5 pointer-events-none opacity-85">
                      <img 
                        alt="Get it on Google Play badge for University of Assumption Laboratory Attendance Mobile App" 
                        src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" 
                        className="h-16" 
                      />
                    </div>
                    <span className="text-xs font-bold text-school-yellow uppercase tracking-widest bg-white/10 px-4 py-2.5 rounded-xl border border-white/5 shadow-inner">
                      Available Soon on Google Play
                    </span>
                  </div>
                </div>

                <div className="flex justify-center lg:justify-end">
                  <MobileAppMockup />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-24 lg:py-32 bg-white border-b border-gray-200/50 relative">
          <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-school-blue/5 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center relative z-10">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <BenefitsIllustration />
            </motion.div>
            
            <div className="space-y-6 md:space-y-8 text-left">
              <div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-school-blue mt-2 mb-4 md:mb-6">Built for Modern Educational Infrastructure</h2>
                <p className="text-base sm:text-lg text-school-blue/70 font-semibold leading-relaxed">Upgrade your university workflow with an attendance protocol that mitigates fraud while improving faculty management.</p>
              </div>
              <ul className="space-y-4">
                {[
                  { title: "Faster attendance process", desc: "Students check in in seconds, maximizing active lecture and lab hours." },
                  { title: "Secure PIN authentication", desc: "Generated PIN is unique per lab session, eliminating false sign-ins." },
                  { title: "GPS verification", desc: "GPS checking ensures verification coordinates map to physical seats." },
                  { title: "Digital attendance history", desc: "Transparent records dashboard allows students to review total sessions logged." },
                  { title: "Improved laboratory management", desc: "Monitors laboratory capacity and schedules in real-time." },
                  { title: "Less paperwork", desc: "Reduces paper sheets, archiving administrative folders digitally." },
                  { title: "Better monitoring", desc: "Instant oversight alerts for department chairs and campus administrators." }
                ].map((benefit, i) => (
                  <motion.li 
                    key={i}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.08 }}
                    className="flex items-start space-x-3.5 group"
                  >
                    <div className="mt-1 bg-emerald-50 p-1.5 rounded-lg text-emerald-600 shadow-2xs group-hover:bg-emerald-100 transition-colors flex-shrink-0">
                      <Check className="w-4.5 h-4.5 stroke-[3]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-school-blue">{benefit.title}</h3>
                      <p className="text-xs font-bold text-school-blue/65 mt-0.5">{benefit.desc}</p>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-24 lg:py-32 bg-slate-50/50 border-b border-gray-250 relative">
          <div className="max-w-3xl mx-auto px-6 relative z-10">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl font-extrabold text-school-blue mt-2 mb-3">Frequently Asked Questions</h2>
              <p className="text-sm font-bold text-school-blue/60 max-w-sm mx-auto">Find answers to common questions about security, devices, and rules.</p>
            </div>
            <div className="space-y-2">
              {[
                { 
                  q: "How does PIN attendance work?", 
                  a: "Instructors generate a secure, unique PIN for each laboratory session. Students must enter this exact PIN in their dashboard while physically inside the lab to successfully record their attendance." 
                },
                { 
                  q: "Why is location verification required?", 
                  a: "Geolocation ensures that the attendance system cannot be bypassed remotely. It confirms you are within the designated boundary of the laboratory room when you submit your PIN." 
                },
                { 
                  q: "Is my location stored permanently?", 
                  a: "No. The system only temporarily checks your GPS coordinates at the moment of check-in to validate your presence. Continuous tracking is not implemented." 
                },
                { 
                  q: "Can I use the system on mobile?", 
                  a: "Yes. The web platform is entirely responsive. Additionally, a dedicated companion Android app is currently in development for even faster check-ins." 
                },
                { 
                  q: "What happens if GPS is unavailable?", 
                  a: "If your device cannot acquire a GPS signal, you will need to ensure location services are enabled and permissions are granted to the browser/app. Faculty members have override privileges for exceptional technical issues." 
                },
                { 
                  q: "Can instructors monitor attendance in real time?", 
                  a: "Yes. Faculty dashboards utilize live database connections to update attendance records instantaneously as students verify their presence." 
                }
              ].map((faq, i) => (
                <FaqItem 
                  key={i} 
                  question={faq.q} 
                  answer={faq.a} 
                  isOpen={activeFaq === i} 
                  onClick={() => toggleFaq(i)} 
                />
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 md:py-24 lg:py-32 bg-white relative text-center">
          <div className="max-w-5xl mx-auto px-6">
            <div className="relative bg-slate-50 border border-gray-155 rounded-[2.5rem] p-10 md:p-16 overflow-hidden shadow-xs">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-school-maroon/5 rounded-full blur-[100px] pointer-events-none" />
              
              <div className="relative z-10 space-y-6 max-w-3xl mx-auto">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-school-blue tracking-tight leading-tight">
                  Experience Smarter Laboratory <br className="hidden sm:inline"/> Attendance Today
                </h2>
                <p className="text-sm sm:text-base text-school-blue/70 font-semibold max-w-lg mx-auto">
                  Get started now to digitize your laboratory check-ins and streamline administrative reporting.
                </p>
                <div className="flex justify-center pt-4">
                  <Link 
                    href="/student" 
                    className="inline-flex justify-center items-center px-10 py-4.5 rounded-2xl bg-school-blue text-school-yellow font-extrabold text-base hover:bg-school-maroon hover:text-white shadow-xl shadow-school-blue/15 hover:shadow-2xl transition-all hover:-translate-y-0.5 group"
                  >
                    Get Started
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-school-blue text-white pt-12 pb-8 md:pt-20 md:pb-10 border-t border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/2 opacity-2 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-12 mb-16 text-left">
            <div className="md:col-span-1 space-y-5">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-white p-1.5 flex items-center justify-center shadow-md">
                  <img 
                    src="/ua-logo.png" 
                    alt="University of Assumption Seal" 
                    className="w-full h-full object-contain" 
                  />
                </div>
                <span className="text-lg font-extrabold tracking-tight">University of Assumption</span>
              </div>
              <p className="text-white/60 font-semibold text-xs leading-relaxed">
                A secure, modern attendance tracking solution designed for university laboratories utilizing PostgreSQL on Neon and robust zero-trust cryptographic signatures.
              </p>
            </div>
            
            <div className="space-y-5">
              <h3 className="font-extrabold text-school-yellow text-xs uppercase tracking-widest">Quick Links</h3>
              <ul className="space-y-3.5 text-xs font-semibold text-white/70">
                <li><Link href="/student" className="hover:text-school-yellow transition-colors">Student Portal</Link></li>
                <li>
                  <button 
                    onClick={() => handleScroll("features")}
                    className="hover:text-school-yellow transition-colors cursor-pointer text-left font-semibold"
                  >
                    Features
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => handleScroll("how-it-works")}
                    className="hover:text-school-yellow transition-colors cursor-pointer text-left font-semibold"
                  >
                    How it Works
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => handleScroll("mobile")}
                    className="hover:text-school-yellow transition-colors cursor-pointer text-left font-semibold"
                  >
                    Mobile App
                  </button>
                </li>
              </ul>
            </div>
            
            <div className="space-y-5">
              <h3 className="font-extrabold text-school-yellow text-xs uppercase tracking-widest">Legal</h3>
              <ul className="space-y-3.5 text-xs font-semibold text-white/70">
                <li><Link href="/privacy" className="hover:text-school-yellow transition-colors">Privacy Policy</Link></li>
                <li><Link href="/privacy" className="hover:text-school-yellow transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-school-yellow transition-colors">Data Security</Link></li>
              </ul>
            </div>
            
            <div className="space-y-5">
              <h3 className="font-extrabold text-school-yellow text-xs uppercase tracking-widest">Contact</h3>
              <ul className="space-y-3.5 text-xs font-semibold text-white/70">
                <li className="flex items-center"><MapPin className="w-4 h-4 mr-2 text-school-yellow" /> Pampanga, Philippines</li>
                <li>support@universityofassumption.edu.ph</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-xs font-semibold text-white/40">
            <p>&copy; {new Date().getFullYear()} University of Assumption Laboratory Attendance System. All rights reserved.</p>
            <div className="mt-4 md:mt-0 flex space-x-6">
              <span className="hover:text-school-yellow transition-colors cursor-default">Built with Next.js &amp; React</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

interface StatItemProps {
  label: string;
  value: string;
  delay: number;
}

function StatItem({ label, value, delay }: StatItemProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, delay }}
      className="text-center p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all shadow-xs"
    >
      <p className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-school-yellow mb-2.5 tracking-tight select-none">
        <AnimatedCounter value={value} />
      </p>
      <p className="text-[10px] sm:text-xs font-extrabold text-white/80 uppercase tracking-widest leading-none">{label}</p>
    </motion.div>
  );
}