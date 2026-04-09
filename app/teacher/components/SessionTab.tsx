"use client";

import { useState, useEffect } from "react";
import { generateSessionPin } from "../../actions";

interface SessionTabProps {
  schedules: any[];
  teacherId: string;
}

export default function SessionTab({ schedules, teacherId }: SessionTabProps) {
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | string>("");
  const [activePin, setActivePin] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [error, setError] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activePin && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft <= 0) {
      setActivePin(null);
    }
    return () => clearInterval(timer);
  }, [activePin, timeLeft]);

  async function handleGeneratePin() {
    if (!selectedScheduleId) {
      setError("Please select a class schedule first.");
      return;
    }

    setIsGenerating(true);
    setError("");
    
    const result = await generateSessionPin(Number(selectedScheduleId), teacherId);

    if (result.success && result.pin && result.expiresAt) {
      setActivePin(result.pin);
      const expiryDate = new Date(result.expiresAt).getTime();
      const secondsRemaining = Math.floor((expiryDate - Date.now()) / 1000);
      setTimeLeft(secondsRemaining);
    } else {
      setError(result.message || "Failed to initialize session.");
    }
    setIsGenerating(false);
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 sm:p-12">
        
        {!activePin ? (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-black text-[#011B51] uppercase tracking-tight">Initialize Class Session</h2>
              <div className="w-16 h-1.5 bg-[#FED702] mt-4 mx-auto rounded-full"></div>
              <p className="text-slate-500 text-sm font-medium mt-4">Select your current class to generate a 60-second secure entry PIN for your students.</p>
            </div>

            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-[#011B51] uppercase tracking-wide mb-2 ml-1">Target Schedule</label>
              <select
                className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 outline-none text-sm font-medium focus:bg-white focus:border-[#011B51] focus:ring-2 focus:ring-[#011B51]/20 transition-all appearance-none cursor-pointer"
                value={selectedScheduleId}
                onChange={(e) => setSelectedScheduleId(e.target.value)}
              >
                <option value="" disabled>Select a scheduled class...</option>
                {schedules.map((sched) => (
                  <option key={sched.id} value={sched.id}>
                    {sched.course_code} - Sec {sched.section} ({sched.lab_room}) | {sched.schedule}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="p-4 rounded-xl text-center text-xs font-bold uppercase tracking-wide border-2 bg-rose-50 text-rose-700 border-rose-200">
                {error}
              </div>
            )}

            <button
              onClick={handleGeneratePin}
              disabled={isGenerating || schedules.length === 0}
              className="w-full text-white font-bold py-5 rounded-xl transition-all bg-[#011B51] hover:bg-[#022a7a] border-b-4 border-[#A51A21] disabled:opacity-70 text-sm uppercase tracking-widest cursor-pointer shadow-md"
            >
              {isGenerating ? "Generating..." : "Start 60-Second Verification"}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center animate-in zoom-in-95 duration-300">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Display on Projector</h2>
            
            <div className="text-[120px] leading-none font-mono font-black text-[#011B51] tracking-[0.15em] mb-10 drop-shadow-sm">
              {activePin}
            </div>
            
            <div className={`px-8 py-4 rounded-full border-2 transition-colors ${timeLeft <= 10 ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
              <span className="text-3xl font-black uppercase tracking-widest flex items-center space-x-3">
                <span className="relative flex h-4 w-4">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${timeLeft <= 10 ? 'bg-rose-500' : 'bg-[#FED702]'}`}></span>
                  <span className={`relative inline-flex rounded-full h-4 w-4 ${timeLeft <= 10 ? 'bg-rose-600' : 'bg-[#FED702]'}`}></span>
                </span>
                <span>{timeLeft}s Remaining</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}