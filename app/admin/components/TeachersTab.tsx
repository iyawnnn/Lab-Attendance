"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  createTeacherAccount, 
  assignTeacherToMultipleSchedules, 
  removeTeacherFromSchedule,
  deleteTeacherAccount
} from "../../actions";
import { Schedule } from "../types";

interface TeachersTabProps {
  teachers: any[];
  schedules: Schedule[];
  refreshData: () => void;
}

export default function TeachersTab({ teachers = [], schedules = [], refreshData }: TeachersTabProps) {
  // Main View States
  const [teacherSearchQuery, setTeacherSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const teachersPerPage = 9;
  
  // Registration Modal States
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [newTeacherId, setNewTeacherId] = useState("");
  const [newTeacherName, setNewTeacherName] = useState("");
  const [newTeacherPassword, setNewTeacherPassword] = useState("");
  const [scheduleSearchQuery, setScheduleSearchQuery] = useState("");
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  // Manage Modal States
  const [manageTeacher, setManageTeacher] = useState<any>(null);
  const [manageAssignScheduleIds, setManageAssignScheduleIds] = useState<number[]>([]);
  const [manageScheduleSearchQuery, setManageScheduleSearchQuery] = useState("");
  const [isManageProcessing, setIsManageProcessing] = useState(false);
  const [manageMessage, setManageMessage] = useState("");

  // Memoized Filters
  const filteredTeachers = useMemo(() => {
    if (!teacherSearchQuery) return teachers;
    const query = teacherSearchQuery.toLowerCase();
    return teachers.filter(t => 
      t.name.toLowerCase().includes(query) || 
      t.user_id.toLowerCase().includes(query)
    );
  }, [teachers, teacherSearchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [teacherSearchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredTeachers.length / teachersPerPage));
  const paginatedTeachers = filteredTeachers.slice((currentPage - 1) * teachersPerPage, currentPage * teachersPerPage);

  const filteredSchedules = useMemo(() => {
    if (!scheduleSearchQuery) return schedules;
    const query = scheduleSearchQuery.toLowerCase();
    return schedules.filter(sched => 
      sched.course_code.toLowerCase().includes(query) ||
      sched.lab_room.toLowerCase().includes(query) ||
      sched.date.toLowerCase().includes(query)
    );
  }, [schedules, scheduleSearchQuery]);

  // Handlers
  function handleToggleSchedule(id: number) {
    setSelectedScheduleIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  }

  function handleToggleManageSchedule(id: number) {
    setManageAssignScheduleIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  }

  function closeRegisterModal() {
    setIsRegisterModalOpen(false);
    setMessage("");
    setNewTeacherId("");
    setNewTeacherName("");
    setNewTeacherPassword("");
    setSelectedScheduleIds([]);
    setScheduleSearchQuery("");
  }

  async function handleCreateTeacher(e: React.FormEvent) {
    e.preventDefault();
    setIsProcessing(true);
    setMessage("");

    const response = await createTeacherAccount(newTeacherId, newTeacherName, newTeacherPassword);
    
    if (response.success && response.teacherId) {
      if (selectedScheduleIds.length > 0) {
        
        // FIXED: Only passing the 2 required arguments (scheduleIds, teacherId)
        const schedResponse = await assignTeacherToMultipleSchedules(
          selectedScheduleIds,
          response.teacherId
        );

        if (!schedResponse.success) {
          setIsError(true);
          setMessage(`Staff created, but class batch assignment failed: ${schedResponse.message}`);
          setIsProcessing(false);
          return;
        }
      }

      setIsError(false);
      setMessage(selectedScheduleIds.length > 0 ? `Staff account created and ${selectedScheduleIds.length} classes assigned.` : "Staff account successfully created.");
      
      setTimeout(() => {
        closeRegisterModal();
        refreshData();
      }, 1500);

    } else {
      setIsError(true);
      setMessage(response.message || "Failed to create account.");
    }
    setIsProcessing(false);
  }

  // Manage Modal Specific Handlers
  const teacherSchedules = useMemo(() => {
    if (!manageTeacher) return [];
    return schedules.filter(s => s.teacher_id === manageTeacher.id);
  }, [manageTeacher, schedules]);

  const availableSchedules = useMemo(() => {
    if (!manageTeacher) return [];
    return schedules.filter(s => s.teacher_id !== manageTeacher.id);
  }, [manageTeacher, schedules]);

  const filteredAvailableSchedules = useMemo(() => {
    if (!manageScheduleSearchQuery) return availableSchedules;
    const query = manageScheduleSearchQuery.toLowerCase();
    return availableSchedules.filter((sched: any) => 
      sched.course_code.toLowerCase().includes(query) ||
      sched.lab_room.toLowerCase().includes(query) ||
      sched.date.toLowerCase().includes(query)
    );
  }, [availableSchedules, manageScheduleSearchQuery]);

  async function handleAssignNewClassToTeacher() {
    if (manageAssignScheduleIds.length === 0 || !manageTeacher) return;
    setIsManageProcessing(true);
    setManageMessage("");

    // FIXED: Only passing the 2 required arguments (scheduleIds, teacherId)
    const response = await assignTeacherToMultipleSchedules(
      manageAssignScheduleIds, 
      manageTeacher.id
    );

    if (response.success) {
      setManageAssignScheduleIds([]);
      setManageScheduleSearchQuery("");
      refreshData();
    } else {
      setManageMessage(response.message);
    }
    setIsManageProcessing(false);
  }

  async function handleRemoveClassFromTeacher(scheduleId: number) {
    setIsManageProcessing(true);
    setManageMessage("");

    const response = await removeTeacherFromSchedule(scheduleId);
    if (response.success) {
      refreshData();
    } else {
      setManageMessage(response.message);
    }
    setIsManageProcessing(false);
  }

  async function handleDeleteTeacherAccount() {
    if (!manageTeacher) return;
    
    const isConfirmed = confirm(
      `CRITICAL WARNING: Are you sure you want to permanently delete the account for ${manageTeacher.name} (${manageTeacher.user_id})?\n\nAll currently assigned classes will be unassigned.`
    );

    if (!isConfirmed) return;

    setIsManageProcessing(true);
    setManageMessage("");

    const response = await deleteTeacherAccount(manageTeacher.id);
    
    if (response.success) {
      setManageTeacher(null);
      refreshData();
    } else {
      setManageMessage(response.message);
      setIsManageProcessing(false);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex-1 w-full sm:max-w-md relative">
          <input 
            type="text" 
            placeholder="Search directory by name or ID..." 
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-[#011B51] transition-colors"
            value={teacherSearchQuery}
            onChange={(e) => setTeacherSearchQuery(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setIsRegisterModalOpen(true)} 
          className="w-full sm:w-auto bg-[#011B51] hover:bg-[#022a7a] text-white font-bold py-2.5 px-6 rounded-lg text-xs uppercase tracking-wider transition-colors cursor-pointer border-b-2 border-[#A51A21] shadow-sm"
        >
          Register New Instructor
        </button>
      </div>

      {/* Instructor Grid Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {paginatedTeachers.map((teacher) => {
          const assignedCount = schedules.filter(s => s.teacher_id === teacher.id).length;
          const initials = teacher.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

          return (
            <div key={teacher.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-[#011B51]/30 transition-all flex flex-col justify-between h-full">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-[#011B51] text-white flex items-center justify-center font-black text-lg shrink-0 shadow-inner">
                  {initials}
                </div>
                <div className="flex flex-col pt-0.5">
                  <h3 className="text-base font-black text-slate-900 leading-tight tracking-tight">{teacher.name}</h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mt-1">ID: {teacher.user_id}</span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <div className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${assignedCount > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  {assignedCount} Class{assignedCount !== 1 ? 'es' : ''}
                </div>
                <button 
                  onClick={() => { 
                    setManageTeacher(teacher); 
                    setManageAssignScheduleIds([]); 
                    setManageScheduleSearchQuery("");
                  }} 
                  className="text-[10px] font-bold text-[#011B51] uppercase tracking-widest border-2 border-[#011B51]/10 hover:bg-[#011B51] hover:text-white px-4 py-2 rounded-lg transition-all cursor-pointer shadow-sm"
                >
                  Manage Profile
                </button>
              </div>
            </div>
          );
        })}
        {filteredTeachers.length === 0 && (
          <div className="col-span-full p-12 text-center text-xs font-bold text-slate-400 uppercase tracking-widest bg-white rounded-xl border border-slate-200 border-dashed">
            No instructors match your search criteria.
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {filteredTeachers.length > 0 && (
        <div className="flex justify-between px-2 py-4 bg-transparent items-center mt-2">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
            disabled={currentPage === 1} 
            className="px-5 py-2.5 text-[10px] font-bold text-[#011B51] uppercase tracking-widest bg-white border-2 border-slate-200 rounded-lg disabled:opacity-50 cursor-pointer shadow-sm hover:border-[#011B51]/30 transition-colors"
          >
            Previous
          </button>
          <span className="text-xs font-black text-[#011B51] uppercase tracking-widest">
            Page {currentPage} of {totalPages}
          </span>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
            disabled={currentPage === totalPages} 
            className="px-5 py-2.5 text-[10px] font-bold text-[#011B51] uppercase tracking-widest bg-white border-2 border-slate-200 rounded-lg disabled:opacity-50 cursor-pointer shadow-sm hover:border-[#011B51]/30 transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* NEW TWO-COLUMN REGISTRATION MODAL */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 bg-[#011B51]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-8">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden animate-in zoom-in-95 duration-200 border-t-8 border-[#FED702] flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 flex-shrink-0 gap-4">
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Onboarding</h3>
                <h2 className="text-2xl font-black text-[#011B51] uppercase tracking-tight">Register Instructor</h2>
              </div>
              <button onClick={closeRegisterModal} className="text-slate-400 hover:text-[#011B51] font-black text-3xl cursor-pointer transition-colors leading-none">&times;</button>
            </div>
            
            {/* Body */}
            <div className="p-8 overflow-y-auto flex-1 bg-white">
              {message && (
                <div className={`p-4 rounded-xl text-xs font-bold uppercase tracking-wide text-center mb-8 border-2 ${isError ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                  {message}
                </div>
              )}

              <form id="registerForm" onSubmit={handleCreateTeacher} className="grid grid-cols-1 md:grid-cols-2 gap-10">
                
                {/* Column 1: Account Details */}
                <div className="flex flex-col h-full space-y-5">
                  <label className="block text-sm font-black text-[#011B51] uppercase tracking-widest ml-1">Account Details</label>
                  
                  <div>
                    <label className="block text-[10px] sm:text-xs font-bold text-[#011B51] uppercase tracking-wide mb-1.5 ml-1">Instructor ID</label>
                    <input type="text" required className="w-full px-5 py-3.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-sm font-medium focus:bg-white focus:border-[#011B51] focus:ring-2 focus:ring-[#011B51]/20 transition-all shadow-sm" value={newTeacherId} onChange={(e) => setNewTeacherId(e.target.value)} placeholder="e.g. TCH-001" />
                  </div>
                  <div>
                    <label className="block text-[10px] sm:text-xs font-bold text-[#011B51] uppercase tracking-wide mb-1.5 ml-1">Full Name</label>
                    <input type="text" required className="w-full px-5 py-3.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-sm font-medium focus:bg-white focus:border-[#011B51] focus:ring-2 focus:ring-[#011B51]/20 transition-all shadow-sm" value={newTeacherName} onChange={(e) => setNewTeacherName(e.target.value)} placeholder="Jane Doe" />
                  </div>
                  <div>
                    <label className="block text-[10px] sm:text-xs font-bold text-[#011B51] uppercase tracking-wide mb-1.5 ml-1">Initial Password</label>
                    <input type="password" required className="w-full px-5 py-3.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-sm font-medium focus:bg-white focus:border-[#011B51] focus:ring-2 focus:ring-[#011B51]/20 transition-all shadow-sm" value={newTeacherPassword} onChange={(e) => setNewTeacherPassword(e.target.value)} placeholder="••••••••" />
                  </div>
                </div>

                {/* Column 2: Assign Initial Classes */}
                <div className="flex flex-col h-full border-t pt-8 md:pt-0 md:border-t-0 md:border-l md:pl-10 border-slate-200">
                  <label className="block text-sm font-black text-[#011B51] uppercase tracking-widest mb-4 ml-1">Assign Initial Classes <span className="text-slate-400 font-medium">(Optional)</span></label>
                  
                  <div className="flex flex-col gap-4 flex-1">
                    <input 
                      type="text" 
                      placeholder="Search by course code, room, or day..." 
                      className="w-full px-5 py-3.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-sm font-medium focus:bg-white focus:border-[#011B51] focus:ring-2 focus:ring-[#011B51]/20 transition-all shadow-sm"
                      value={scheduleSearchQuery}
                      onChange={(e) => setScheduleSearchQuery(e.target.value)}
                    />

                    <div className="border-2 border-slate-200 rounded-xl overflow-hidden bg-white flex flex-col flex-1 shadow-sm">
                      <div className="px-5 py-3 bg-slate-100 border-b border-slate-200 flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        <span>Database Inventory</span>
                        <span className="bg-[#011B51] text-white px-2 py-0.5 rounded text-[9px]">{selectedScheduleIds.length} Selected</span>
                      </div>
                      
                      <ul className="max-h-72 overflow-y-auto p-3 space-y-2">
                        {filteredSchedules.length === 0 ? (
                          <div className="p-6 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                            No schedules match your search.
                          </div>
                        ) : (
                          filteredSchedules.map((sched: any) => (
                            <li key={sched.id}>
                              <label className={`flex items-start space-x-4 p-3.5 rounded-xl cursor-pointer transition-all ${selectedScheduleIds.includes(sched.id) ? 'bg-[#011B51]/5 border border-[#011B51]/30 shadow-sm' : 'bg-slate-50 hover:bg-slate-100 border border-slate-100'}`}>
                                <div className="relative flex items-center justify-center mt-0.5">
                                  <input
                                    type="checkbox"
                                    checked={selectedScheduleIds.includes(sched.id)}
                                    onChange={() => handleToggleSchedule(sched.id)}
                                    className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded flex-shrink-0 checked:bg-[#011B51] checked:border-[#011B51] transition-all cursor-pointer shadow-sm"
                                  />
                                  <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                                <div className="flex-1">
                                  <div className="flex justify-between items-start">
                                    <span className="text-sm font-black text-slate-900 leading-none uppercase tracking-tight">{sched.course_code}</span>
                                    <span className="text-[9px] font-black text-[#011B51] bg-[#011B51]/10 px-2.5 py-0.5 rounded uppercase tracking-widest">{sched.date}</span>
                                  </div>
                                  <div className="text-[11px] font-bold text-slate-500 mt-1.5 uppercase tracking-widest">Sec {sched.section} | {sched.lab_room}</div>
                                </div>
                              </label>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Fixed Footer Actions */}
            <div className="px-8 py-5 border-t border-slate-200 bg-slate-50 flex justify-end gap-4 flex-shrink-0">
              <button 
                type="button" 
                onClick={closeRegisterModal} 
                className="px-6 py-3 text-xs font-bold text-slate-500 hover:text-[#011B51] uppercase tracking-widest transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                form="registerForm"
                type="submit" 
                disabled={isProcessing} 
                className="px-8 py-3 bg-[#011B51] hover:bg-[#022a7a] text-white font-bold rounded-xl transition-all shadow-md border-b-4 border-[#A51A21] disabled:opacity-50 cursor-pointer text-xs uppercase tracking-widest"
              >
                {isProcessing ? "Processing..." : selectedScheduleIds.length > 0 ? `Create Account & Assign ${selectedScheduleIds.length} Classes` : "Create Account (No Classes)"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MANAGE TEACHER MODAL */}
      {manageTeacher && (
        <div className="fixed inset-0 bg-[#011B51]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-8">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden animate-in zoom-in-95 duration-200 border-t-8 border-[#FED702] flex flex-col max-h-[90vh]">
            
            {/* Modal Header & Danger Zone */}
            <div className="px-8 py-6 border-b border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center bg-slate-50 flex-shrink-0 gap-4">
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Editing Profile For</h3>
                <div className="flex items-end gap-3">
                  <h2 className="text-2xl font-black text-[#011B51] uppercase tracking-tight">{manageTeacher.name}</h2>
                  <span className="mb-1 text-xs font-bold text-[#011B51] bg-[#011B51]/10 px-2 py-1 rounded-md uppercase tracking-widest">ID: {manageTeacher.user_id}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleDeleteTeacherAccount}
                  disabled={isManageProcessing}
                  className="bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 hover:border-transparent font-bold py-2.5 px-6 rounded-xl text-xs uppercase tracking-widest transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  Delete Account
                </button>
                <div className="h-8 w-px bg-slate-300 hidden sm:block"></div>
                <button onClick={() => { setManageTeacher(null); setManageMessage(""); setManageAssignScheduleIds([]); setManageScheduleSearchQuery(""); }} className="text-slate-400 hover:text-[#011B51] font-black text-3xl cursor-pointer transition-colors leading-none">&times;</button>
              </div>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1 bg-white">
              {manageMessage && (
                <div className="p-4 bg-rose-50 text-rose-700 border-2 border-rose-200 rounded-xl text-xs font-bold uppercase tracking-wide text-center mb-8">
                  {manageMessage}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                
                {/* Column 1: Current Classes List */}
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-end mb-4">
                    <label className="block text-sm font-black text-[#011B51] uppercase tracking-widest ml-1">Currently Assigned</label>
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">{teacherSchedules.length} Classes</span>
                  </div>
                  
                  <ul className="space-y-3 overflow-y-auto pr-2 flex-1 max-h-96">
                    {teacherSchedules.length === 0 && (
                      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 h-32">
                        <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">No Active Classes</span>
                      </div>
                    )}
                    {teacherSchedules.map(sched => (
                      <li key={sched.id} className="flex justify-between items-center bg-white border-2 border-slate-100 p-4 rounded-xl transition-all hover:border-slate-300 shadow-sm hover:shadow-md">
                        <div>
                          <div className="text-sm font-black text-slate-900 uppercase tracking-tight">{sched.course_code} <span className="text-slate-400 font-medium">| Sec {sched.section}</span></div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{sched.date} — {sched.lab_room}</div>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveClassFromTeacher(sched.id)} 
                          disabled={isManageProcessing}
                          className="text-rose-500 hover:text-white bg-rose-50 hover:bg-rose-500 border border-rose-200 hover:border-transparent px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Column 2: Add New Class Form (Batch Select) */}
                <div className="flex flex-col h-full border-t pt-8 md:pt-0 md:border-t-0 md:border-l md:pl-10 border-slate-200">
                  <label className="block text-sm font-black text-[#011B51] uppercase tracking-widest mb-4 ml-1">Assign Additional Classes</label>
                  
                  <div className="flex flex-col gap-4 flex-1">
                    <input 
                      type="text" 
                      placeholder="Search by course code, room, or day..." 
                      className="w-full px-5 py-3.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-sm font-medium focus:bg-white focus:border-[#011B51] focus:ring-2 focus:ring-[#011B51]/20 transition-all shadow-sm"
                      value={manageScheduleSearchQuery}
                      onChange={(e) => setManageScheduleSearchQuery(e.target.value)}
                    />

                    <div className="border-2 border-slate-200 rounded-xl overflow-hidden bg-white flex flex-col flex-1 shadow-sm">
                      <div className="px-5 py-3 bg-slate-100 border-b border-slate-200 flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        <span>Database Inventory</span>
                        <span className="bg-[#011B51] text-white px-2 py-0.5 rounded text-[9px]">{manageAssignScheduleIds.length} Selected</span>
                      </div>
                      
                      <ul className="max-h-72 overflow-y-auto p-3 space-y-2">
                        {filteredAvailableSchedules.length === 0 ? (
                          <div className="p-6 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                            No schedules match your search.
                          </div>
                        ) : (
                          filteredAvailableSchedules.map((sched: any) => (
                            <li key={sched.id}>
                              <label className={`flex items-start space-x-4 p-3.5 rounded-xl cursor-pointer transition-all ${manageAssignScheduleIds.includes(sched.id) ? 'bg-[#011B51]/5 border border-[#011B51]/30 shadow-sm' : 'bg-slate-50 hover:bg-slate-100 border border-slate-100'}`}>
                                <div className="relative flex items-center justify-center mt-0.5">
                                  <input
                                    type="checkbox"
                                    checked={manageAssignScheduleIds.includes(sched.id)}
                                    onChange={() => handleToggleManageSchedule(sched.id)}
                                    className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded flex-shrink-0 checked:bg-[#011B51] checked:border-[#011B51] transition-all cursor-pointer shadow-sm"
                                  />
                                  <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                                <div className="flex-1">
                                  <div className="flex justify-between items-start">
                                    <span className="text-sm font-black text-slate-900 leading-none uppercase tracking-tight">{sched.course_code}</span>
                                    <span className="text-[9px] font-black text-[#011B51] bg-[#011B51]/10 px-2.5 py-0.5 rounded uppercase tracking-widest">{sched.date}</span>
                                  </div>
                                  <div className="text-[11px] font-bold text-slate-500 mt-1.5 uppercase tracking-widest">Sec {sched.section} | {sched.lab_room}</div>
                                </div>
                              </label>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>

                    <button 
                      type="button" 
                      onClick={handleAssignNewClassToTeacher} 
                      disabled={isManageProcessing || manageAssignScheduleIds.length === 0} 
                      className="w-full px-6 py-4 mt-2 bg-[#011B51] hover:bg-[#022a7a] text-white font-bold rounded-xl transition-all shadow-md border-b-4 border-[#A51A21] disabled:opacity-50 cursor-pointer text-xs uppercase tracking-widest"
                    >
                      {isManageProcessing ? "Assigning..." : manageAssignScheduleIds.length > 0 ? `Link ${manageAssignScheduleIds.length} Selected Classes` : "Select Classes to Link"}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}