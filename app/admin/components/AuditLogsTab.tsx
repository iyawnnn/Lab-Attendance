"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronDown, Check, X, FileText, Download, ShieldAlert } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { AuditLog } from "../types";
import ActionModal from "@/app/components/ActionModal";

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
  showSearch = true,
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
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(query.toLowerCase())
    );
  }, [options, query, showSearch]);

  const selectedOption = options.find((opt) => opt.id === value);

  return (
    <div ref={dropdownRef} className="relative w-full">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 bg-slate-50 hover:bg-slate-100 border transition-all rounded-md text-sm cursor-pointer flex justify-between items-center shadow-sm h-[38px] ${
          isOpen ? "border-slate-500 ring-2 ring-slate-500/10" : "border-slate-200"
        }`}
      >
        <span
          className={`truncate mr-1 text-xs ${
            selectedOption ? "text-slate-900 font-bold" : "text-slate-500 font-medium"
          }`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={14}
          className={`text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
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
                onChange={(e) => setQuery(e.target.value)}
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
              <div className="p-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">
                No matches found
              </div>
            ) : (
              filteredOptions.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                    setQuery("");
                  }}
                  className={`px-2.5 py-2 text-xs rounded-md cursor-pointer flex items-center justify-between transition-colors ${
                    value === opt.id
                      ? "bg-slate-100 text-slate-900 font-bold"
                      : "hover:bg-slate-50 text-slate-700 font-medium"
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

export default function AuditLogsTab({ auditLogs }: { auditLogs: AuditLog[] }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: "alert" as "alert" | "confirm" | "success" | "error",
    title: "",
    message: "",
    confirmText: "Confirm",
    onConfirm: () => {},
  });
  const [dateFilter, setDateFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const itemsPerPage = 10;

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

  const actionOptions = useMemo(() => {
    const unique = Array.from(new Set(auditLogs.map((log) => log.action))).filter(Boolean).sort();
    return unique.map((action) => ({
      id: action,
      label: action.replace(/_/g, " "),
    }));
  }, [auditLogs]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, dateFilter, actionFilter]);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const logDateObj = new Date(log.timestamp);
      const logDateString = logDateObj.toLocaleDateString("en-CA");

      const query = searchQuery.toLowerCase();
      const matchesSearch =
        log.actor.toLowerCase().includes(query) ||
        log.details.toLowerCase().includes(query) ||
        (log.target && log.target.toLowerCase().includes(query)) ||
        log.action.toLowerCase().includes(query);

      const matchesDate = dateFilter === "" || logDateString === dateFilter;
      const matchesAction = actionFilter === "" || log.action === actionFilter;

      return matchesSearch && matchesDate && matchesAction;
    });
  }, [auditLogs, searchQuery, dateFilter, actionFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage));
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage]);

  function getActionBadgeStyle(action: string) {
    if (action.includes("DELETE") || action.includes("RESET")) {
      return "bg-rose-50 text-rose-700 border-rose-200";
    }
    if (action.includes("CREATE")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    if (action.includes("ASSIGN") || action.includes("UPDATE")) {
      return "bg-blue-50 text-blue-700 border-blue-200";
    }
    return "bg-slate-100 text-slate-700 border-slate-200";
  }

  function downloadCSV() {
    setIsExportMenuOpen(false);
    const headers = ["Timestamp", "Action", "Actor", "Target", "Details"];
    const rows = filteredLogs.map((log) => [
      new Date(log.timestamp).toLocaleString(),
      log.action,
      log.actor,
      log.target || "N/A",
      log.details,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((val) => `"${val}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `UA_Admin_Audit_Logs_${dateFilter || "All_Dates"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function downloadPDF() {
    setIsExportMenuOpen(false);
    if (filteredLogs.length === 0) {
      setModalConfig({
        isOpen: true,
        type: "alert",
        title: "No Data Available",
        message: "No administrative audit log data available to export.",
        confirmText: "Okay",
        onConfirm: () => {},
      });
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
    doc.text("Master Administrative System Audit Log", 14, 18);

    try {
      const logoImg = await loadImage("/ua-logo.png");
      const logoSize = 18;
      const logoX = 210 - 14 - logoSize;
      const logoY = (24 - logoSize) / 2;
      doc.addImage(logoImg, "PNG", logoX, logoY, logoSize, logoSize);
    } catch (err) {
      console.warn("Could not load logo for admin PDF header:", err);
    }

    doc.setTextColor(51, 65, 85);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");

    doc.text("Action Filter:", 14, 32);
    doc.setFont("helvetica", "normal");
    doc.text(actionFilter ? actionFilter.replace(/_/g, " ") : "All Actions", 42, 32);

    doc.setFont("helvetica", "bold");
    doc.text("Log Date:", 110, 32);
    doc.setFont("helvetica", "normal");
    doc.text(dateFilter || "All Dates", 138, 32);

    doc.setDrawColor(226, 232, 240);
    doc.line(14, 38, 196, 38);

    const tableHeaders = [["Timestamp", "Action", "Actor", "Target", "Details"]];

    const tableRows = filteredLogs.map((log) => [
      new Date(log.timestamp).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      log.action.replace(/_/g, " "),
      log.actor,
      log.target || "-",
      log.details,
    ]);

    autoTable(doc, {
      startY: 42,
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
      margin: { top: 42, bottom: 20, left: 14, right: 14 },
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

    doc.save(`UA_Admin_Audit_Logs_${dateFilter || "All_Dates"}.pdf`);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 relative z-0">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Administrative Audit Filters</h2>
            <p className="text-sm text-slate-500 mt-0.5">Showing {filteredLogs.length} activity logs</p>
          </div>

          <div ref={exportMenuRef} className="relative">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 px-5 rounded-md text-sm transition-colors shadow-sm cursor-pointer flex items-center gap-2"
            >
              <Download size={16} />
              Export Report
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${isExportMenuOpen ? "rotate-180" : ""}`}
              />
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col">
            <label className="text-xs font-bold text-slate-500 uppercase mb-1">Search Keywords</label>
            <input
              type="text"
              placeholder="Action, actor, or details..."
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
            <label className="text-xs font-bold text-slate-500 uppercase mb-1">Action Type</label>
            <FilterDropdown
              options={actionOptions}
              value={actionFilter}
              onChange={setActionFilter}
              placeholder="All Actions"
              allowClear={true}
              clearText="Show All Actions"
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
                <th className="p-4 font-semibold">Action</th>
                <th className="p-4 font-semibold">Actor</th>
                <th className="p-4 font-semibold">Target</th>
                <th className="p-4 font-semibold">Activity Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
              {paginatedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-medium text-slate-900">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${getActionBadgeStyle(
                        log.action
                      )}`}
                    >
                      {log.action.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-slate-900">{log.actor}</td>
                  <td className="p-4 font-mono text-xs font-bold text-slate-500 uppercase">
                    {log.target || "-"}
                  </td>
                  <td className="p-4 text-xs font-medium text-slate-600 max-w-md truncate">
                    {log.details}
                  </td>
                </tr>
              ))}
              {paginatedLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                        No administrative audit logs match filters
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
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-[10px] font-bold text-slate-700 uppercase tracking-widest bg-white border border-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-100 transition-colors cursor-pointer shadow-sm"
            >
              Previous
            </button>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">
              Page <span className="text-slate-900 font-black">{currentPage}</span> of{" "}
              <span className="text-slate-900 font-black">{totalPages}</span>
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-[10px] font-bold text-slate-700 uppercase tracking-widest bg-white border border-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-100 transition-colors cursor-pointer shadow-sm"
            >
              Next
            </button>
          </div>
        )}
      </div>
      <ActionModal 
        isOpen={modalConfig.isOpen}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={modalConfig.onConfirm}
        confirmText={modalConfig.confirmText}
      />
    </div>
  );
}