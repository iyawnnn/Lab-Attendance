"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Maximize, Minimize, XCircle } from "lucide-react";
import { generateSessionPin, clearSessionPin } from "@/app/actions/teacher";
import { usePusherEvent } from "@/hooks/usePusher";
import ActionModal from "@/app/components/ActionModal"; // 🟢 Import Modal

interface Schedule {
  id: number | string;
  course_code: string;
  section: string;
  lab_room: string;
  schedule: string;
  date: string;
}

interface SessionTabProps {
  schedules: Schedule[];
  teacherId: string;
}

function formatTimeLeft(totalSeconds: number) {
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function SessionTab({ schedules, teacherId }: SessionTabProps) {
  const router = useRouter();
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | string>("");
  const [activePin, setActivePin] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [error, setError] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [durationSeconds, setDurationSeconds] = useState<number>(60);
  const [selectedDay, setSelectedDay] = useState<string>("");
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenRef = useRef<HTMLDivElement>(null);

  // 🟢 NEW: Modal State
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: "confirm" as "confirm" | "alert" | "error" | "success",
    title: "",
    message: "",
    onConfirm: () => {}
  });

  usePusherEvent("schedules-channel", "schedule-created", () => router.refresh());
  usePusherEvent("schedules-channel", "schedule-updated", () => router.refresh());
  usePusherEvent("schedules-channel", "schedule-deleted", () => router.refresh());

  useEffect(() => {
    const currentDay = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date());
    const availableDays = Array.from(new Set(schedules.map((s) => s.date)));

    if (availableDays.includes(currentDay)) {
      setSelectedDay(currentDay);
    } else if (availableDays.length > 0) {
      setSelectedDay(availableDays[0]);
    }
  }, [schedules]);

  useEffect(() => {
    const storedPin = localStorage.getItem(`activeSessionPin_${teacherId}`);
    const storedExpiry = localStorage.getItem(`activeSessionExpiry_${teacherId}`);
    const storedScheduleId = localStorage.getItem(`activeScheduleId_${teacherId}`);

    if (storedPin && storedExpiry && storedScheduleId) {
      const expiryTime = parseInt(storedExpiry, 10);
      const now = Date.now();

      if (expiryTime > now) {
        setActivePin(storedPin);
        setSelectedScheduleId(!isNaN(Number(storedScheduleId)) ? Number(storedScheduleId) : storedScheduleId);
        setTimeLeft(Math.floor((expiryTime - now) / 1000));
      } else {
        clearActiveSession();
      }
    }
  }, [teacherId]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activePin && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft <= 0 && activePin) {
      setActivePin(null);
      clearActiveSession();
      if (document.fullscreenElement) document.exitFullscreen().catch(console.error);
    }
    return () => clearInterval(timer);
  }, [activePin, timeLeft]);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  function clearActiveSession() {
    localStorage.removeItem(`activeSessionPin_${teacherId}`);
    localStorage.removeItem(`activeSessionExpiry_${teacherId}`);
    localStorage.removeItem(`activeScheduleId_${teacherId}`);
  }

  const uniqueDays = useMemo(() => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const scheduleDays = Array.from(new Set(schedules.map((s) => s.date)));
    return days.filter((day) => scheduleDays.includes(day));
  }, [schedules]);

  const filteredSchedules = useMemo(() => {
    const parseTime = (timeStr: string) => {
      if (!timeStr) return 0;
      const match = timeStr.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (!match) return 0;
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const modifier = match[3].toUpperCase();
      if (modifier === "PM" && hours < 12) hours += 12;
      if (modifier === "AM" && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };

    return schedules
      .filter((sched) => sched.date === selectedDay)
      .sort((a, b) => parseTime(a.schedule) - parseTime(b.schedule));
  }, [schedules, selectedDay]);

  const activeSchedule = useMemo(() => {
    return schedules.find((sched) => sched.id === selectedScheduleId) || null;
  }, [schedules, selectedScheduleId]);

  async function handleGeneratePin() {
    if (!selectedScheduleId) {
      setError("Please select a class schedule first.");
      return;
    }

    setIsGenerating(true);
    setError("");

    const result = await generateSessionPin(Number(selectedScheduleId), teacherId, durationSeconds);

    if (result.success && result.pin && result.expiresAt) {
      setActivePin(result.pin);
      const displayExpiryDate = Date.now() + durationSeconds * 1000;
      setTimeLeft(durationSeconds);

      localStorage.setItem(`activeSessionPin_${teacherId}`, result.pin);
      localStorage.setItem(`activeSessionExpiry_${teacherId}`, displayExpiryDate.toString());
      localStorage.setItem(`activeScheduleId_${teacherId}`, selectedScheduleId.toString());
    } else {
      setModalConfig({
        isOpen: true,
        type: "error",
        title: "Generation Failed",
        message: result.message || "Failed to initialize session.",
        onConfirm: () => {}
      });
    }
    setIsGenerating(false);
  }

  // 🟢 NEW: Using the Custom Modal instead of window.confirm
  function handleStopTimer() {
    setModalConfig({
      isOpen: true,
      type: "confirm",
      title: "Stop Verification",
      message: "Are you sure you want to stop the session early? Students will no longer be able to log in with this PIN.",
      onConfirm: async () => {
        setTimeLeft(0);
        setActivePin(null);
        clearActiveSession();
        if (document.fullscreenElement) document.exitFullscreen().catch(console.error);
        if (selectedScheduleId) await clearSessionPin(Number(selectedScheduleId));
        
        // Close modal after execution
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  }

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (fullscreenRef.current) await fullscreenRef.current.requestFullscreen();
      } else {
        if (document.exitFullscreen) await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Error attempting to toggle fullscreen:", err);
    }
  };

  return (
    <>
      {/* 🟢 Render the Custom Modal */}
      <ActionModal 
        isOpen={modalConfig.isOpen}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={modalConfig.onConfirm}
        confirmText="Stop Session"
      />

      <div className="animate-in fade-in duration-500 max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-10">
          {!activePin ? (
            <div className="space-y-8">
              <div className="text-center sm:text-left">
                <h2 className="text-2xl sm:text-3xl font-black text-[#011B51] uppercase tracking-tight">
                  Initialize Session
                </h2>
                <div className="w-16 h-1.5 bg-[#FED702] mt-3 mb-2 rounded-full mx-auto sm:mx-0"></div>
                <p className="text-slate-500 text-sm font-medium">
                  Select your current class to generate a secure entry PIN for student attendance.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {uniqueDays.map((day) => (
                  <button
                    key={day}
                    onClick={() => { setSelectedDay(day); setSelectedScheduleId(""); }}
                    className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${
                      selectedDay === day ? "bg-[#011B51] text-white shadow-md" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 pb-2 custom-scrollbar">
                {filteredSchedules.length > 0 ? (
                  filteredSchedules.map((sched) => (
                    <div
                      key={sched.id}
                      onClick={() => setSelectedScheduleId(sched.id)}
                      className={`cursor-pointer border-2 rounded-xl p-4 transition-all ${
                        selectedScheduleId === sched.id ? "border-[#011B51] bg-[#011B51]/5 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-black text-[#011B51] text-lg leading-none">{sched.course_code}</h3>
                        <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest">
                          Sec {sched.section}
                        </span>
                      </div>
                      <div className="space-y-1 mt-3">
                        <div className="flex items-center text-sm text-slate-600 font-medium">
                           {sched.schedule}
                        </div>
                        <div className="flex items-center text-sm text-slate-600 font-medium truncate" title={sched.lab_room}>
                          <span className="truncate">{sched.lab_room}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-8 text-center text-slate-400 font-medium text-sm">
                    No classes scheduled for {selectedDay}.
                  </div>
                )}
              </div>

              {error && (
                <div className="p-4 rounded-xl text-center text-xs font-bold uppercase tracking-wide border-2 bg-rose-50 text-rose-700 border-rose-200">
                  {error}
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
                <div className="flex flex-col sm:w-1/3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">Timer Duration</label>
                  <select
                    value={durationSeconds}
                    onChange={(e) => setDurationSeconds(Number(e.target.value))}
                    disabled={isGenerating}
                    className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none text-sm font-bold text-slate-700 focus:bg-white focus:border-[#011B51] focus:ring-2 focus:ring-[#011B51]/20 transition-all cursor-pointer h-[52px]"
                  >
                    <option value={60}>1 Minute (60s)</option>
                    <option value={180}>3 Minutes (180s)</option>
                    <option value={300}>5 Minutes (300s)</option>
                    <option value={600}>10 Minutes (600s)</option>
                    <option value={900}>15 Minutes (Max)</option>
                  </select>
                </div>

                <div className="flex flex-col flex-1">
                  <label className="text-[10px] font-bold text-transparent uppercase tracking-widest mb-1 hidden sm:block">Action</label>
                  <button
                    onClick={handleGeneratePin}
                    disabled={isGenerating || !selectedScheduleId}
                    className="w-full text-white font-bold px-4 rounded-xl transition-all bg-[#011B51] hover:bg-[#022a7a] border-b-4 border-[#A51A21] disabled:opacity-70 text-sm uppercase tracking-widest cursor-pointer shadow-md h-[52px] flex items-center justify-center"
                  >
                    {isGenerating ? "Generating..." : `Start Verification`}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div ref={fullscreenRef} className={`flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300 relative ${isFullscreen ? 'bg-white p-8 w-full h-full min-h-screen z-50' : 'min-h-[60vh]'}`}>
              <button
                onClick={toggleFullscreen}
                className={`absolute p-3 rounded-xl transition-colors shadow-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#011B51]/20 cursor-pointer ${isFullscreen ? 'top-6 right-6 sm:top-10 sm:right-10 bg-slate-50 hover:bg-slate-100 text-slate-700' : 'top-0 right-0 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-700'}`}
              >
                {isFullscreen ? <Minimize className="w-5 h-5 sm:w-6 sm:h-6" /> : <Maximize className="w-5 h-5 sm:w-6 sm:h-6" />}
              </button>

              {activeSchedule && (
                <div className="mb-10 space-y-3">
                  <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Class Session</h2>
                  <div className="max-w-full px-4 break-words font-black text-[#011B51] transition-all text-2xl sm:text-4xl md:text-5xl">
                    {activeSchedule.course_code} <span className="text-slate-300 mx-2">|</span> Sec {activeSchedule.section}
                  </div>
                  <div className={`flex items-center justify-center space-x-6 text-slate-500 font-medium ${isFullscreen ? 'text-lg sm:text-xl' : 'text-base'} transition-all`}>
                    <span>{activeSchedule.schedule}</span>
                    <span>{activeSchedule.lab_room}</span>
                  </div>
                </div>
              )}

              <div className={`${isFullscreen ? 'text-[120px] sm:text-[180px] md:text-[220px]' : 'text-[90px] sm:text-[130px] md:text-[160px]'} leading-none font-mono font-black text-[#011B51] tracking-[0.15em] mb-12 drop-shadow-sm transition-all select-all`}>
                {activePin}
              </div>

              <div className={`px-10 py-5 rounded-full border-2 transition-colors ${timeLeft <= 10 ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-slate-50 border-slate-200 text-slate-700"}`}>
                <span className={`font-black uppercase tracking-widest flex items-center space-x-4 ${isFullscreen ? 'text-5xl' : 'text-4xl'} transition-all`}>
                  <span className="relative flex h-5 w-5">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${timeLeft <= 10 ? "bg-rose-500" : "bg-[#FED702]"}`}></span>
                    <span className={`relative inline-flex rounded-full h-5 w-5 ${timeLeft <= 10 ? "bg-rose-600" : "bg-[#FED702]"}`}></span>
                  </span>
                  <span>{formatTimeLeft(timeLeft)} Remaining</span>
                </span>
              </div>

              <button
                onClick={handleStopTimer}
                className="mt-8 px-6 py-2.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 font-bold uppercase tracking-widest text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <XCircle size={16} /> Stop Verification Early
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}