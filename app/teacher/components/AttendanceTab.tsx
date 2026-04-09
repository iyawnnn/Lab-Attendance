"use client";

import { useState } from "react";

interface AttendanceTabProps {
  logs: any[];
}

export default function AttendanceTab({ logs = [] }: AttendanceTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [classFilter, setClassFilter] = useState(""); // NEW: Class Filter State

  // Extract unique classes (schedules) from the logs to populate the dropdown
  const uniqueClasses = Array.from(
    new Map(logs.filter(log => log.schedule).map(log => [log.schedule.id, log.schedule])).values()
  );

  const filteredLogs = logs.filter(log => {
    const studentName = `${log.student.first_name} ${log.student.last_name}`.toLowerCase();
    const studentId = log.student.student_id.toLowerCase();
    const courseCode = log.schedule?.course_code?.toLowerCase() || "";
    
    const searchMatch = studentName.includes(searchTerm.toLowerCase()) || studentId.includes(searchTerm.toLowerCase()) || courseCode.includes(searchTerm.toLowerCase());
    const statusMatch = statusFilter === "" || log.status === statusFilter;
    const classMatch = classFilter === "" || log.schedule?.id.toString() === classFilter; // NEW: Class Match Logic
    
    return searchMatch && statusMatch && classMatch;
  });

  const exportToCSV = () => {
    if (filteredLogs.length === 0) {
      alert("No data to export.");
      return;
    }

    // Create CSV Headers
    const headers = ["Date", "Time", "Student ID", "Last Name", "First Name", "Course", "Section", "Room", "Status"];
    
    // Map data to rows
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

    // Combine headers and rows, escaping commas in the fields
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(field => `"${field}"`).join(","))
    ].join("\n");

    // Trigger download
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
      
      {/* Top Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
        
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          {/* Search Input */}
          <input 
            type="text" 
            placeholder="Search student or course..." 
            className="w-full sm:w-64 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-[#011B51] transition-colors" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          {/* NEW: Class Filter Dropdown */}
          <select 
            className="w-full sm:w-48 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none cursor-pointer focus:border-[#011B51] transition-colors" 
            value={classFilter} 
            onChange={(e) => setClassFilter(e.target.value)}
          >
            <option value="">All Classes</option>
            {uniqueClasses.map((sched: any) => (
              <option key={sched.id} value={sched.id.toString()}>
                {sched.course_code} - Sec {sched.section}
              </option>
            ))}
          </select>

          {/* Status Filter Dropdown */}
          <select 
            className="w-full sm:w-40 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none cursor-pointer focus:border-[#011B51] transition-colors" 
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
          className="w-full lg:w-auto bg-[#011B51] hover:bg-[#022a7a] border-b-2 border-[#A51A21] text-white font-bold py-2.5 px-6 rounded-lg text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
        >
          Export to CSV
        </button>
      </div>

      {/* Attendance Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[700px]">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[#011B51] uppercase text-[10px] font-black tracking-widest sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Class Details</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-xs font-bold text-slate-400 uppercase tracking-widest bg-white">
                    No attendance records found matching these filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="block font-bold text-slate-900">{log.student.last_name}, {log.student.first_name}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{log.student.student_id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="block font-bold text-slate-900">{log.schedule?.course_code} - Sec {log.schedule?.section}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{log.schedule?.lab_room}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        log.status === "ON_TIME" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {log.status.replace("_", " ")}
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
      </div>
    </div>
  );
}