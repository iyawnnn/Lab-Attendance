"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  Search,
  UserPlus,
  Trash2,
  Calendar,
  ShieldCheck,
  GraduationCap,
  X,
  Check,
  AlertCircle,
  ChevronDown,
  BookOpen,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react";
import {
  createStaffAccount,
  deleteTeacherAccount,
  assignTeacherToMultipleSchedules,
  removeTeacherFromSchedule,
} from "../../actions";
import { Schedule } from "../types";

interface StaffUser {
  id: number;
  user_id: string;
  name: string;
  role?: "ADMIN" | "TEACHER";
}

interface TeachersTabProps {
  teachers: StaffUser[];
  schedules: Schedule[];
  refreshData: () => void;
}

function FilterDropdown({
  options,
  value,
  onChange,
  placeholder,
  allowClear = false,
  clearText = "Clear selection",
  showSearch = false,
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
        className={`w-full px-3 py-2 bg-slate-50 hover:bg-slate-100 border transition-all rounded-lg text-xs font-bold cursor-pointer flex justify-between items-center shadow-sm h-[38px] ${
          isOpen ? "border-slate-500 ring-2 ring-slate-500/10" : "border-slate-200"
        }`}
      >
        <span
          className={`truncate mr-1 ${
            selectedOption ? "text-slate-900" : "text-slate-500"
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
                No options found
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

export default function TeachersTab({
  teachers,
  schedules,
  refreshData,
}: TeachersTabProps) {
  // Directory Filtering & Pagination States
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Registration Modal State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "TEACHER">("TEACHER");
  const [isLoading, setIsLoading] = useState(false);

  // Delete Confirmation Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<StaffUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Class Assignment Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<StaffUser | null>(null);
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<number[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);

  // Modal Dynamic Filter States
  const [modalSearchQuery, setModalSearchQuery] = useState("");
  const [modalRoomFilter, setModalRoomFilter] = useState("");
  const [modalSectionFilter, setModalSectionFilter] = useState("");
  const [modalStatusFilter, setModalStatusFilter] = useState("");

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter]);

  const filteredTeachers = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return teachers.filter((t) => {
      const matchesSearch =
        t.name.toLowerCase().includes(query) ||
        t.user_id.toLowerCase().includes(query);
      const matchesRole =
        roleFilter === "" || (t.role || "TEACHER") === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [teachers, searchQuery, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTeachers.length / itemsPerPage));

  const paginatedTeachers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTeachers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTeachers, currentPage]);

  const teacherScheduleMap = useMemo(() => {
    const map = new Map<number, Schedule[]>();
    schedules.forEach((s) => {
      if (s.teacher_id) {
        const existing = map.get(s.teacher_id) || [];
        map.set(s.teacher_id, [...existing, s]);
      }
    });
    return map;
  }, [schedules]);

  // Dynamic Options for Modal Filters
  const modalRoomOptions = useMemo(() => {
    const uniqueRooms = Array.from(new Set(schedules.map((s) => s.lab_room))).filter(Boolean).sort();
    return uniqueRooms.map((room) => ({ id: room, label: room }));
  }, [schedules]);

  const modalSectionOptions = useMemo(() => {
    const uniqueSections = Array.from(new Set(schedules.map((s) => s.section))).filter(Boolean).sort();
    return uniqueSections.map((sec) => ({ id: sec, label: `Section ${sec}` }));
  }, [schedules]);

  const modalStatusOptions = [
    { id: "SELECTED", label: "Selected Classes" },
    { id: "UNASSIGNED", label: "Unassigned Classes" },
    { id: "OTHER", label: "Assigned to Others" },
  ];

  // In-Modal Filter Engine
  const modalFilteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      const q = modalSearchQuery.toLowerCase();
      const matchesText =
        !q ||
        s.course_code.toLowerCase().includes(q) ||
        s.section.toLowerCase().includes(q) ||
        s.lab_room.toLowerCase().includes(q);

      const matchesRoom = !modalRoomFilter || s.lab_room === modalRoomFilter;
      const matchesSection = !modalSectionFilter || s.section === modalSectionFilter;

      let matchesStatus = true;
      if (modalStatusFilter === "SELECTED") {
        matchesStatus = selectedScheduleIds.includes(s.id);
      } else if (modalStatusFilter === "UNASSIGNED") {
        matchesStatus = !s.teacher_id;
      } else if (modalStatusFilter === "OTHER") {
        matchesStatus = Boolean(s.teacher_id && selectedTeacher && s.teacher_id !== selectedTeacher.id);
      }

      return matchesText && matchesRoom && matchesSection && matchesStatus;
    });
  }, [
    schedules,
    modalSearchQuery,
    modalRoomFilter,
    modalSectionFilter,
    modalStatusFilter,
    selectedScheduleIds,
    selectedTeacher,
  ]);

  async function handleCreateStaff(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    const response = await createStaffAccount(userId, name, password, role);
    setIsLoading(false);

    if (response.success) {
      alert(response.message);
      setIsRegisterModalOpen(false);
      setUserId("");
      setName("");
      setPassword("");
      setRole("TEACHER");
      refreshData();
    } else {
      alert(response.message || "Failed to create staff account.");
    }
  }

  function promptDeleteTeacher(teacher: StaffUser) {
    setTeacherToDelete(teacher);
    setIsDeleteModalOpen(true);
  }

  async function confirmDeleteTeacher() {
    if (!teacherToDelete) return;
    setIsDeleting(true);

    const response = await deleteTeacherAccount(teacherToDelete.id);
    setIsDeleting(false);
    setIsDeleteModalOpen(false);
    setTeacherToDelete(null);

    if (response.success) {
      refreshData();
    } else {
      alert(response.message || "Failed to delete staff account.");
    }
  }

  function openAssignModal(teacher: StaffUser) {
    setSelectedTeacher(teacher);
    setModalSearchQuery("");
    setModalRoomFilter("");
    setModalSectionFilter("");
    setModalStatusFilter("");

    const currentAssigned = schedules
      .filter((s) => s.teacher_id === teacher.id)
      .map((s) => s.id);
    setSelectedScheduleIds(currentAssigned);
    setIsAssignModalOpen(true);
  }

  function toggleScheduleSelection(scheduleId: number) {
    setSelectedScheduleIds((prev) =>
      prev.includes(scheduleId)
        ? prev.filter((id) => id !== scheduleId)
        : [...prev, scheduleId]
    );
  }

  async function handleSaveAssignments() {
    if (!selectedTeacher) return;
    setIsAssigning(true);

    const currentlyAssigned = schedules.filter(
      (s) => s.teacher_id === selectedTeacher.id
    );

    for (const schedule of currentlyAssigned) {
      if (!selectedScheduleIds.includes(schedule.id)) {
        await removeTeacherFromSchedule(schedule.id);
      }
    }

    const newlySelected = selectedScheduleIds.filter(
      (id) => !currentlyAssigned.some((s) => s.id === id)
    );

    if (newlySelected.length > 0) {
      await assignTeacherToMultipleSchedules(newlySelected, selectedTeacher.id);
    }

    setIsAssigning(false);
    setIsAssignModalOpen(false);
    setSelectedTeacher(null);
    refreshData();
  }

  function resetModalFilters() {
    setModalSearchQuery("");
    setModalRoomFilter("");
    setModalSectionFilter("");
    setModalStatusFilter("");
  }

  const roleFilterOptions = [
    { id: "ADMIN", label: "Department Admins" },
    { id: "TEACHER", label: "Instructors" },
  ];

  const modalRoleOptions = [
    { id: "TEACHER", label: "Instructor (Teaching Faculty)" },
    { id: "ADMIN", label: "Department Administrator (Sub-Admin)" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Directory Controls Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Staff & Faculty Directory
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Showing {filteredTeachers.length} registered staff accounts
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="w-full sm:w-48">
            <FilterDropdown
              options={roleFilterOptions}
              value={roleFilter}
              onChange={setRoleFilter}
              placeholder="All Staff Roles"
              allowClear={true}
              clearText="All Staff Roles"
            />
          </div>

          <div className="relative flex-1 sm:w-64">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search by name or ID..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-slate-500 transition-colors shadow-sm h-[38px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="bg-[#011B51] hover:bg-[#022a7a] text-white font-bold py-2 px-4 rounded-lg text-xs uppercase tracking-wider cursor-pointer shadow-sm transition-colors flex items-center justify-center gap-2 shrink-0 h-[38px]"
          >
            <UserPlus size={16} />
            Register Staff
          </button>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="custom-scrollbar overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                <th className="p-4 font-semibold">User ID</th>
                <th className="p-4 font-semibold">Name</th>
                <th className="p-4 font-semibold">System Role</th>
                <th className="p-4 font-semibold">Assigned Classes</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
              {paginatedTeachers.map((teacher) => {
                const assignedSchedules = teacherScheduleMap.get(teacher.id) || [];
                const isAdmin = teacher.role === "ADMIN";

                return (
                  <tr key={teacher.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-900 text-xs">
                      {teacher.user_id}
                    </td>
                    <td className="p-4 font-bold text-slate-900">
                      {teacher.name}
                    </td>
                    <td className="p-4">
                      {isAdmin ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                          <ShieldCheck size={12} />
                          Department Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                          <GraduationCap size={12} />
                          Instructor
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {isAdmin ? (
                        <span className="text-xs font-semibold text-slate-400 italic">
                          System Access
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700">
                          <Calendar size={14} className="text-slate-400" />
                          {assignedSchedules.length} Class Session(s)
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {!isAdmin && (
                        <button
                          onClick={() => openAssignModal(teacher)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-md transition-colors cursor-pointer"
                        >
                          Manage Classes
                        </button>
                      )}
                      <button
                        onClick={() => promptDeleteTeacher(teacher)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer inline-flex items-center justify-center"
                        title="Delete Staff Account"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {paginatedTeachers.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <AlertCircle size={32} className="mb-2 stroke-1" />
                      <p className="text-xs font-bold uppercase tracking-widest">
                        No staff accounts match current criteria
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredTeachers.length > 0 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-slate-200 bg-slate-50">
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

      {/* Register Staff Modal */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-in fade-in duration-200 relative">
            <button
              onClick={() => setIsRegisterModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-1">
              Register New Staff Member
            </h3>
            <p className="text-xs text-slate-500 font-semibold mb-5">
              Create an administrative or teaching profile
            </p>

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Account Role
                </label>
                <FilterDropdown
                  options={modalRoleOptions}
                  value={role}
                  onChange={(val) => setRole((val as "ADMIN" | "TEACHER") || "TEACHER")}
                  placeholder="Select Staff Role"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  User ID / Employee ID
                </label>
                <input
                  type="text"
                  placeholder={role === "ADMIN" ? "e.g. ADM-001" : "e.g. TCH-001"}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-slate-500 shadow-sm"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Engr. Juan Dela Cruz"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-slate-500 shadow-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Default Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-slate-500 shadow-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 bg-[#011B51] hover:bg-[#022a7a] text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? "Saving..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Staff Confirmation Modal */}
      {isDeleteModalOpen && teacherToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-in fade-in duration-200 relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                  Confirm Staff Deletion
                </h3>
                <p className="text-xs font-bold text-rose-600">Action cannot be undone</p>
              </div>
            </div>

            <p className="text-xs font-medium text-slate-600 leading-relaxed mb-6">
              Are you sure you want to permanently delete staff account{" "}
              <span className="font-bold text-slate-900">{teacherToDelete.name}</span> (User ID:{" "}
              <span className="font-mono font-bold text-slate-900">{teacherToDelete.user_id}</span>)?
              All assigned class schedules will automatically be unlinked.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setTeacherToDelete(null);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteTeacher}
                disabled={isDeleting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Two-Column Manage Classes Modal */}
      {isAssignModalOpen && selectedTeacher && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full p-6 animate-in fade-in duration-200 relative flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-xl text-[#011B51]">
                  <BookOpen size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                    Class Schedule Assignments
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Linking laboratory sessions for{" "}
                    <span className="text-slate-900 font-bold">{selectedTeacher.name}</span> (ID:{" "}
                    <span className="font-mono font-bold">{selectedTeacher.user_id}</span>)
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body - 2 Column Split */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 my-4 overflow-hidden flex-1">
              {/* Left Column: Dynamic Filters Sidebar */}
              <div className="md:col-span-4 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 flex flex-col space-y-4 shrink-0">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <SlidersHorizontal size={14} />
                    Filter Sessions
                  </span>
                  <button
                    onClick={resetModalFilters}
                    className="text-[10px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer uppercase tracking-wider"
                  >
                    <RotateCcw size={12} />
                    Reset
                  </button>
                </div>

                {/* Keyword Search */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Course Code or Room
                  </label>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. IT 412, Lab 1..."
                      className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-slate-500 shadow-sm"
                      value={modalSearchQuery}
                      onChange={(e) => setModalSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* Filter by Room */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Laboratory Room
                  </label>
                  <FilterDropdown
                    options={modalRoomOptions}
                    value={modalRoomFilter}
                    onChange={setModalRoomFilter}
                    placeholder="All Lab Rooms"
                    allowClear={true}
                    clearText="All Lab Rooms"
                  />
                </div>

                {/* Filter by Section */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Academic Section
                  </label>
                  <FilterDropdown
                    options={modalSectionOptions}
                    value={modalSectionFilter}
                    onChange={setModalSectionFilter}
                    placeholder="All Sections"
                    allowClear={true}
                    clearText="All Sections"
                  />
                </div>

                {/* Filter by Assignment Status */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Assignment Status
                  </label>
                  <FilterDropdown
                    options={modalStatusOptions}
                    value={modalStatusFilter}
                    onChange={setModalStatusFilter}
                    placeholder="All Session States"
                    allowClear={true}
                    clearText="All Session States"
                  />
                </div>

                {/* Counter Summary Box */}
                <div className="mt-auto bg-white p-3 rounded-lg border border-slate-200 shadow-sm space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-600">
                    <span>Matching Filters:</span>
                    <span className="font-bold text-slate-900">{modalFilteredSchedules.length}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-slate-600">
                    <span>Selected Classes:</span>
                    <span className="font-extrabold text-emerald-700">{selectedScheduleIds.length}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Selectable Schedule Cards */}
              <div className="md:col-span-8 flex flex-col overflow-hidden">
                <div className="custom-scrollbar overflow-y-auto flex-1 border border-slate-200 rounded-xl divide-y divide-slate-100 p-2">
                  {modalFilteredSchedules.map((schedule) => {
                    const isSelected = selectedScheduleIds.includes(schedule.id);
                    const isAssignedToOther =
                      schedule.teacher_id && schedule.teacher_id !== selectedTeacher.id;

                    return (
                      <div
                        key={schedule.id}
                        onClick={() => toggleScheduleSelection(schedule.id)}
                        className={`p-3.5 rounded-xl cursor-pointer transition-all flex items-center justify-between my-1.5 ${
                          isSelected
                            ? "bg-slate-100 border-2 border-slate-900 shadow-sm"
                            : "bg-white hover:bg-slate-50 border border-slate-200/80"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900 text-sm tracking-tight">
                              {schedule.course_code}
                            </span>
                            <span className="text-[11px] px-2 py-0.5 bg-slate-200/80 font-bold text-slate-700 rounded-md">
                              Sec {schedule.section}
                            </span>

                            {isSelected && (
                              <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold rounded-md uppercase tracking-wider">
                                Assigned
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-600 font-medium">
                            <span className="font-bold text-slate-800">{schedule.lab_room}</span> |{" "}
                            {schedule.date || "Recurring"} | {schedule.schedule}
                          </p>

                          {isAssignedToOther && (
                            <p className="text-[10px] text-amber-600 font-bold">
                              Assigned to: {schedule.teacher?.name || "Another Instructor"}
                            </p>
                          )}
                        </div>

                        <div
                          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 ml-3 transition-colors ${
                            isSelected
                              ? "bg-slate-900 border-slate-900 text-white"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {isSelected && <Check size={14} strokeWidth={3} />}
                        </div>
                      </div>
                    );
                  })}

                  {modalFilteredSchedules.length === 0 && (
                    <div className="p-12 text-center flex flex-col items-center justify-center text-slate-400">
                      <AlertCircle size={28} className="mb-2 stroke-1" />
                      <p className="text-xs font-bold uppercase tracking-wider">
                        No schedules match selected sidebar filters
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-100 shrink-0">
              <span className="text-xs font-bold text-slate-500">
                <span className="text-slate-900 font-black">{selectedScheduleIds.length}</span> class session(s) linked
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAssignments}
                  disabled={isAssigning}
                  className="px-5 py-2 bg-[#011B51] hover:bg-[#022a7a] text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isAssigning ? "Saving..." : "Apply Assignments"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}