"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Maximize, Minimize } from "lucide-react";
import { generateSessionPin } from "../../actions";

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

export default function SessionTab({ schedules, teacherId }: SessionTabProps) {
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | string>("");
  const [activePin, setActivePin] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [error, setError] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  const [selectedDay, setSelectedDay] = useState<string>("");
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentDay = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
    }).format(new Date());
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
        setSelectedScheduleId(
          !isNaN(Number(storedScheduleId))
            ? Number(storedScheduleId)
            : storedScheduleId,
        );
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
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(console.error);
      }
    }
    return () => clearInterval(timer);
  }, [activePin, timeLeft]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  function clearActiveSession() {
    localStorage.removeItem(`activeSessionPin_${teacherId}`);
    localStorage.removeItem(`activeSessionExpiry_${teacherId}`);
    localStorage.removeItem(`activeScheduleId_${teacherId}`);
  }

  const uniqueDays = useMemo(() => {
    const days = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    const scheduleDays = Array.from(new Set(schedules.map((s) => s.date)));
    return days.filter((day) => scheduleDays.includes(day));
  }, [schedules]);

  const filteredSchedules = useMemo(() => {
    return schedules.filter((sched) => sched.date === selectedDay);
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

    const result = await generateSessionPin(
      Number(selectedScheduleId),
      teacherId,
    );

    if (result.success && result.pin && result.expiresAt) {
      setActivePin(result.pin);

      const displayExpiryDate = Date.now() + 60 * 1000;
      setTimeLeft(60);

      localStorage.setItem(`activeSessionPin_${teacherId}`, result.pin);
      localStorage.setItem(
        `activeSessionExpiry_${teacherId}`,
        displayExpiryDate.toString(),
      );
      localStorage.setItem(
        `activeScheduleId_${teacherId}`,
        selectedScheduleId.toString(),
      );
    } else {
      setError(result.message || "Failed to initialize session.");
    }
    setIsGenerating(false);
  }

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (fullscreenRef.current) {
          await fullscreenRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.error("Error attempting to toggle fullscreen:", err);
    }
  };

  return (
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
                Select your current class to generate a 60-second secure entry PIN.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {uniqueDays.map((day) => (
                <button
                  key={day}
                  onClick={() => {
                    setSelectedDay(day);
                    setSelectedScheduleId("");
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${
                    selectedDay === day
                      ? "bg-[#011B51] text-white shadow-md"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 pb-2">
              {filteredSchedules.length > 0 ? (
                filteredSchedules.map((sched) => (
                  <div
                    key={sched.id}
                    onClick={() => setSelectedScheduleId(sched.id)}
                    className={`cursor-pointer border-2 rounded-xl p-4 transition-all ${
                      selectedScheduleId === sched.id
                        ? "border-[#011B51] bg-[#011B51]/5 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-black text-[#011B51] text-lg leading-none">
                        {sched.course_code}
                      </h3>
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest">
                        Sec {sched.section}
                      </span>
                    </div>

                    <div className="space-y-1 mt-3">
                      <div className="flex items-center text-sm text-slate-600 font-medium">
                        <svg
                          className="w-4 h-4 mr-2 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          ></path>
                        </svg>
                        {sched.schedule}
                      </div>
                      <div
                        className="flex items-center text-sm text-slate-600 font-medium truncate"
                        title={sched.lab_room}
                      >
                        <svg
                          className="w-4 h-4 mr-2 text-slate-400 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"
                          ></path>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          ></path>
                        </svg>
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

            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={handleGeneratePin}
                disabled={isGenerating || !selectedScheduleId}
                className="w-full text-white font-bold py-4 rounded-xl transition-all bg-[#011B51] hover:bg-[#022a7a] border-b-4 border-[#A51A21] disabled:opacity-70 text-sm uppercase tracking-widest cursor-pointer shadow-md"
              >
                {isGenerating
                  ? "Generating Verification Pin..."
                  : "Start 60-Second Verification"}
              </button>
            </div>
          </div>
        ) : (
          <div 
            ref={fullscreenRef}
            className={`flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300 relative ${
              isFullscreen ? 'bg-white p-8 w-full h-full min-h-screen z-50' : 'min-h-[60vh]'
            }`}
          >
            <button
              onClick={toggleFullscreen}
              className={`absolute p-3 rounded-xl transition-colors shadow-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#011B51]/20 cursor-pointer ${
                isFullscreen 
                  ? 'top-6 right-6 sm:top-10 sm:right-10 bg-slate-50 hover:bg-slate-100 text-slate-700' 
                  : 'top-0 right-0 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-700'
              }`}
              title={isFullscreen ? "Exit Fullscreen" : "Present Fullscreen"}
            >
              {isFullscreen ? <Minimize className="w-5 h-5 sm:w-6 sm:h-6" /> : <Maximize className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>

            {activeSchedule && (
              <div className="mb-10 space-y-3">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Active Class Session
                </h2>
                <div className={`${isFullscreen ? 'text-4xl sm:text-5xl' : 'text-3xl'} font-black text-[#011B51] transition-all`}>
                  {activeSchedule.course_code}{" "}
                  <span className="text-slate-300 mx-2">|</span> Sec{" "}
                  {activeSchedule.section}
                </div>
                <div className={`flex items-center justify-center space-x-6 text-slate-500 font-medium ${isFullscreen ? 'text-lg sm:text-xl' : 'text-base'} transition-all`}>
                  <span className="flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-[#FED702]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                    {activeSchedule.schedule}
                  </span>
                  <span className="flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-[#FED702]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"
                      ></path>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      ></path>
                    </svg>
                    {activeSchedule.lab_room}
                  </span>
                </div>
              </div>
            )}

            <div className={`${isFullscreen ? 'text-[160px] sm:text-[220px]' : 'text-[120px] sm:text-[160px]'} leading-none font-mono font-black text-[#011B51] tracking-[0.15em] mb-12 drop-shadow-sm transition-all`}>
              {activePin}
            </div>

            <div
              className={`px-10 py-5 rounded-full border-2 transition-colors ${timeLeft <= 10 ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-slate-50 border-slate-200 text-slate-700"}`}
            >
              <span className={`font-black uppercase tracking-widest flex items-center space-x-4 ${isFullscreen ? 'text-5xl' : 'text-4xl'} transition-all`}>
                <span className="relative flex h-5 w-5">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${timeLeft <= 10 ? "bg-rose-500" : "bg-[#FED702]"}`}
                  ></span>
                  <span
                    className={`relative inline-flex rounded-full h-5 w-5 ${timeLeft <= 10 ? "bg-rose-600" : "bg-[#FED702]"}`}
                  ></span>
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