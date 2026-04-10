"use client";

import { useState, useEffect } from "react";
import { get, set, del } from "idb-keyval";
import { loginTeacher, getTeacherDashboardData, changeTeacherPassword } from "../actions";
import SessionTab from "./components/SessionTab";
import SchedulesTab from "./components/SchedulesTab";
import AttendanceTab from "./components/AttendanceTab";

export default function TeacherDashboard() {
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [teacherIdInput, setTeacherIdInput] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  
  const [activeTeacherId, setActiveTeacherId] = useState<string>("");
  const [activeTeacherName, setActiveTeacherName] = useState<string>("");
  
  const [schedules, setSchedules] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [messageType, setMessageType] = useState<"error" | "success">("error");

  const [activeTab, setActiveTab] = useState<"session" | "schedules" | "attendance">("session");

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [settingsMessage, setSettingsMessage] = useState<string>("");
  const [isSettingsProcessing, setIsSettingsProcessing] = useState<boolean>(false);

  useEffect(() => {
    async function initialize() {
      try {
        const storedId = await get("authenticated_teacher_id");
        const storedName = await get("authenticated_teacher_name");
        
        if (storedId) {
          setActiveTeacherId(storedId);
          if (storedName) setActiveTeacherName(storedName);
          setIsAuthenticated(true);
          await fetchDashboardData(storedId);
        }
      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        setIsInitializing(false);
      }
    }
    initialize();
  }, []);

  async function fetchDashboardData(userId: string) {
    const result = await getTeacherDashboardData(userId);
    if (result.success) {
      setSchedules(result.schedules || []);
      
      const flatLogs = (result.schedules || []).flatMap((sched: any) => 
        sched.attendances.map((att: any) => ({
          ...att,
          schedule: sched
        }))
      ).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setLogs(flatLogs);
    }
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const response = await loginTeacher(teacherIdInput, password);

      if (response.success && response.teacherId) {
        await set("authenticated_teacher_id", response.teacherId);
        await set("authenticated_teacher_name", response.name);
        setActiveTeacherId(response.teacherId);
        setActiveTeacherName(response.name || "");
        setIsAuthenticated(true);
        fetchDashboardData(response.teacherId);
      } else {
        setMessageType("error");
        setMessage(response.message || "Authentication failed.");
      }
    } catch (error) {
      console.error(error);
      setMessageType("error");
      setMessage("An unexpected authentication error occurred.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogout() {
    await del("authenticated_teacher_id");
    await del("authenticated_teacher_name");
    setIsAuthenticated(false);
    setTeacherIdInput("");
    setPassword("");
    setActiveTeacherId("");
    setSchedules([]);
    setLogs([]);
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setSettingsMessage("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setSettingsMessage("New password must be at least 8 characters long.");
      return;
    }

    setIsSettingsProcessing(true);
    setSettingsMessage("");

    const response = await changeTeacherPassword(activeTeacherId, currentPassword, newPassword);
    
    setSettingsMessage(response.message);
    
    if (response.success) {
      setTimeout(() => {
        setIsSettingsOpen(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setSettingsMessage("");
      }, 2000);
    }
    
    setIsSettingsProcessing(false);
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#011B51]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen w-full flex flex-col lg:flex-row bg-white overflow-hidden font-sans">
        <div className="relative w-full lg:w-[40%] min-h-[25vh] lg:min-h-screen bg-[#011B51] flex flex-col justify-center lg:justify-between p-6 sm:p-10 lg:p-14 overflow-hidden shadow-md lg:shadow-2xl z-10 border-b-4 lg:border-b-0 lg:border-r-4 border-[#FED702] shrink-0">
          <div className="absolute inset-0 z-0 bg-[#011B51]">
            <img src="/lab-background.jpg" alt="UA Background" className="w-full h-full object-cover opacity-80" />
            <div className="absolute inset-0 bg-[#011B51]/75"></div>
          </div>
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex flex-row lg:flex-col items-center lg:items-start space-x-4 lg:space-x-0">
              <img src="/ua-logo.png" alt="UA Logo" className="w-12 h-12 sm:w-16 lg:w-20 object-contain lg:mb-8 drop-shadow-xl shrink-0" />
              <h1 className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-white tracking-tight leading-tight uppercase drop-shadow-2xl">
                Instructor <br className="hidden lg:block"/>
                <span className="text-[#FED702]">Portal</span>
              </h1>
            </div>
            <div className="hidden lg:block mt-auto pt-12">
              <p className="text-white/90 text-base lg:text-lg leading-relaxed font-medium drop-shadow-lg max-w-xl">
                Secure faculty portal for managing laboratory sessions and verifying student attendance.
              </p>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[60%] flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16 bg-white relative">
          <a href="/" className="absolute top-4 right-6 lg:top-8 lg:right-10 text-xs font-bold text-slate-400 hover:text-[#011B51] transition-colors uppercase tracking-wider">
            &larr; Main Portal
          </a>

          <div className="w-full max-w-lg">
            <div className="animate-in fade-in duration-500">
              <div className="mb-8 lg:mb-10 text-center lg:text-left">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#011B51] uppercase tracking-tight">Faculty Access</h2>
                <div className="w-12 lg:w-16 h-1 lg:h-1.5 bg-[#FED702] mt-3 lg:mt-4 mb-2 lg:mb-3 rounded-full mx-auto lg:mx-0"></div>
                <p className="text-slate-500 text-xs sm:text-sm font-semibold uppercase tracking-wide">Enter credentials to manage your classes.</p>
              </div>

              <form onSubmit={handleAuth} className="space-y-4 lg:space-y-6">
                <div>
                  <label className="block text-[10px] sm:text-xs font-bold text-[#011B51] uppercase tracking-wide mb-2 ml-1">Instructor ID</label>
                  <input 
                    type="text" 
                    placeholder="e.g. TCH-001" 
                    className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 outline-none text-sm font-medium focus:bg-white focus:border-[#011B51] focus:ring-2 focus:ring-[#011B51]/20 transition-all shadow-sm" 
                    value={teacherIdInput} 
                    onChange={(e) => setTeacherIdInput(e.target.value)} 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-[10px] sm:text-xs font-bold text-[#011B51] uppercase tracking-wide mb-2 ml-1">Password</label>
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
                  {isLoading ? "Authenticating..." : "Secure Login"}
                </button>
              </form>

              {message && (
                <div className={`mt-8 p-4 rounded-xl text-center text-xs font-bold uppercase tracking-wide border-2 ${messageType === "error" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
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
    <main className="min-h-screen bg-slate-50 pb-12 font-sans relative">
      <header className="bg-[#011B51] border-b-4 border-[#FED702] pt-8 pb-4 px-4 sm:px-8 shadow-md relative z-20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-end">
          <div className="flex items-center space-x-4">
            <img src="/ua-logo.png" alt="UA Logo" className="w-12 h-12 object-contain bg-white rounded-full p-1 shadow-inner" />
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">{activeTeacherName || "Instructor Portal"}</h1>
              <p className="text-[#FED702] text-xs font-bold uppercase tracking-widest mt-1">ID: {activeTeacherId}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <button 
              onClick={() => setIsSettingsOpen(true)} 
              className="text-xs font-bold bg-white/10 hover:bg-white/20 text-white uppercase tracking-wider px-5 py-2.5 rounded-lg shadow-sm transition-colors border border-transparent cursor-pointer"
            >
              Security Settings
            </button>
            <button 
              onClick={handleLogout} 
              className="text-xs font-bold bg-[#A51A21] hover:bg-[#851319] text-white uppercase tracking-wider px-5 py-2.5 rounded-lg shadow-sm transition-colors border border-transparent cursor-pointer"
            >
              Log Out
            </button>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-8 flex space-x-6 sm:space-x-8 overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab("session")} className={`pb-3 text-xs sm:text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === "session" ? "border-white text-white" : "border-transparent text-white/50 hover:text-white/80 cursor-pointer whitespace-nowrap"}`}>Active Session</button>
          <button onClick={() => setActiveTab("schedules")} className={`pb-3 text-xs sm:text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === "schedules" ? "border-white text-white" : "border-transparent text-white/50 hover:text-white/80 cursor-pointer whitespace-nowrap"}`}>My Classes</button>
          <button onClick={() => setActiveTab("attendance")} className={`pb-3 text-xs sm:text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === "attendance" ? "border-white text-white" : "border-transparent text-white/50 hover:text-white/80 cursor-pointer whitespace-nowrap"}`}>Class Records</button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-8">
        <div className={activeTab === "session" ? "block" : "hidden"}>
          <SessionTab schedules={schedules} teacherId={activeTeacherId} />
        </div>
        <div className={activeTab === "schedules" ? "block" : "hidden"}>
          <SchedulesTab schedules={schedules} />
        </div>
        <div className={activeTab === "attendance" ? "block" : "hidden"}>
          <AttendanceTab logs={logs} schedules={schedules} teacherUserId={activeTeacherId} />
        </div>
      </div>

      {isSettingsOpen && (
        <div className="fixed inset-0 bg-[#011B51]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-8">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border-t-8 border-[#FED702]">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Account Security</h3>
                <h2 className="text-xl font-black text-[#011B51] uppercase tracking-tight">Change Password</h2>
              </div>
              <button 
                onClick={() => {
                  setIsSettingsOpen(false);
                  setSettingsMessage("");
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }} 
                className="text-slate-400 hover:text-[#011B51] font-black text-2xl cursor-pointer"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6">
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-[10px] sm:text-xs font-bold text-[#011B51] uppercase tracking-wide mb-1.5 ml-1">Current Password</label>
                  <input type="password" required className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none text-sm font-medium focus:bg-white focus:border-[#011B51] focus:ring-2 focus:ring-[#011B51]/20 transition-all" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[10px] sm:text-xs font-bold text-[#011B51] uppercase tracking-wide mb-1.5 ml-1">New Password</label>
                  <input type="password" required className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none text-sm font-medium focus:bg-white focus:border-[#011B51] focus:ring-2 focus:ring-[#011B51]/20 transition-all" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[10px] sm:text-xs font-bold text-[#011B51] uppercase tracking-wide mb-1.5 ml-1">Confirm New Password</label>
                  <input type="password" required className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none text-sm font-medium focus:bg-white focus:border-[#011B51] focus:ring-2 focus:ring-[#011B51]/20 transition-all" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>

                {settingsMessage && (
                  <div className={`p-3 rounded-xl text-center text-[10px] font-bold uppercase tracking-wide border-2 ${settingsMessage.includes("successfully") || settingsMessage.includes("securely") ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                    {settingsMessage}
                  </div>
                )}

                <button type="submit" disabled={isSettingsProcessing} className="w-full bg-[#011B51] hover:bg-[#022a7a] text-white font-bold py-3.5 rounded-xl mt-6 transition-all shadow-md border-b-4 border-[#A51A21] disabled:opacity-70 text-xs uppercase tracking-wider cursor-pointer">
                  {isSettingsProcessing ? "Updating..." : "Update Password"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}