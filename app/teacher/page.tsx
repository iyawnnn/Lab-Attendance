"use client";

import { useState, useEffect } from "react";
import { get, set, del } from "idb-keyval";
import { loginTeacher, generateSessionPin, getTeacherDashboardData } from "../actions";
import { KeyRound, Clock, Users, LogOut } from "lucide-react";

export default function TeacherApplication() {
  const [view, setView] = useState<"loading" | "login" | "dashboard">("loading");
  const [activeTab, setActiveTab] = useState<"session" | "records">("session");
  
  const [teacherIdInput, setTeacherIdInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const [activeTeacherId, setActiveTeacherId] = useState("");
  const [schedules, setSchedules] = useState<any[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | string>("");
  const [activePin, setActivePin] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    async function initialize() {
      const storedId = await get("authenticated_teacher_id");

      if (storedId) {
        setActiveTeacherId(storedId);
        setView("dashboard");
        fetchDashboardData(storedId);
      } else {
        setView("login");
      }
    }
    initialize();
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    // Synchronize countdown with server-generated expiry to prevent client-side manipulation
    if (activePin && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft <= 0) {
      setActivePin(null);
    }
    return () => clearInterval(timer);
  }, [activePin, timeLeft]);

  async function fetchDashboardData(userId: string) {
    const result = await getTeacherDashboardData(userId);
    if (result.success) {
      setSchedules(result.schedules);
      if (result.schedules.length > 0) {
        setSelectedScheduleId(result.schedules[0].id);
      }
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsProcessing(true);
    setError("");

    try {
      const response = await loginTeacher(teacherIdInput, passwordInput);

      if (response.success && response.teacherId) {
        await set("authenticated_teacher_id", response.teacherId);
        setActiveTeacherId(response.teacherId);
        setView("dashboard");
        fetchDashboardData(response.teacherId);
      } else {
        setError(response.message || "Authentication failed.");
      }
    } catch (err) {
      setError("Network error occurred during login.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleLogout() {
    await del("authenticated_teacher_id");
    setActiveTeacherId("");
    setView("login");
  }

  async function handleGeneratePin() {
    if (!selectedScheduleId) {
      setError("Please select a schedule first.");
      return;
    }

    setError("");
    const result = await generateSessionPin(Number(selectedScheduleId), activeTeacherId);

    if (result.success && result.pin && result.expiresAt) {
      setActivePin(result.pin);
      const expiryDate = new Date(result.expiresAt).getTime();
      const secondsRemaining = Math.floor((expiryDate - Date.now()) / 1000);
      setTimeLeft(secondsRemaining);
    } else {
      setError(result.message || "Failed to initialize session.");
    }
  }

  if (view === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  if (view === "login") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-slate-100">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-100 p-3 rounded-full">
              <KeyRound className="w-8 h-8 text-blue-900" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-slate-900 mb-2">Instructor Login</h1>
          <p className="text-sm text-slate-500 text-center mb-8">Enter your credentials to access the portal.</p>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">User ID</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all"
                value={teacherIdInput}
                onChange={(e) => setTeacherIdInput(e.target.value)}
                placeholder="Enter your ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>}
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-70"
            >
              {isProcessing ? "Authenticating..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-64 bg-blue-900 text-white flex flex-col fixed h-full shadow-xl">
        <div className="p-6 border-b border-blue-800">
          <h2 className="text-xl font-bold tracking-tight">Instructor Portal</h2>
          <p className="text-blue-300 text-xs mt-1">ID: {activeTeacherId}</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab("session")}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === "session" ? "bg-blue-800 text-white" : "text-blue-100 hover:bg-blue-800/50"}`}
          >
            <Clock className="w-5 h-5" />
            <span className="font-medium">Active Session</span>
          </button>
          <button
            onClick={() => setActiveTab("records")}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === "records" ? "bg-blue-800 text-white" : "text-blue-100 hover:bg-blue-800/50"}`}
          >
            <Users className="w-5 h-5" />
            <span className="font-medium">Attendance Records</span>
          </button>
        </nav>
        <div className="p-4 border-t border-blue-800">
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-2 text-blue-300 hover:text-white transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-64 p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            {activeTab === "session" ? "Session Management" : "Class Records"}
          </h1>
        </header>

        {activeTab === "session" && (
          <div className="max-w-2xl bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            {!activePin ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Target Schedule</label>
                  <select
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-900 outline-none"
                    value={selectedScheduleId}
                    onChange={(e) => setSelectedScheduleId(e.target.value)}
                  >
                    <option value="" disabled>Select a scheduled class...</option>
                    {schedules.map((sched) => (
                      <option key={sched.id} value={sched.id}>
                        {sched.course_code} - Section {sched.section} ({sched.lab_room})
                      </option>
                    ))}
                  </select>
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button
                  onClick={handleGeneratePin}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-lg shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  <Clock className="w-5 h-5" />
                  <span>Start 60-Second Verification Window</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <h2 className="text-xl font-medium text-slate-500 mb-6 uppercase tracking-widest">Classroom Entry PIN</h2>
                <div className="text-8xl font-mono font-black text-blue-600 tracking-[0.2em] mb-8">
                  {activePin}
                </div>
                <div className="flex items-center space-x-3 text-slate-700 bg-slate-50 px-6 py-3 rounded-full border border-slate-200">
                  <Clock className="w-5 h-5 animate-pulse text-red-500" />
                  <span className="text-2xl font-bold">{timeLeft}s Remaining</span>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "records" && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase text-xs font-semibold">
                  <tr>
                    <th className="px-6 py-4">Student Name</th>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Time Logged</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {schedules.flatMap(s => s.attendances).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                        No attendance records found for your classes.
                      </td>
                    </tr>
                  ) : (
                    schedules.flatMap(s => s.attendances).map((log: any) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {log.student.last_name}, {log.student.first_name}
                        </td>
                        <td className="px-6 py-4">{log.student.student_id}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            log.status === "ON_TIME" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                          }`}>
                            {log.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}