"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { FileX, UserPlus, Search, ChevronDown, Check, X } from "lucide-react";
import { manuallyAdmitStudent } from "../../actions";

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
          <div className="overflow-y-auto max-h-[240px] flex-1 p-1.5 custom-scrollbar">
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

interface AttendanceTabProps {
  logs: any[];
  schedules: any[];
  teacherUserId: string;
}

export default function AttendanceTab({ logs = [], schedules = [], teacherUserId }: AttendanceTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Manual Override State
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualStudentId, setManualStudentId] = useState("");
  const [manualScheduleId, setManualScheduleId] = useState("");
  const [manualStatus, setManualStatus] = useState("ON_TIME");
  const [isOverriding, setIsOverriding] = useState(false);

  const logsPerPage = 10;

  // Format options for our custom dropdowns
  const scheduleOptions = useMemo(() => {
    return schedules.map(sched => ({
      id: sched.id.toString(),
      label: `${sched.course_code} - Sec ${sched.section} (${sched.lab_room})`
    }));
  }, [schedules]);

  const statusOptions = [
    { id: "ON_TIME", label: "On Time" },
    { id: "LATE", label: "Late" }
  ];

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, classFilter, dateFilter]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const studentName =
        `${log.student.first_name} ${log.student.last_name}`.toLowerCase();
      const studentId = log.student.student_id.toLowerCase();
      const courseCode = log.schedule?.course_code?.toLowerCase() || "";

      const searchMatch =
        studentName.includes(searchTerm.toLowerCase()) ||
        studentId.includes(searchTerm.toLowerCase()) ||
        courseCode.includes(searchTerm.toLowerCase());
      const statusMatch = statusFilter === "" || log.status === statusFilter;
      const classMatch =
        classFilter === "" || log.schedule?.id.toString() === classFilter;

      let dateMatch = true;
      if (dateFilter !== "") {
        const logDate = new Date(log.timestamp);
        const localDateString = new Date(
          logDate.getTime() - logDate.getTimezoneOffset() * 60000,
        )
          .toISOString()
          .split("T")[0];
        dateMatch = localDateString === dateFilter;
      }

      return searchMatch && statusMatch && classMatch && dateMatch;
    });
  }, [logs, searchTerm, statusFilter, classFilter, dateFilter]);

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manualStudentId || !manualScheduleId) {
      alert("Please enter a Student ID and select a class.");
      return;
    }

    if (!confirm(`Authorize manual entry for Student ID: ${manualStudentId} as ${manualStatus.replace("_", " ")}?`)) return;

    setIsOverriding(true);

    const response = await manuallyAdmitStudent({
      studentId: manualStudentId,
      scheduleId: parseInt(manualScheduleId),
      teacherUserId,
      status: manualStatus,
    });

    if (response.success) {
      alert(response.message);
      setManualStudentId("");
      setShowManualEntry(false);
    } else {
      alert(`Error: ${response.message}`);
    }

    setIsOverriding(false);
  }

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / logsPerPage));
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * logsPerPage;
    return filteredLogs.slice(startIndex, startIndex + logsPerPage);
  }, [filteredLogs, currentPage]);

  const exportToCSV = () => {
    if (filteredLogs.length === 0) {
      alert("No data to export.");
      return;
    }

    const headers = [
      "Date",
      "Time",
      "Student ID",
      "Last Name",
      "First Name",
      "Course",
      "Section",
      "Room",
      "Status",
      "Entry Method"
    ];

    const rows = filteredLogs.map((log) => {
      const isManual = log.signature && log.signature.includes("OVERRIDE");
      return [
        new Date(log.timestamp).toLocaleDateString(),
        new Date(log.timestamp).toLocaleTimeString(),
        log.student.student_id,
        log.student.last_name,
        log.student.first_name,
        log.schedule?.course_code || "N/A",
        log.schedule?.section || "N/A",
        log.schedule?.lab_room || "N/A",
        log.status,
        isManual ? "Manual Override" : "Device Verified"
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((field) => `"${field}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Class_Attendance_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4 relative z-10">
        
        <div className="flex flex-col xl:flex-row gap-4 items-center justify-between w-full">
          {/* Filters Area */}
          <div className="flex flex-wrap gap-3 w-full xl:flex-1 items-center">
            <input
              type="text"
              placeholder="Search student or course..."
              className="flex-1 min-w-[200px] px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-[#011B51] focus:ring-2 focus:ring-[#011B51]/10 transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="w-full sm:w-auto sm:min-w-[240px]">
              <FilterDropdown
                options={scheduleOptions}
                value={classFilter}
                onChange={setClassFilter}
                placeholder="All My Classes"
                allowClear={true}
                clearText="Show All Classes"
              />
            </div>

            <input
              type="date"
              className="w-full sm:w-auto sm:max-w-[160px] px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-[#011B51] focus:ring-2 focus:ring-[#011B51]/10 transition-all text-slate-600 cursor-pointer shadow-sm"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />

            <div className="w-full sm:w-auto sm:min-w-[150px]">
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

          <div className="flex gap-2 w-full xl:w-auto shrink-0 mt-4 xl:mt-0">
            <button
              onClick={() => setShowManualEntry(!showManualEntry)}
              className={`flex-1 xl:flex-none py-2.5 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-2 ${
                showManualEntry 
                  ? "bg-slate-200 text-[#011B51] inset-shadow-sm" 
                  : "bg-slate-100 hover:bg-slate-200 text-[#011B51]"
              }`}
            >
              <UserPlus size={16} />
              Manual Admit
            </button>
            <button
              onClick={exportToCSV}
              className="flex-1 xl:flex-none bg-[#011B51] hover:bg-[#022a7a] border-b-2 border-[#A51A21] text-white font-bold py-2.5 px-6 rounded-lg text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Manual Entry Form Panel */}
        {showManualEntry && (
          <form onSubmit={handleManualSubmit} className="mt-2 p-5 bg-blue-50/50 border border-blue-100 rounded-xl flex flex-col md:flex-row gap-4 items-end animate-in slide-in-from-top-2">
            <div className="w-full md:w-[25%]">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                Student ID
              </label>
              <input
                type="text"
                required
                placeholder="e.g., 2023-12345"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-[#011B51] focus:ring-2 focus:ring-[#011B51]/10 transition-all shadow-sm"
                value={manualStudentId}
                onChange={(e) => setManualStudentId(e.target.value)}
              />
            </div>
            
            <div className="w-full md:w-[40%]">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                Class Session
              </label>
              <FilterDropdown
                options={scheduleOptions}
                value={manualScheduleId}
                onChange={setManualScheduleId}
                placeholder="Search and choose a class..."
              />
            </div>

            <div className="w-full md:w-[15%]">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                Attendance Status
              </label>
              <FilterDropdown
                options={statusOptions}
                value={manualStatus}
                onChange={setManualStatus}
                placeholder="Status"
                showSearch={false}
              />
            </div>

            <button
              type="submit"
              disabled={isOverriding || !manualScheduleId || !manualStudentId}
              className="w-full md:w-auto bg-[#011B51] hover:bg-[#022a7a] border-b-2 border-[#A51A21] text-white font-bold py-2.5 px-8 rounded-lg text-sm transition-colors disabled:opacity-50 shadow-sm h-[42px] shrink-0"
            >
              {isOverriding ? "Processing..." : "Submit Override"}
            </button>
          </form>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col relative z-0">
        <div className="custom-scrollbar overflow-x-auto overflow-y-auto max-h-[600px] rounded-t-xl">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider shadow-sm border-b border-slate-200">
                <th className="p-4 font-semibold">Student</th>
                <th className="p-4 font-semibold">Class Details</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <FileX className="w-12 h-12 text-slate-300 mb-4" />
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                        No records found matching filters
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log: any) => {
                  const isManual = log.signature && log.signature.includes("OVERRIDE");
                  
                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="block font-bold text-slate-900">
                          {log.student.last_name}, {log.student.first_name}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                          {log.student.student_id}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="block font-bold text-slate-900 uppercase tracking-tight">
                          {log.schedule?.course_code} - Sec{" "}
                          {log.schedule?.section}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                          {log.schedule?.lab_room}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-start gap-1">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${
                              log.status === "ON_TIME"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {log.status === "ON_TIME" ? "ON TIME" : "LATE"}
                          </span>
                          {isManual && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-200">
                              Manual Override
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700">
                        {new Date(log.timestamp).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredLogs.length > 0 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl z-10">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-[10px] font-bold text-[#011B51] uppercase tracking-widest bg-white border border-slate-200 rounded-lg disabled:opacity-50 cursor-pointer shadow-sm hover:border-[#011B51]/30 transition-colors"
            >
              Previous
            </button>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Page{" "}
              <span className="text-[#011B51] font-black">{currentPage}</span>{" "}
              of <span className="text-[#011B51] font-black">{totalPages}</span>
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-[10px] font-bold text-[#011B51] uppercase tracking-widest bg-white border border-slate-200 rounded-lg disabled:opacity-50 cursor-pointer shadow-sm hover:border-[#011B51]/30 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}