"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";

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
        className={`w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border transition-all rounded-lg text-sm cursor-pointer flex justify-between items-center shadow-sm ${isOpen ? 'border-[#011B51] ring-2 ring-[#011B51]/10' : 'border-slate-200'}`}
      >
        <span className={`truncate mr-2 ${selectedOption ? "text-[#011B51] font-bold" : "text-slate-500 font-medium"}`}>
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
            {allowClear && value && (
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
                      ? 'bg-[#011B51]/5 text-[#011B51] font-bold' 
                      : 'hover:bg-slate-50 text-slate-700 font-medium'
                  }`}
                >
                  <span className="truncate pr-4">{opt.label}</span>
                  {value === opt.id && <Check size={14} className="text-[#011B51] shrink-0" />}
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
  const [roomFilter, setRoomFilter] = useState<string>("");
  const [sectionFilter, setSectionFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  const uniqueDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
  const dayOptions = uniqueDays.map(day => ({ id: day, label: day }));
  
  const roomOptions = useMemo(() => {
    const unique = Array.from(new Set(schedules.map(s => s.lab_room))).filter(Boolean).sort();
    return unique.map(r => ({ id: r, label: r }));
  }, [schedules]);

  const sectionOptions = useMemo(() => {
    const unique = Array.from(new Set(schedules.map(s => s.section))).filter(Boolean).sort();
    return unique.map(s => ({ id: s, label: `Section ${s}` }));
  }, [schedules]);

  const filteredSchedules = useMemo(() => {
    return schedules.filter(sched => {
      const matchDay = dayFilter === "" || sched.date === dayFilter;
      const matchRoom = roomFilter === "" || sched.lab_room === roomFilter;
      const matchSection = sectionFilter === "" || sched.section === sectionFilter;
      
      const searchLower = searchQuery.toLowerCase();
      const matchSearch = searchQuery === "" || 
        sched.course_code.toLowerCase().includes(searchLower) ||
        sched.section.toLowerCase().includes(searchLower) ||
        sched.lab_room.toLowerCase().includes(searchLower);

      return matchDay && matchRoom && matchSection && matchSearch;
    });
  }, [schedules, dayFilter, roomFilter, sectionFilter, searchQuery]);

  // Use useEffect for resetting pagination to avoid React hydration errors
  useEffect(() => {
    setCurrentPage(1);
  }, [dayFilter, roomFilter, sectionFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredSchedules.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedSchedules = filteredSchedules.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Advanced Filter Control Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col xl:flex-row gap-4 items-center justify-between relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full flex-1">
          <input 
            type="text"
            placeholder="Search course, section, or room..."
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-[#011B51] transition-colors shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <FilterDropdown
            options={dayOptions}
            value={dayFilter}
            onChange={setDayFilter}
            placeholder="All Days"
            allowClear={true}
            clearText="Show All Days"
            showSearch={false}
          />
          <FilterDropdown
            options={roomOptions}
            value={roomFilter}
            onChange={setRoomFilter}
            placeholder="All Facilities"
            allowClear={true}
            clearText="Show All Facilities"
          />
          <FilterDropdown
            options={sectionOptions}
            value={sectionFilter}
            onChange={setSectionFilter}
            placeholder="All Sections"
            allowClear={true}
            clearText="Show All Sections"
          />
        </div>
        
        <div className="flex w-full xl:w-auto shrink-0 mt-4 xl:mt-0 justify-end">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-lg whitespace-nowrap shadow-sm">
            {filteredSchedules.length} {filteredSchedules.length === 1 ? 'Class Found' : 'Classes Found'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-0">
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
                <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Facility</span>
                  <span className="text-[#011B51] font-black truncate ml-2" title={sched.lab_room}>{sched.lab_room}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        {paginatedSchedules.length === 0 && (
          <div className="col-span-full p-12 text-center text-xs font-bold text-slate-400 uppercase tracking-widest bg-white rounded-xl border border-slate-200 border-dashed">
            No schedules match your filters.
          </div>
        )}
      </div>

      {filteredSchedules.length > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative z-0">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-5 py-2.5 text-[10px] font-bold text-[#011B51] uppercase tracking-widest bg-white border-2 border-slate-200 rounded-lg disabled:opacity-50 cursor-pointer shadow-sm hover:border-[#011B51]/30 transition-colors"
          >
            Previous
          </button>
          
          <span className="text-xs font-black text-[#011B51] uppercase tracking-widest">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-5 py-2.5 text-[10px] font-bold text-[#011B51] uppercase tracking-widest bg-white border-2 border-slate-200 rounded-lg disabled:opacity-50 cursor-pointer shadow-sm hover:border-[#011B51]/30 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}