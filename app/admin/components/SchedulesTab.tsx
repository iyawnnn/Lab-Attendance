"use client";

import { useState, useMemo, useEffect } from "react";
import { FaEdit, FaTrash, FaDoorOpen, FaUserTie } from "react-icons/fa";
import { createSchedule, updateSchedule, deleteSchedule, assignTeacherToSchedule } from "../../actions";
import { Schedule } from "../types";

interface SchedulesTabProps {
  schedules: Schedule[];
  teachers: any[];
  refreshData: () => void;
}

const dayOrder: Record<string, number> = {
  "Monday": 1,
  "Tuesday": 2,
  "Wednesday": 3,
  "Thursday": 4,
  "Friday": 5,
  "Saturday": 6,
  "Sunday": 7
};

function parseStartTime(timeStr: string) {
  if (!timeStr) return 0;
  const [start] = timeStr.split(/\s*-\s*/);
  if (!start) return 0;
  const match = start.trim().match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 0;
  
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const modifier = match[3].toUpperCase();
  
  if (hours === 12) {
    hours = modifier === "AM" ? 0 : 12;
  } else if (modifier === "PM") {
    hours += 12;
  }
  
  return hours * 60 + minutes;
}

export default function SchedulesTab({ schedules = [], teachers = [], refreshData }: SchedulesTabProps) {
  // Filtering & Pagination State
  const [searchTerm, setSearchTerm] = useState("");
  const [dayFilter, setDayFilter] = useState("");
  const [roomFilter, setRoomFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const schedulesPerPage = 6;

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    lab_room: "",
    date: "Monday",
    schedule: "",
    course_code: "",
    section: "",
  });

  const [assignScheduleId, setAssignScheduleId] = useState<number | null>(null);
  const [assignTeacherId, setAssignTeacherId] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  const uniqueDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const uniqueRooms = Array.from(new Set(schedules.map(s => s.lab_room))).sort();
  const uniqueSections = Array.from(new Set(schedules.map(s => s.section))).sort();

  // Reset to page 1 when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dayFilter, roomFilter, sectionFilter]);

  // Combine Filtering and Sorting
  const filteredAndSortedSchedules = useMemo(() => {
    let result = schedules.filter((sched: any) => {
      const searchLower = searchTerm.toLowerCase();
      const courseMatch = sched.course_code.toLowerCase().includes(searchLower);
      const roomMatch = sched.lab_room.toLowerCase().includes(searchLower);
      const teacherMatch = sched.teacher?.name?.toLowerCase().includes(searchLower);
      
      const matchesSearch = courseMatch || roomMatch || teacherMatch;
      const matchesDay = dayFilter === "" || sched.date === dayFilter;
      const matchesRoom = roomFilter === "" || sched.lab_room === roomFilter;
      const matchesSection = sectionFilter === "" || sched.section === sectionFilter;
      
      return matchesSearch && matchesDay && matchesRoom && matchesSection;
    });

    // Sort Chronologically: Day -> Time
    result.sort((a, b) => {
      const dayDiff = (dayOrder[a.date] || 99) - (dayOrder[b.date] || 99);
      if (dayDiff !== 0) return dayDiff;
      
      return parseStartTime(a.schedule) - parseStartTime(b.schedule);
    });

    return result;
  }, [schedules, searchTerm, dayFilter, roomFilter, sectionFilter]);

  // Pagination Calculation
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedSchedules.length / schedulesPerPage));
  const paginatedSchedules = filteredAndSortedSchedules.slice(
    (currentPage - 1) * schedulesPerPage, 
    currentPage * schedulesPerPage
  );

  function openCreateModal() {
    setEditingId(null);
    setFormData({
      lab_room: uniqueRooms[0] || "P312 - Computer Lab 6",
      date: "Monday",
      schedule: "",
      course_code: "",
      section: "",
    });
    setIsModalOpen(true);
  }

  function openEditModal(sched: any) {
    setEditingId(sched.id);
    setFormData({
      lab_room: sched.lab_room,
      date: sched.date,
      schedule: sched.schedule,
      course_code: sched.course_code,
      section: sched.section,
    });
    setIsModalOpen(true);
  }

  function openAssignModal(sched: any) {
    setAssignScheduleId(sched.id);
    setAssignTeacherId(sched.teacher_id ? sched.teacher_id.toString() : "");
    setIsAssignModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsProcessing(true);

    if (editingId) {
      await updateSchedule(editingId, formData);
    } else {
      await createSchedule(formData);
    }

    setIsModalOpen(false);
    setIsProcessing(false);
    refreshData();
  }

  async function handleDelete(id: number) {
    if (confirm("Are you sure you want to delete this schedule? This action cannot be undone.")) {
      setIsProcessing(true);
      await deleteSchedule(id);
      setIsProcessing(false);
      refreshData();
    }
  }

  async function handleAssignTeacher(e: React.FormEvent) {
    e.preventDefault();
    if (!assignScheduleId || !assignTeacherId) return;

    setIsProcessing(true);
    await assignTeacherToSchedule(assignScheduleId, Number(assignTeacherId));
    
    setIsAssignModalOpen(false);
    setIsProcessing(false);
    refreshData();
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Advanced Control Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full flex-1">
          <input 
            type="text" 
            placeholder="Search course or instructor..." 
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-[#011B51] transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select 
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none cursor-pointer focus:border-[#011B51] transition-colors"
            value={dayFilter}
            onChange={(e) => setDayFilter(e.target.value)}
          >
            <option value="">All Days</option>
            {uniqueDays.map(day => <option key={day} value={day}>{day}</option>)}
          </select>
          <select 
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none cursor-pointer focus:border-[#011B51] transition-colors"
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
          >
            <option value="">All Rooms</option>
            {uniqueRooms.map(room => <option key={room as string} value={room as string}>{room}</option>)}
          </select>
          <select 
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none cursor-pointer focus:border-[#011B51] transition-colors"
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
          >
            <option value="">All Sections</option>
            {uniqueSections.map(section => <option key={section as string} value={section as string}>{section}</option>)}
          </select>
        </div>

        <div className="flex items-center w-full lg:w-auto shrink-0 mt-4 lg:mt-0">
          <button 
            onClick={openCreateModal} 
            className="w-full bg-[#011B51] hover:bg-[#022a7a] text-white font-bold py-2.5 px-6 rounded-lg text-xs uppercase tracking-wider transition-colors cursor-pointer border-b-2 border-[#A51A21] shadow-sm"
          >
            Add Schedule
          </button>
        </div>
      </div>

      {/* Static Grid View (No Hover Actions) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {paginatedSchedules.map((sched: any) => (
          <div key={sched.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <span className="bg-[#011B51]/10 text-[#011B51] text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest">{sched.date}</span>
              <span className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">{sched.schedule}</span>
            </div>
            
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-1">{sched.course_code}</h3>
            <p className="text-sm font-bold text-[#A51A21] mb-4">Section {sched.section}</p>
            
            <div className="space-y-2 mb-6 flex-1">
              <div className="flex items-center text-xs font-medium text-slate-600 gap-3 bg-slate-50 p-2.5 rounded-lg">
                <FaDoorOpen className="text-[#011B51] text-base shrink-0" />
                <span className="truncate">{sched.lab_room}</span>
              </div>
              <div className={`flex items-center justify-between text-xs font-medium p-2.5 rounded-lg border ${sched.teacher ? 'bg-slate-50 border-transparent text-slate-600' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                <div className="flex items-center gap-3 truncate">
                  <FaUserTie className={sched.teacher ? "text-[#011B51] text-base shrink-0" : "text-amber-600 text-base shrink-0"} />
                  <span className={`truncate ${sched.teacher ? "font-bold text-slate-700" : "font-bold italic"}`}>
                    {sched.teacher ? sched.teacher.name : "Unassigned"}
                  </span>
                </div>
                <button onClick={() => openAssignModal(sched)} className="text-[10px] font-black uppercase tracking-widest text-[#011B51] hover:underline cursor-pointer ml-2 shrink-0">
                  {sched.teacher ? "Change" : "Assign"}
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
              <button onClick={() => openEditModal(sched)} className="px-3 py-2 text-slate-500 hover:text-[#011B51] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer flex items-center gap-2 text-xs font-bold uppercase tracking-widest border border-slate-200">
                <FaEdit /> Edit
              </button>
              <button onClick={() => handleDelete(sched.id)} disabled={isProcessing} className="px-3 py-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2 text-xs font-bold uppercase tracking-widest border border-slate-200">
                <FaTrash /> Delete
              </button>
            </div>
          </div>
        ))}
        {filteredAndSortedSchedules.length === 0 && (
          <div className="col-span-full p-12 text-center text-xs font-bold text-slate-400 uppercase tracking-widest bg-white rounded-xl border border-slate-200 border-dashed">
            No schedules found matching your filters.
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {filteredAndSortedSchedules.length > 0 && (
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

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#011B51]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border-t-8 border-[#FED702]">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-black text-[#011B51] uppercase tracking-tight">
                {editingId ? "Edit Schedule" : "Add Schedule"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-[#011B51] font-black text-2xl cursor-pointer">&times;</button>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#011B51] uppercase tracking-widest mb-1.5 ml-1">Laboratory Room</label>
                  <input type="text" required className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none text-sm font-medium focus:bg-white focus:border-[#011B51] focus:ring-2 focus:ring-[#011B51]/20 transition-all" value={formData.lab_room} onChange={(e) => setFormData({ ...formData, lab_room: e.target.value })} placeholder="e.g. C301 - CISCO LAB1" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#011B51] uppercase tracking-widest mb-1.5 ml-1">Day of Week</label>
                    <select className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none text-sm font-medium focus:bg-white focus:border-[#011B51] focus:ring-2 focus:ring-[#011B51]/20 transition-all cursor-pointer" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })}>
                      {uniqueDays.map(day => <option key={day} value={day}>{day}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#011B51] uppercase tracking-widest mb-1.5 ml-1">Time Schedule</label>
                    <input type="text" required className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none text-sm font-medium focus:bg-white focus:border-[#011B51] focus:ring-2 focus:ring-[#011B51]/20 transition-all" value={formData.schedule} onChange={(e) => setFormData({ ...formData, schedule: e.target.value })} placeholder="e.g. 9:30AM - 11:30AM" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#011B51] uppercase tracking-widest mb-1.5 ml-1">Course Code</label>
                    <input type="text" required className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none text-sm font-medium focus:bg-white focus:border-[#011B51] focus:ring-2 focus:ring-[#011B51]/20 transition-all uppercase" value={formData.course_code} onChange={(e) => setFormData({ ...formData, course_code: e.target.value })} placeholder="e.g. C-PCEITEL2" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#011B51] uppercase tracking-widest mb-1.5 ml-1">Section</label>
                    <input type="text" required className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none text-sm font-medium focus:bg-white focus:border-[#011B51] focus:ring-2 focus:ring-[#011B51]/20 transition-all uppercase" value={formData.section} onChange={(e) => setFormData({ ...formData, section: e.target.value })} placeholder="e.g. IT 3A" />
                  </div>
                </div>

                <div className="pt-4 mt-2">
                  <button type="submit" disabled={isProcessing} className="w-full bg-[#011B51] hover:bg-[#022a7a] text-white font-bold py-3.5 rounded-xl transition-all shadow-md border-b-4 border-[#A51A21] disabled:opacity-70 text-xs uppercase tracking-wider cursor-pointer">
                    {isProcessing ? "Saving..." : editingId ? "Save Changes" : "Create Schedule"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Assign Instructor Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-[#011B51]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border-t-8 border-[#A51A21]">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Staff Management</h3>
                <h2 className="text-xl font-black text-[#011B51] uppercase tracking-tight">Assign Instructor</h2>
              </div>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-slate-400 hover:text-[#011B51] font-black text-2xl cursor-pointer">&times;</button>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleAssignTeacher} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-[#011B51] uppercase tracking-widest mb-2 ml-1">Select Active Instructor</label>
                  <select 
                    required 
                    className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-sm font-medium focus:bg-white focus:border-[#011B51] focus:ring-2 focus:ring-[#011B51]/20 transition-all cursor-pointer appearance-none" 
                    value={assignTeacherId} 
                    onChange={(e) => setAssignTeacherId(e.target.value)}
                  >
                    <option value="" disabled>Choose from active roster...</option>
                    {teachers.map(teacher => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name} (ID: {teacher.user_id})
                      </option>
                    ))}
                  </select>
                </div>

                <button type="submit" disabled={isProcessing || !assignTeacherId} className="w-full bg-[#A51A21] hover:bg-[#851319] text-white font-bold py-3.5 rounded-xl transition-all shadow-md border-b-4 border-[#011B51] disabled:opacity-70 text-xs uppercase tracking-wider cursor-pointer">
                  {isProcessing ? "Processing..." : "Confirm Assignment"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}