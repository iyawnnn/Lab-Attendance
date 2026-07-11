"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";
import { AttendanceLog, Schedule } from "../types";

// --- CUSTOM UI COMPONENT: Filter Dropdown ---
function FilterDropdown({ 
  options, 
  value, 
  onChange, 
  placeholder, 
  allowClear = false,
  clearText = "Clear selection",
  showSearch = true
}: { 
  options: { id: string; label: string }[]; 
  value: string; 
  onChange: (val: string) => void; 
  placeholder: string;
  allowClear?: boolean;
  clearText?: string;
  showSearch?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    if (!showSearch) return options;
    return options.filter(opt => 
      opt.label.toLowerCase().includes(query.toLowerCase())
    );
  }, [options, query, showSearch]);

  const selectedOption = options.find(opt => opt.id === value);

  return (
    <div ref={dropdownRef} className="relative w-full">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2.5 bg-slate-50 hover:bg-slate-100 border transition-all rounded-md text-sm cursor-pointer flex justify-between items-center shadow-sm ${isOpen ? 'border-slate-500 ring-2 ring-slate-500/10' : 'border-slate-200'}`}
      >
        <span className={`truncate mr-2 ${selectedOption ? "text-slate-900 font-bold" : "text-slate-500 font-medium"}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200 rounded-lg shadow-xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {showSearch && (
            <div className="p-2.5 border-b border-slate-100 flex items-center gap-2 bg-slate-50/80">
              <Search size={14} className="text-slate-400 shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Search..."
                className="w-full bg-transparent outline-none text-sm text-slate-700 font-medium placeholder:text-slate-400"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
          )}
          <div className="overflow-y-auto max-h-[200px] flex-1 p-1.5 custom-scrollbar">
            {allowClear && (
               <div
                 onClick={() => {
                   onChange("");
                   setIsOpen(false);
                   setQuery("");
                 }}
                 className="px-3 py-2.5 mb-1 text-sm rounded-md cursor-pointer flex items-center gap-2 text-slate-500 hover:bg-slate-100 transition-colors"
               >
                 <X size={14} />
                 <span className="italic">{clearText}</span>
               </div>
            )}
            
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-xs font-bold uppercase tracking-widest text-slate-400 text-center">No matches found</div>
            ) : (
              filteredOptions.map(opt => (
                <div
                  key={opt.id}
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                    setQuery("");
                  }}
                  className={`px-3 py-2.5 text-sm rounded-md cursor-pointer flex items-center justify-between transition-colors ${
                    value === opt.id 
                      ? 'bg-slate-100 text-slate-900 font-bold' 
                      : 'hover:bg-slate-50 text-slate-700 font-medium'
                  }`}
                >
                  <span className="truncate pr-4">{opt.label}</span>
                  {value === opt.id && <Check size={14} className="text-slate-900 shrink-0" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
// --------------------------------------------------------

export default function AttendanceTab({ logs, schedules }: { logs: AttendanceLog[], schedules: Schedule[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [roomFilter, setRoomFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, dateFilter, courseFilter, sectionFilter, roomFilter, statusFilter]);

  const courseOptions = useMemo(() => {
    const unique = Array.from(new Set(schedules.map(s => s.course_code))).filter(Boolean).sort();
    return unique.map(c => ({ id: c, label: c }));
  }, [schedules]);

  const sectionOptions = useMemo(() => {
    const unique = Array.from(new Set(schedules.map(s => s.section))).filter(Boolean).sort();
    return unique.map(s => ({ id: s, label: `Section ${s}` }));
  }, [schedules]);

  const roomOptions = useMemo(() => {
    const unique = Array.from(new Set(schedules.map(s => s.lab_room))).filter(Boolean).sort();
    return unique.map(r => ({ id: r, label: r }));
  }, [schedules]);

  const statusOptions = [
    { id: "ON_TIME", label: "On Time" },
    { id: "LATE", label: "Late" }
  ];

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const logDateObj = new Date(log.timestamp);
      const logDateString = logDateObj.toLocaleDateString('en-CA'); 

      const matchesSearch = log.student.student_id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            log.student.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            log.student.last_name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDate = dateFilter === "" || logDateString === dateFilter;
      const matchesCourse = courseFilter === "" || log.schedule.course_code === courseFilter;
      const matchesSection = sectionFilter === "" || log.schedule.section === sectionFilter;
      const matchesRoom = roomFilter === "" || log.schedule.lab_room === roomFilter;
      const matchesStatus = statusFilter === "" || log.status === statusFilter;
      
      return matchesSearch && matchesDate && matchesCourse && matchesSection && matchesRoom && matchesStatus;
    });
  }, [logs, searchQuery, dateFilter, courseFilter, sectionFilter, roomFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage));
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage]);

  function downloadCSV() {
    const headers = ["Date", "Time", "Status", "Student ID", "First Name", "Last Name", "Course", "Section", "Lab Room", "Entry Method"];
    const rows = filteredLogs.map(log => {
      const dateObj = new Date(log.timestamp);
      const isManual = log.signature && log.signature.includes("OVERRIDE");
      return [
        dateObj.toLocaleDateString(),
        dateObj.toLocaleTimeString(),
        log.status,
        log.student.student_id,
        log.student.first_name,
        log.student.last_name,
        log.schedule.course_code,
        log.schedule.section,
        log.schedule.lab_room,
        isManual ? "Manual Override" : "Device Verified"
      ];
    });

    const csvContent = [headers.join(","), ...rows.map(row => row.map(val => `"${val}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `Attendance_Export_${dateFilter || 'All_Dates'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 relative z-0">
      
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Record Filters</h2>
            <p className="text-sm text-slate-500 mt-0.5">Showing {filteredLogs.length} matching records</p>
          </div>
          <button onClick={downloadCSV} className="bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 px-5 rounded-md text-sm transition-colors shadow-sm cursor-pointer">
            Export Data (CSV)
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="flex flex-col">
            <label className="text-xs font-bold text-slate-500 uppercase mb-1">Search User</label>
            <input 
              type="text" 
              placeholder="ID or Name..." 
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:border-slate-500 transition-colors shadow-sm" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>
          
          <div className="flex flex-col">
            <label className="text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
            <input 
              type="date" 
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:border-slate-500 text-slate-700 transition-colors cursor-pointer shadow-sm" 
              value={dateFilter} 
              onChange={(e) => setDateFilter(e.target.value)} 
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold text-slate-500 uppercase mb-1">Course Code</label>
            <FilterDropdown
              options={courseOptions}
              value={courseFilter}
              onChange={setCourseFilter}
              placeholder="All Courses"
              allowClear={true}
              clearText="Show All Courses"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold text-slate-500 uppercase mb-1">Section</label>
            <FilterDropdown
              options={sectionOptions}
              value={sectionFilter}
              onChange={setSectionFilter}
              placeholder="All Sections"
              allowClear={true}
              clearText="Show All Sections"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold text-slate-500 uppercase mb-1">Facility / Room</label>
            <FilterDropdown
              options={roomOptions}
              value={roomFilter}
              onChange={setRoomFilter}
              placeholder="All Facilities"
              allowClear={true}
              clearText="Show All Facilities"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
            <FilterDropdown
              options={statusOptions}
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="All Statuses"
              allowClear={true}
              clearText="Show All Statuses"
              showSearch={false}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col relative z-0">
        <div className="custom-scrollbar overflow-x-auto overflow-y-auto max-h-[600px] rounded-t-xl">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider shadow-sm border-b border-slate-200">
                <th className="p-4 font-semibold">Date & Time</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Student Identity</th>
                <th className="p-4 font-semibold">Course Information</th>
                <th className="p-4 font-semibold">Facility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
              {paginatedLogs.map((log) => {
                const isManual = log.signature && log.signature.includes("OVERRIDE");
                
                return (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-slate-900">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="p-4">
                      <div className="flex flex-col items-start gap-1">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${log.status === 'LATE' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'}`}>
                          {log.status.replace("_", " ")}
                        </span>
                        {isManual && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-200">
                            Manual Override
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{log.student.first_name} {log.student.last_name}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{log.student.student_id}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900 uppercase tracking-tight">{log.schedule.course_code}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Section {log.schedule.section}</div>
                    </td>
                    <td className="p-4 font-medium text-slate-600">{log.schedule.lab_room}</td>
                  </tr>
                );
              })}
              {paginatedLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                        No records found matching filters
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {filteredLogs.length > 0 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl z-10">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
              disabled={currentPage === 1} 
              className="px-4 py-2 text-[10px] font-bold text-slate-700 uppercase tracking-widest bg-white border border-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-100 transition-colors cursor-pointer shadow-sm"
            >
              Previous
            </button>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">
              Page <span className="text-slate-900 font-black">{currentPage}</span> of <span className="text-slate-900 font-black">{totalPages}</span>
            </span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
              disabled={currentPage === totalPages} 
              className="px-4 py-2 text-[10px] font-bold text-slate-700 uppercase tracking-widest bg-white border border-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-100 transition-colors cursor-pointer shadow-sm"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}