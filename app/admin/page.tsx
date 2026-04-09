"use client";

import { useState, useEffect } from "react";
import { getAdminData, resetStudentDevice, verifyAdminSecret } from "../actions";
import { AttendanceLog, Student, Schedule } from "./types";
import AttendanceTab from "./components/AttendanceTab";
import SchedulesTab from "./components/SchedulesTab";
import DevicesTab from "./components/DevicesTab";

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");
  
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [messageType, setMessageType] = useState<"error" | "success">("error");

  const [activeTab, setActiveTab] = useState<"attendance" | "schedules" | "devices">("attendance");

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated]);

  async function fetchDashboardData() {
    const data = await getAdminData();
    if (data.success) {
      setLogs(data.logs || []);
      setStudents(data.students || []);
      setSchedules(data.schedules || []);
    }
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const response = await verifyAdminSecret(password);

      if (response.success) {
        setIsAuthenticated(true);
      } else {
        setMessageType("error");
        setMessage(response.message);
      }
    } catch (error) {
      console.error(error);
      setMessageType("error");
      setMessage("An unexpected authentication error occurred.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResetDevice(targetStudentId: string) {
    if (confirm(`Are you certain you want to reset the device for Student ID: ${targetStudentId}?`)) {
      setIsLoading(true);
      const response = await resetStudentDevice(targetStudentId);
      if (response.success) {
        alert("Device reset successfully.");
        fetchDashboardData();
      } else {
        alert("Failed to reset device.");
      }
      setIsLoading(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen w-full flex flex-col lg:flex-row bg-white overflow-hidden font-sans">
        
        {/* LEFT PANEL: BRANDING */}
        <div className="relative w-full lg:w-[40%] min-h-[25vh] lg:min-h-screen bg-[#011B51] flex flex-col justify-center lg:justify-between p-6 sm:p-10 lg:p-14 overflow-hidden shadow-md lg:shadow-2xl z-10 border-b-4 lg:border-b-0 lg:border-r-4 border-[#A51A21] shrink-0">
          <div className="absolute inset-0 z-0 bg-[#011B51]">
            <img src="/lab-background.jpg" alt="UA Background" className="w-full h-full object-cover opacity-80" />
            <div className="absolute inset-0 bg-[#011B51]/75"></div>
          </div>

          <div className="relative z-10 flex flex-col h-full">
            <div className="flex flex-row lg:flex-col items-center lg:items-start space-x-4 lg:space-x-0">
              <img src="/ua-logo.png" alt="UA Logo" className="w-12 h-12 sm:w-16 lg:w-20 object-contain lg:mb-8 drop-shadow-xl shrink-0" />
              <h1 className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-white tracking-tight leading-tight uppercase drop-shadow-2xl">
                System <br className="hidden lg:block"/>
                <span className="text-[#FED702]">Administration</span>
              </h1>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: SECRET ENTRY */}
        <div className="w-full lg:w-[60%] flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16 bg-white relative">
          <a href="/" className="absolute top-4 right-6 lg:top-8 lg:right-10 text-xs font-bold text-slate-400 hover:text-[#011B51] transition-colors uppercase tracking-wider">
            &larr; Main Portal
          </a>

          <div className="w-full max-w-lg">
            <div className="animate-in fade-in duration-500">
              <div className="mb-8 lg:mb-10 text-center lg:text-left">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#011B51] uppercase tracking-tight">Admin Access</h2>
                <div className="w-12 lg:w-16 h-1 lg:h-1.5 bg-[#011B51] mt-3 lg:mt-4 mb-2 lg:mb-3 rounded-full mx-auto lg:mx-0"></div>
                <p className="text-slate-500 text-xs sm:text-sm font-semibold uppercase tracking-wide">Enter administrative secret to proceed.</p>
              </div>

              <form onSubmit={handleAuth} className="space-y-4 lg:space-y-6">
                <div>
                  <label className="block text-[10px] sm:text-xs font-bold text-[#011B51] uppercase tracking-wide mb-2 ml-1">Master Password</label>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 outline-none text-sm font-medium focus:bg-white focus:border-[#011B51] focus:ring-2 focus:ring-[#011B51]/20 transition-all shadow-sm" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isLoading} 
                  className="w-full text-white font-bold py-4 rounded-xl mt-8 transition-all bg-[#011B51] hover:bg-[#022a7a] border-b-4 border-[#A51A21] disabled:opacity-70 text-xs uppercase tracking-wider cursor-pointer shadow-md"
                >
                  {isLoading ? "Verifying..." : "Unlock Dashboard"}
                </button>
              </form>

              {message && (
                <div className="mt-8 p-4 rounded-xl text-center text-xs font-bold uppercase tracking-wide border-2 bg-rose-50 text-rose-700 border-rose-200">
                  {message}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-12 font-sans">
      <header className="bg-[#011B51] border-b-4 border-[#FED702] pt-8 pb-4 px-4 sm:px-8 shadow-md relative z-20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-end">
          <div className="flex items-center space-x-4">
            <img src="/ua-logo.png" alt="UA Logo" className="w-12 h-12 object-contain bg-white rounded-full p-1 shadow-inner" />
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">Admin Control Panel</h1>
              <p className="text-[#FED702] text-xs font-bold uppercase tracking-widest mt-1">Authorized Access Only</p>
            </div>
          </div>
          <button 
            onClick={() => { setIsAuthenticated(false); setPassword(""); }} 
            className="text-xs font-bold bg-[#A51A21] hover:bg-[#851319] text-white uppercase tracking-wider px-5 py-2.5 rounded-lg shadow-sm transition-colors border border-transparent hover:border-white/20 cursor-pointer mt-4 sm:mt-0"
          >
            Log Out
          </button>
        </div>
        <div className="max-w-7xl mx-auto mt-8 flex space-x-6 sm:space-x-8 overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab("attendance")} className={`pb-3 text-xs sm:text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === "attendance" ? "border-white text-white" : "border-transparent text-white/50 hover:text-white/80 cursor-pointer"}`}>Attendance Records</button>
          <button onClick={() => setActiveTab("schedules")} className={`pb-3 text-xs sm:text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === "schedules" ? "border-white text-white" : "border-transparent text-white/50 hover:text-white/80 cursor-pointer"}`}>System Schedules</button>
          <button onClick={() => setActiveTab("devices")} className={`pb-3 text-xs sm:text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === "devices" ? "border-white text-white" : "border-transparent text-white/50 hover:text-white/80 cursor-pointer"}`}>Device Management</button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-8">
        {activeTab === "attendance" && <AttendanceTab logs={logs} />}
        {activeTab === "schedules" && <SchedulesTab schedules={schedules} refreshData={fetchDashboardData} />}
        {activeTab === "devices" && <DevicesTab students={students} onResetDevice={handleResetDevice} isLoading={isLoading} />}
      </div>
    </main>
  );
}