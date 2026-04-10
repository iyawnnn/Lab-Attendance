"use client";

import { useState, useMemo } from "react";

interface Schedule {
  id: number | string;
  course_code: string;
  section: string;
  lab_room: string;
  schedule: string;
  date: string;
}

interface SchedulesTabProps {
  schedules: Schedule[];
}

const ITEMS_PER_PAGE = 9;

export default function SchedulesTab({ schedules = [] }: SchedulesTabProps) {
  const [dayFilter, setDayFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  const uniqueDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const filteredSchedules = useMemo(() => {
    return schedules.filter(sched => {
      const matchDay = dayFilter === "" || sched.date === dayFilter;
      
      const searchLower = searchQuery.toLowerCase();
      const matchSearch = searchQuery === "" || 
        sched.course_code.toLowerCase().includes(searchLower) ||
        sched.section.toLowerCase().includes(searchLower) ||
        sched.lab_room.toLowerCase().includes(searchLower);

      return matchDay && matchSearch;
    });
  }, [schedules, dayFilter, searchQuery]);

  useMemo(() => {
    setCurrentPage(1);
  }, [dayFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredSchedules.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedSchedules = filteredSchedules.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <input 
            type="text"
            placeholder="Search course, section, or room..."
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:border-[#011B51] transition-colors w-full sm:w-64 font-medium text-[#011B51]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select 
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none cursor-pointer font-medium text-[#011B51]" 
            value={dayFilter} 
            onChange={(e) => setDayFilter(e.target.value)}
          >
            <option value="">All Days</option>
            {uniqueDays.map(day => <option key={day} value={day}>{day}</option>)}
          </select>
        </div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-md whitespace-nowrap">
          {filteredSchedules.length} {filteredSchedules.length === 1 ? 'Class' : 'Classes'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedSchedules.map((sched) => (
          <div key={sched.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-[#011B51]/30 transition-all">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="bg-[#011B51]/10 text-[#011B51] text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">{sched.date}</span>
                <span className="text-xs font-bold text-slate-400">{sched.schedule}</span>
              </div>
              <h3 className="text-lg font-black text-[#011B51] uppercase tracking-tight">{sched.course_code}</h3>
              <p className="text-sm font-bold text-slate-500 mb-5">Section {sched.section}</p>
              <div className="pt-4 border-t border-slate-100 flex flex-col space-y-2 text-xs mb-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-400 uppercase">Facility</span>
                  <span className="text-[#011B51] font-black truncate ml-2" title={sched.lab_room}>{sched.lab_room}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        {paginatedSchedules.length === 0 && (
          <div className="col-span-full p-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest bg-white rounded-xl border border-slate-200">
            No schedules match your filters.
          </div>
        )}
      </div>

      {filteredSchedules.length > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-slate-50 text-[#011B51] hover:bg-slate-100 border border-slate-200"
          >
            Previous
          </button>
          
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-slate-50 text-[#011B51] hover:bg-slate-100 border border-slate-200"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}