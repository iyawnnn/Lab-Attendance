"use client";

import { useState } from "react";
import { createTeacherAccount } from "../../actions";

interface TeachersTabProps {
  teachers: any[];
  refreshData: () => void;
}

export default function TeachersTab({ teachers = [], refreshData }: TeachersTabProps) {
  const [newTeacherId, setNewTeacherId] = useState("");
  const [newTeacherName, setNewTeacherName] = useState("");
  const [newTeacherPassword, setNewTeacherPassword] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function handleCreateTeacher(e: React.FormEvent) {
    e.preventDefault();
    setIsProcessing(true);
    setMessage("");

    const response = await createTeacherAccount(newTeacherId, newTeacherName, newTeacherPassword);
    
    if (response.success) {
      setIsError(false);
      setMessage("Staff account successfully created.");
      setNewTeacherId("");
      setNewTeacherName("");
      setNewTeacherPassword("");
      refreshData();
    } else {
      setIsError(true);
      setMessage(response.message);
    }
    setIsProcessing(false);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8 h-fit">
        <h2 className="text-xl font-black text-[#011B51] uppercase tracking-tight mb-6">Register Instructor</h2>
        
        <form onSubmit={handleCreateTeacher} className="space-y-4">
          <div>
            <label className="block text-[10px] sm:text-xs font-bold text-[#011B51] uppercase tracking-wide mb-1.5 ml-1">Instructor ID</label>
            <input type="text" required className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none text-sm font-medium focus:bg-white focus:border-[#011B51] focus:ring-2 focus:ring-[#011B51]/20 transition-all" value={newTeacherId} onChange={(e) => setNewTeacherId(e.target.value)} placeholder="e.g. TCH-001" />
          </div>
          <div>
            <label className="block text-[10px] sm:text-xs font-bold text-[#011B51] uppercase tracking-wide mb-1.5 ml-1">Full Name</label>
            <input type="text" required className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none text-sm font-medium focus:bg-white focus:border-[#011B51] focus:ring-2 focus:ring-[#011B51]/20 transition-all" value={newTeacherName} onChange={(e) => setNewTeacherName(e.target.value)} placeholder="Jane Doe" />
          </div>
          <div>
            <label className="block text-[10px] sm:text-xs font-bold text-[#011B51] uppercase tracking-wide mb-1.5 ml-1">Temporary Password</label>
            <input type="password" required className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none text-sm font-medium focus:bg-white focus:border-[#011B51] focus:ring-2 focus:ring-[#011B51]/20 transition-all" value={newTeacherPassword} onChange={(e) => setNewTeacherPassword(e.target.value)} placeholder="••••••••" />
          </div>
          
          <button type="submit" disabled={isProcessing} className="w-full bg-[#011B51] hover:bg-[#022a7a] text-white font-bold py-3.5 rounded-xl mt-6 transition-all shadow-md border-b-4 border-[#A51A21] disabled:opacity-70 text-xs uppercase tracking-wider">
            {isProcessing ? "Processing..." : "Create Account"}
          </button>
        </form>

        {message && (
          <div className={`mt-6 p-4 rounded-xl text-center text-xs font-bold uppercase tracking-wide border-2 ${isError ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
            {message}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <h2 className="text-xl font-black text-[#011B51] uppercase tracking-tight">Active Roster</h2>
        </div>
        <ul className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
          {teachers.map((teacher) => (
            <li key={teacher.id} className="p-5 flex flex-col hover:bg-slate-50 transition-colors">
              <span className="font-bold text-slate-900">{teacher.name}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {teacher.user_id}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}