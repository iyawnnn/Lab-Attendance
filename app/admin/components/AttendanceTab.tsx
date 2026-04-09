"use client";

import { useState, useEffect } from "react";
import { AttendanceLog } from "../types";

export default function AttendanceTab({ logs }: { logs: AttendanceLog[] }) {
  // 1. Independent Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [roomFilter, setRoomFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset pagination to page 1 when any filter is changed
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, dateFilter, courseFilter, sectionFilter, roomFilter, statusFilter]);

  // 2. Extract Unique Values for Dropdowns dynamically from the data
  const uniqueCourses = Array.from(new Set(logs.map(log => log.schedule.course_code))).sort();
  const uniqueSections = Array.from(new Set(logs.map(log => log.schedule.section))).sort();
  const uniqueRooms = Array.from(new Set(logs.map(log => log.schedule.lab_room))).sort();

  // 3. The Granular Filtering Engine
  const filteredLogs = logs.filter(log => {
    // Format timestamp to YYYY-MM-DD local time to perfectly match the <input type="date">
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

  // 4. Pagination Calculations
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage));
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // 5. CSV Export Feature
  function downloadCSV() {
    const headers = ["Date", "Time", "Status", "Student ID", "First Name", "Last Name", "Course", "Section", "Lab Room"];
    const rows = filteredLogs.map(log => {
      const dateObj = new Date(log.timestamp);
      return [
        dateObj.toLocaleDateString(),
        dateObj.toLocaleTimeString(),
        log.status,
        log.student.student_id,
        log.student.first_name,
        log.student.last_name,
        log.schedule.course_code,
        log.schedule.section,
        log.schedule.lab_room
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
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* ADVANCED FILTER GRID */}
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
            <input type="text" placeholder="ID or Name..." className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:border-slate-500 transition-colors" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          
          <div className="flex flex-col">
            <label className="text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
            <input type="date" className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:border-slate-500 text-slate-700 transition-colors cursor-pointer" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold text-slate-500 uppercase mb-1">Course Code</label>
            <select className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none cursor-pointer focus:border-slate-500 transition-colors" value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
              <option value="">All Courses</option>
              {uniqueCourses.map(course => <option key={course} value={course}>{course}</option>)}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold text-slate-500 uppercase mb-1">Section</label>
            <select className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none cursor-pointer focus:border-slate-500 transition-colors" value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}>
              <option value="">All Sections</option>
              {uniqueSections.map(section => <option key={section} value={section}>{section}</option>)}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold text-slate-500 uppercase mb-1">Facility / Room</label>
            <select className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none cursor-pointer focus:border-slate-500 transition-colors" value={roomFilter} onChange={(e) => setRoomFilter(e.target.value)}>
              <option value="">All Facilities</option>
              {uniqueRooms.map(room => <option key={room} value={room}>{room}</option>)}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
            <select className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none cursor-pointer focus:border-slate-500 transition-colors" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="ON_TIME">On Time</option>
              <option value="LATE">Late</option>
            </select>
          </div>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold border-b border-slate-200">Date & Time</th>
                <th className="p-4 font-semibold border-b border-slate-200">Status</th>
                <th className="p-4 font-semibold border-b border-slate-200">Student Identity</th>
                <th className="p-4 font-semibold border-b border-slate-200">Course Information</th>
                <th className="p-4 font-semibold border-b border-slate-200">Facility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
              {paginatedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-medium text-slate-900">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${log.status === 'LATE' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                      {log.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-slate-900">{log.student.first_name} {log.student.last_name}</div>
                    <div className="text-slate-500 text-xs mt-0.5">{log.student.student_id}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-slate-900">{log.schedule.course_code}</div>
                    <div className="text-slate-500 text-xs mt-0.5">Section: {log.schedule.section}</div>
                  </td>
                  <td className="p-4 text-slate-600">{log.schedule.lab_room}</td>
                </tr>
              ))}
              {paginatedLogs.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500">No records found matching current session filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* PAGINATION CONTROLS */}
        {filteredLogs.length > 0 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-slate-200 bg-slate-50">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
              disabled={currentPage === 1} 
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md disabled:opacity-50 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Previous
            </button>
            <span className="text-sm text-slate-700 self-center font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
              disabled={currentPage === totalPages} 
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md disabled:opacity-50 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}