"use client";

import { useState, useMemo, useEffect } from "react";
import { FileX } from "lucide-react";

interface AttendanceTabProps {
  logs: any[];
}

export default function AttendanceTab({ logs = [] }: AttendanceTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
  const logsPerPage = 10;

  const uniqueClasses = useMemo(() => {
    return Array.from(
      new Map(logs.filter(log => log.schedule).map(log => [log.schedule.id, log.schedule])).values()
    );
  }, [logs]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, classFilter, dateFilter]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const studentName = `${log.student.first_name} ${log.student.last_name}`.toLowerCase();
      const studentId = log.student.student_id.toLowerCase();
      const courseCode = log.schedule?.course_code?.toLowerCase() || "";
      
      const searchMatch = studentName.includes(searchTerm.toLowerCase()) || studentId.includes(searchTerm.toLowerCase()) || courseCode.includes(searchTerm.toLowerCase());
      const statusMatch = statusFilter === "" || log.status === statusFilter;
      const classMatch = classFilter === "" || log.schedule?.id.toString() === classFilter;
      
      let dateMatch = true;
      if (dateFilter !== "") {
        const logDate = new Date(log.timestamp);
        const localDateString = new Date(logDate.getTime() - (logDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        dateMatch = localDateString === dateFilter;
      }
      
      return searchMatch && statusMatch && classMatch && dateMatch;
    });
  }, [logs, searchTerm, statusFilter, classFilter, dateFilter]);

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

    const headers = ["Date", "Time", "Student ID", "Last Name", "First Name", "Course", "Section", "Room", "Status"];
    
    const rows = filteredLogs.map(log => [
      new Date(log.timestamp).toLocaleDateString(),
      new Date(log.timestamp).toLocaleTimeString(),
      log.student.student_id,
      log.student.last_name,
      log.student.first_name,
      log.schedule?.course_code || "N/A",
      log.schedule?.section || "N/A",
      log.schedule?.lab_room || "N/A",
      log.status
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(field => `"${field}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Class_Attendance_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full flex-1">
          <input 
            type="text" 
            placeholder="Search student or course..." 
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-[#011B51] focus:ring-2 focus:ring-[#011B51]/10 transition-all" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <select 
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none cursor-pointer focus:border-[#011B51] focus:ring-2 focus:ring-[#011B51]/10 transition-all appearance-none" 
            value={classFilter} 
            onChange={(e) => setClassFilter(e.target.value)}
          >
            <option value="">All My Classes</option>
            {uniqueClasses.map((sched: any) => (
              <option key={sched.id} value={sched.id.toString()}>
                {sched.course_code} - Sec {sched.section}
              </option>
            ))}
          </select>

          <input 
            type="date" 
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-[#011B51] focus:ring-2 focus:ring-[#011B51]/10 transition-all text-slate-600 cursor-pointer"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />

          <select 
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none cursor-pointer focus:border-[#011B51] focus:ring-2 focus:ring-[#011B51]/10 transition-all appearance-none" 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="ON_TIME">On Time</option>
            <option value="LATE">Late</option>
          </select>
        </div>

        <button 
          onClick={exportToCSV} 
          className="w-full lg:w-auto bg-[#011B51] hover:bg-[#022a7a] border-b-2 border-[#A51A21] text-white font-bold py-2.5 px-6 rounded-lg text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-sm shrink-0 mt-4 lg:mt-0"
        >
          Export to CSV
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="custom-scrollbar overflow-auto max-h-[600px]">
          <table className="w-full text-left text-sm text-slate-600 whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-[#011B51] uppercase text-[10px] font-black tracking-widest sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Class Details</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 bg-white">
                    <div className="flex flex-col items-center justify-center text-center">
                      <FileX className="w-12 h-12 text-slate-300 mb-4" />
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        No attendance records found
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Try adjusting your filters or search terms.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="block font-bold text-slate-900">{log.student.last_name}, {log.student.first_name}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{log.student.student_id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="block font-bold text-slate-900 uppercase tracking-tight">{log.schedule?.course_code} - Sec {log.schedule?.section}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{log.schedule?.lab_room}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                        log.status === "ON_TIME" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {log.status === "ON_TIME" ? "ON TIME" : "LATE"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">
                      {new Date(log.timestamp).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredLogs.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between sticky bottom-0 z-10">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
              disabled={currentPage === 1} 
              className="px-4 py-2 text-[10px] font-bold text-[#011B51] uppercase tracking-widest bg-white border border-slate-200 rounded-lg disabled:opacity-50 cursor-pointer shadow-sm hover:border-[#011B51]/30 transition-colors"
            >
              Previous
            </button>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Page <span className="text-[#011B51] font-black">{currentPage}</span> of <span className="text-[#011B51] font-black">{totalPages}</span>
            </span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
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