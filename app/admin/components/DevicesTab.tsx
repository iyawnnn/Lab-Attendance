"use client";

import { useState } from "react";
import { Student } from "../types";

interface DevicesTabProps {
  students: Student[];
  onResetDevice: (studentId: string) => void;
  isLoading: boolean;
}

export default function DevicesTab({ students, onResetDevice, isLoading }: DevicesTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // 1. Real-time filtering logic
  const filteredStudents = students.filter((student) => {
    const searchLower = searchTerm.toLowerCase();
    
    const fName = student.first_name || "";
    const lName = student.last_name || "";
    const id = student.student_id || "";
    
    const fullName = `${fName} ${lName}`.toLowerCase();

    return (
      id.toLowerCase().includes(searchLower) ||
      fullName.includes(searchLower)
    );
  });

  // 2. Pagination logic
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / itemsPerPage));
  const validPage = Math.min(currentPage, totalPages);
  const paginatedDevices = filteredStudents.slice((validPage - 1) * itemsPerPage, validPage * itemsPerPage);

  return (
    <div className="animate-in fade-in duration-500">
      
      {/* Search & Header Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[#011B51] uppercase tracking-tight">Registered Endpoints</h2>
          <p className="text-slate-500 text-sm mt-1 font-medium tracking-wide">Manage physical device access and security.</p>
        </div>
        
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by ID or Name..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none text-sm font-medium focus:bg-white focus:border-[#011B51] focus:ring-2 focus:ring-[#011B51]/20 transition-all shadow-sm text-[#011B51]"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); 
            }}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-6 whitespace-nowrap">Student Identifier</th>
                <th className="p-6 whitespace-nowrap w-1/2">Full Name</th>
                <th className="p-6 text-right whitespace-nowrap">Security Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {paginatedDevices.map((student, index) => {
                const id = student.student_id || "";
                const fName = student.first_name || "";
                const lName = student.last_name || "";
                const publicKey = student.public_key || "";
                const hasKey = publicKey && publicKey.length > 0;

                return (
                  <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                    
                    {/* Student ID - Set to font-black for extra boldness */}
                    <td className="p-6 font-black text-[#011B51] whitespace-nowrap align-middle">
                      {id}
                    </td>

                    {/* Full Name */}
                    <td className="p-6 whitespace-nowrap align-middle">
                      <span className="font-semibold text-slate-600 align-middle">
                        {`${fName} ${lName}`.trim()}
                      </span>
                      {!hasKey && (
                        <span className="ml-3 align-middle text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md tracking-widest uppercase">
                          Revoked
                        </span>
                      )}
                    </td>

                    <td className="p-6 text-right whitespace-nowrap align-middle">
                      <button 
                        onClick={() => onResetDevice(id)} 
                        disabled={isLoading || !hasKey} 
                        className="text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg transition-colors border border-transparent shadow-sm disabled:opacity-40 disabled:cursor-not-allowed bg-white hover:bg-rose-50 text-rose-600 hover:border-rose-200 border-slate-200 cursor-pointer"
                      >
                        Revoke Device
                      </button>
                    </td>
                  </tr>
                );
              })}

              {paginatedDevices.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-12 text-center text-sm font-medium text-slate-500 uppercase tracking-wide">
                    {searchTerm ? "No students found matching your search." : "No devices are currently registered in the system."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Minimal Pagination */}
        {filteredStudents.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-white shrink-0">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
              disabled={validPage === 1} 
              className="text-sm font-semibold text-[#011B51] hover:text-[#A51A21] disabled:opacity-30 disabled:hover:text-[#011B51] transition-colors cursor-pointer"
            >
              &larr; Prev
            </button>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
              Page <span className="text-[#011B51] mx-1">{validPage}</span> of {totalPages}
            </span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
              disabled={validPage === totalPages} 
              className="text-sm font-semibold text-[#011B51] hover:text-[#A51A21] disabled:opacity-30 disabled:hover:text-[#011B51] transition-colors cursor-pointer"
            >
              Next &rarr;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}