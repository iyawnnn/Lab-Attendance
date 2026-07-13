"use client";

import React, { useState } from "react";
import { Plus, Minus } from "lucide-react";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqData: FaqItem[] = [
  {
    id: "faq-1",
    category: "Verification & Privacy",
    question: "How does the system verify my physical presence in the laboratory?",
    answer:
      "The mobile application validates your device coordinates against the laboratory room boundaries at the exact second you submit the session PIN. Your location is evaluated instantly to confirm presence inside the classroom.",
  },
  {
    id: "faq-2",
    category: "Device Security",
    question: "Can I submit attendance for a classmate using my phone?",
    answer:
      "No. Each student account is cryptographically bound to a single registered mobile device. Attempting to check in for another student will trigger a security key mismatch.",
  },
  {
    id: "faq-3",
    category: "Privacy & Location",
    question: "Is my GPS location tracked continuously during class hours?",
    answer:
      "No. Location telemetry is evaluated strictly during the single moment of PIN submission. The application does not perform continuous background tracking.",
  },
  {
    id: "faq-4",
    category: "Account & Hardware",
    question: "What should I do if I change or upgrade my mobile device?",
    answer:
      "If you replace your mobile phone, you must submit a device reset request to your laboratory administrator or department chair to authorize your new hardware.",
  },
  {
    id: "faq-5",
    category: "Connectivity",
    question: "What happens if campus Wi-Fi drops while submitting attendance?",
    answer:
      "Attendance verification requires an active data or campus network connection to synchronize with the database. If connectivity drops, you can re-submit as soon as your connection is restored within the active class window.",
  },
];

export default function FaqSection() {
  const [openId, setOpenId] = useState<string | null>("faq-1");

  const toggleFaq = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section
      id="faq"
      className="bg-white text-[#011B51] py-20 md:py-28 border-b border-gray-200/80"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start text-left">
          
          {/* Left Column: Section Header */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-4">
            <span className="text-xs font-black text-[#A51A21] uppercase tracking-widest block border-l-2 border-[#A51A21] pl-3">
              Questions &amp; Support
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#011B51] tracking-tight leading-snug">
              Frequently Asked Questions
            </h2>
            <p className="text-sm sm:text-base font-semibold text-gray-600 leading-relaxed">
              Find clear answers regarding location checks, device security, and attendance policies across university laboratories.
            </p>
          </div>

          {/* Right Column: Interactive Accordion List */}
          <div className="lg:col-span-7 divide-y divide-gray-200 border-t border-b border-gray-200">
            {faqData.map((item) => {
              const isOpen = openId === item.id;
              return (
                <div key={item.id} className="py-6 transition-colors">
                  <button
                    onClick={() => toggleFaq(item.id)}
                    className="w-full flex items-start justify-between text-left group focus:outline-none"
                    aria-expanded={isOpen}
                  >
                    <div className="pr-6 space-y-1">
                      <span className="text-[10px] font-extrabold text-[#A51A21] uppercase tracking-widest block">
                        {item.category}
                      </span>
                      <h3 className="text-base sm:text-lg font-extrabold text-[#011B51] group-hover:text-[#A51A21] transition-colors leading-snug">
                        {item.question}
                      </h3>
                    </div>

                    <div className="mt-1 w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center shrink-0 group-hover:border-[#011B51] transition-colors">
                      {isOpen ? (
                        <Minus className="w-4 h-4 text-[#A51A21]" />
                      ) : (
                        <Plus className="w-4 h-4 text-[#011B51]" />
                      )}
                    </div>
                  </button>

                  {/* Expandable Answer Area */}
                  {isOpen && (
                    <div className="pt-3 pr-8">
                      <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}