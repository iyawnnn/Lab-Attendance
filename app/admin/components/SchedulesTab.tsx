"use client";

import { useState, useEffect } from "react";
import { Schedule } from "../types";
import { createSchedule, updateSchedule, deleteSchedule } from "../../actions";

interface SchedulesTabProps {
  schedules: Schedule[];
  refreshData?: () => void;
}

export default function SchedulesTab({ schedules, refreshData }: SchedulesTabProps) {
  const [dayFilter, setDayFilter] = useState("");
  const [roomFilter, setRoomFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Modal and Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    lab_room: "",
    date: "Monday",
    schedule: "",
    course_code: "",
    section: "",
    professor_name: ""
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [dayFilter, roomFilter]);

  const uniqueRooms = Array.from(new Set(schedules.map(s => s.lab_room)));
  const uniqueDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const filteredSchedules = schedules.filter(sched => {
    const matchesRoom = roomFilter === "" || sched.lab_room === roomFilter;
    const matchesDay = dayFilter === "" || sched.date === dayFilter;
    return matchesRoom && matchesDay;
  });

  const totalPages = Math.max(1, Math.ceil(filteredSchedules.length / itemsPerPage));
  const paginatedSchedules = filteredSchedules.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Form Handlers
  function openAddModal() {
    setModalMode("add");
    setEditingId(null);
    setFormData({
      lab_room: "",
      date: "Monday",
      schedule: "",
      course_code: "",
      section: "",
      professor_name: ""
    });
    setIsModalOpen(true);
  }

  function openEditModal(sched: Schedule) {
    setModalMode("edit");
    setEditingId(sched.id);
    setFormData({
      lab_room: sched.lab_room,
      date: sched.date,
      schedule: sched.schedule,
      course_code: sched.course_code,
      section: sched.section,
      professor_name: sched.professor_name
    });
    setIsModalOpen(true);
  }

  async function handleDelete(id: number) {
    if (confirm("Are you sure you want to delete this class schedule?")) {
      setIsSubmitting(true);
      const response = await deleteSchedule(id);
      if (response.success) {
        if (refreshData) refreshData();
      } else {
        alert(response.message);
      }
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    let response;
    if (modalMode === "add") {
      response = await createSchedule(formData);
    } else if (modalMode === "edit" && editingId !== null) {
      response = await updateSchedule(editingId, formData);
    }

    if (response?.success) {
      setIsModalOpen(false);
      if (refreshData) refreshData();
    } else {
      alert(response?.message || "An error occurred.");
    }
    
    setIsSubmitting(false);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4">
          <select className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none cursor-pointer" value={dayFilter} onChange={(e) => setDayFilter(e.target.value)}>
            <option value="">All Days</option>
            {uniqueDays.map(day => <option key={day} value={day}>{day}</option>)}
          </select>
          <select className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none cursor-pointer" value={roomFilter} onChange={(e) => setRoomFilter(e.target.value)}>
            <option value="">All Facilities</option>
            {uniqueRooms.map(room => <option key={room} value={room}>{room}</option>)}
          </select>
        </div>
        <button onClick={openAddModal} className="bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 px-5 rounded-md text-sm transition-colors cursor-pointer">
          Add New Schedule
        </button>
      </div>

      {/* Schedule Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedSchedules.map((sched) => (
          <div key={sched.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-md">{sched.date}</span>
                <span className="text-sm font-medium text-slate-500">{sched.schedule}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">{sched.course_code}</h3>
              <p className="text-sm text-slate-500 mb-5">Section: {sched.section}</p>
              <div className="pt-4 border-t border-slate-100 flex flex-col space-y-2 text-sm mb-6">
                <div className="flex justify-between items-center"><span className="text-slate-500">Facility:</span><span className="text-slate-900 font-medium">{sched.lab_room}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-500">Instructor:</span><span className="text-slate-900 font-medium">{sched.professor_name}</span></div>
              </div>
            </div>
            <div className="flex gap-3 border-t border-slate-100 pt-4">
              <button onClick={() => openEditModal(sched)} className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium py-2 rounded-md text-xs transition-colors cursor-pointer">
                Edit Details
              </button>
              <button onClick={() => handleDelete(sched.id)} disabled={isSubmitting} className="flex-1 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 font-medium py-2 rounded-md text-xs transition-colors disabled:opacity-50 cursor-pointer">
                Remove
              </button>
            </div>
          </div>
        ))}
        {paginatedSchedules.length === 0 && (<div className="col-span-full p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200">No schedules match your filters.</div>)}
      </div>
      
      {filteredSchedules.length > 0 && (
        <div className="flex justify-between px-6 py-4 bg-transparent">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md disabled:opacity-50 cursor-pointer">Previous</button>
          <span className="text-sm text-slate-700 self-center">Page <span className="font-semibold">{currentPage}</span> of {totalPages}</span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md disabled:opacity-50 cursor-pointer">Next</button>
        </div>
      )}

      {/* Data Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900">{modalMode === "add" ? "Create New Schedule" : "Edit Class Details"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold text-xl cursor-pointer">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Course Code</label>
                  <input type="text" placeholder="e.g. IT 301" required value={formData.course_code} onChange={e => setFormData({...formData, course_code: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm outline-none focus:border-slate-800" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Section</label>
                  <input type="text" placeholder="e.g. IT 3A" required value={formData.section} onChange={e => setFormData({...formData, section: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm outline-none focus:border-slate-800" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Day of Week</label>
                  <select required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm outline-none focus:border-slate-800 cursor-pointer">
                    {uniqueDays.map(day => <option key={day} value={day}>{day}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Time Range</label>
                  <input type="text" placeholder="07:30 AM - 10:30 AM" required value={formData.schedule} onChange={e => setFormData({...formData, schedule: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm outline-none focus:border-slate-800" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Facility / Room</label>
                <input type="text" placeholder="e.g. P311 - COMPUTER LAB 5" required value={formData.lab_room} onChange={e => setFormData({...formData, lab_room: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm outline-none focus:border-slate-800" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Instructor Name</label>
                <input type="text" placeholder="Full Name" required value={formData.professor_name} onChange={e => setFormData({...formData, professor_name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm outline-none focus:border-slate-800" />
              </div>
              
              <div className="pt-4 mt-6 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors disabled:opacity-50 cursor-pointer">
                  {isSubmitting ? "Saving..." : "Save Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}