"use client";

import { useState } from "react";

interface SchedulesTabProps {
  schedules: any[];
}

export default function SchedulesTab({ schedules = [] }: SchedulesTabProps) {
  const [dayFilter, setDayFilter] = useState("");
  
  const uniqueDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const filteredSchedules = schedules.filter(sched => {
    return dayFilter === "" || sched.date === dayFilter;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <select 
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none cursor-pointer font-medium text-[#011B51]" 
          value={dayFilter} 
          onChange={(e) => setDayFilter(e.target.value)}
        >
          <option value="">All Days</option>
          {uniqueDays.map(day => <option key={day} value={day}>{day}</option>)}
        </select>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-md">
          {schedules.length} Assigned Classes
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSchedules.map((sched: any) => (
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
                  <span className="text-[#011B51] font-black">{sched.lab_room}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filteredSchedules.length === 0 && (
          <div className="col-span-full p-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest bg-white rounded-xl border border-slate-200">
            No schedules found for this selection.
          </div>
        )}
      </div>
    </div>
  );
}