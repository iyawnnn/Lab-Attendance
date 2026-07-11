"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronDown, Check, X, FileText, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { AttendanceLog, Schedule } from "../types";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
  });
}

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
        className={`w-full px-3 py-2 bg-slate-50 hover:bg-slate-100 border transition-all rounded-md text-sm cursor-pointer flex justify-between items-center shadow-sm h-[38px] ${isOpen ? 'border-slate-500 ring-2 ring-slate-500/10' : 'border-slate-200'}`}
      >
        <span className={`truncate mr-1 text-xs ${selectedOption ? "text-slate-900 font-bold" : "text-slate-500 font-medium"}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200 rounded-lg shadow-xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {showSearch && (
            <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50/80">
              <Search size={14} className="text-slate-400 shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Search..."
                className="w-full bg-transparent outline-none text-xs text-slate-700 font-medium placeholder:text-slate-400"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
          )}
          <div className="overflow-y-auto max-h-[200px] flex-1 p-1 custom-scrollbar">
            {allowClear && (
               <div
                 onClick={() => {
                   onChange("");
                   setIsOpen(false);
                   setQuery("");
                 }}
                 className="px-2.5 py-2 mb-1 text-xs rounded-md cursor-pointer flex items-center gap-2 text-slate-500 hover:bg-slate-100 transition-colors"
               >
                 <X size={13} />
                 <span className="italic">{clearText}</span>
               </div>
            )}
            
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">No matches found</div>
            ) : (
              filteredOptions.map(opt => (
                <div
                  key={opt.id}
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                    setQuery("");
                  }}
                  className={`px-2.5 py-2 text-xs rounded-md cursor-pointer flex items-center justify-between transition-colors ${
                    value === opt.id 
                      ? 'bg-slate-100 text-slate-900 font-bold' 
                      : 'hover:bg-slate-50 text-slate-700 font-medium'
                  }`}
                >
                  <span className="truncate pr-2">{opt.label}</span>
                  {value === opt.id && <Check size={13} className="text-slate-900 shrink-0" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AttendanceTab({ logs, schedules }: { logs: AttendanceLog[], schedules: Schedule[] }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [roomFilter, setRoomFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  const [currentPage, setCurrentPage] = useState(1);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const itemsPerPage = 10;

  // Real-time auto-polling every 4 seconds when the window is active
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [router]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, dateFilter, courseFilter, sectionFilter, roomFilter, statusFilter]);

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
    setIsExportMenuOpen(false);
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
    link.setAttribute("download", `UA_Admin_Audit_${dateFilter || 'All_Dates'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function downloadPDF() {
    setIsExportMenuOpen(false);
    if (filteredLogs.length === 0) {
      alert("No data available to export to PDF.");
      return;
    }

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 24, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("UNIVERSITY OF ASSUMPTION", 14, 11);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Master Laboratory Attendance Audit Log", 14, 18);

    try {
      const logoImg = await loadImage("/ua-logo.png");
      const logoSize = 18;
      const logoX = 210 - 14 - logoSize;
      const logoY = (24 - logoSize) / 2;
      doc.addImage(logoImg, "PNG", logoX, logoY, logoSize, logoSize);
    } catch (err) {
      console.warn("Could not load university logo for admin PDF header:", err);
    }

    doc.setTextColor(51, 65, 85);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");

    doc.text("Course Filter:", 14, 32);
    doc.setFont("helvetica", "normal");
    doc.text(courseFilter || "All Courses", 42, 32);

    doc.setFont("helvetica", "bold");
    doc.text("Section Filter:", 14, 38);
    doc.setFont("helvetica", "normal");
    doc.text(sectionFilter ? `Section ${sectionFilter}` : "All Sections", 42, 38);

    doc.setFont("helvetica", "bold");
    doc.text("Facility / Room:", 110, 32);
    doc.setFont("helvetica", "normal");
    doc.text(roomFilter || "All Rooms", 138, 32);

    doc.setFont("helvetica", "bold");
    doc.text("Log Date:", 110, 38);
    doc.setFont("helvetica", "normal");
    doc.text(dateFilter || "All Dates", 138, 38);

    doc.setDrawColor(226, 232, 240);
    doc.line(14, 43, 196, 43);

    const tableHeaders = [
      ["Timestamp", "Status", "Student ID", "Student Name", "Course & Sec", "Facility", "Method"]
    ];

    const tableRows = filteredLogs.map((log) => {
      const isManual = log.signature && log.signature.includes("OVERRIDE");
      return [
        new Date(log.timestamp).toLocaleString([], {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        }),
        log.status === "ON_TIME" ? "ON TIME" : "LATE",
        log.student.student_id,
        `${log.student.last_name}, ${log.student.first_name}`,
        `${log.schedule.course_code} (${log.schedule.section})`,
        log.schedule.lab_room,
        isManual ? "Manual" : "Device"
      ];
    });

    autoTable(doc, {
      startY: 46,
      head: tableHeaders,
      body: tableRows,
      theme: "striped",
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [51, 65, 85],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { top: 46, bottom: 20, left: 14, right: 14 },
      didDrawPage: (data) => {
        const pageCount = doc.internal.pages.length - 1;
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Page ${data.pageNumber} of ${pageCount} - University of Assumption Administrative Audit Trail`,
          14,
          287
        );
      },
    });

    doc.save(`UA_Admin_Attendance_Audit_${dateFilter || 'All_Dates'}.pdf`);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 relative z-0">
      
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Record Filters</h2>
              <p className="text-sm text-slate-500 mt-0.5">Showing {filteredLogs.length} matching records</p>
            </div>
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">
                Live Feed
              </span>
            </div>
          </div>

          <div ref={exportMenuRef} className="relative">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 px-5 rounded-md text-sm transition-colors shadow-sm cursor-pointer flex items-center gap-2"
            >
              <Download size={16} />
              Export Report
              <ChevronDown size={14} className={`transition-transform duration-200 ${isExportMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  onClick={downloadPDF}
                  className="w-full px-3 py-2.5 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <FileText size={16} className="text-red-600" />
                  PDF Document (.pdf)
                </button>
                <button
                  onClick={downloadCSV}
                  className="w-full px-3 py-2.5 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Download size={16} className="text-emerald-600" />
                  Spreadsheet (.csv)
                </button>
              </div>
            )}
          </div>
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