"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { get, set, del } from "idb-keyval";
import {
  registerStudentToDatabase,
  recoverStudentDevice,
  checkRevokedStatus,
  getLabRooms,
  submitAttendance,
  getServerTime,
} from "@/app/actions/student";
import GeofenceGuard from "./components/GeofenceGuard";

interface AttendanceRecord {
  id: number;
  student_id: string;
  timestamp: string;
  status: string;
  signature?: string;
  schedule?: {
    course_code: string;
    section: string;
    lab_room: string;
    schedule: string;
    date: string;
  };
}

const ITEMS_PER_PAGE = 5;

export default function SmartStudentPortal() {
  const [view, setView] = useState<
    "loading" | "register" | "attendance" | "recovery"
  >("loading");

  const [studentTab, setStudentTab] = useState<"checkin" | "history">("checkin");

  const [studentId, setStudentId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [recoveryPin, setRecoveryPin] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const [labRooms, setLabRooms] = useState<string[]>([]);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [roomPin, setRoomPin] = useState("");
  const [isLogging, setIsLogging] = useState(false);

  const [historyLogs, setHistoryLogs] = useState<AttendanceRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [showDeauthModal, setShowDeauthModal] = useState(false);

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isNameLocked, setIsNameLocked] = useState(false);

  const [philippineTime, setPhilippineTime] = useState("");
  const [registeredId, setRegisteredId] = useState<string | null>(null);

  const fetchHistory = useCallback(async (idToFetch: string) => {
    if (!idToFetch) return;
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`/api/student/history?studentId=${encodeURIComponent(idToFetch)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setHistoryLogs(data.data);
      }
    } catch (error) {
      console.error("Error fetching web student history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    async function initialize() {
      const privateKey = await get("student_private_key");
      const storedId = await get("student_id");
      const localPublicKey = await get("student_public_key");

      if (privateKey && storedId) {
        const statusCheck = await checkRevokedStatus(storedId);

        const isKeyMismatched =
          statusCheck.currentPublicKey &&
          localPublicKey &&
          statusCheck.currentPublicKey !== localPublicKey;

        if (statusCheck.isRevoked || isKeyMismatched) {
          await del("student_private_key");
          await del("student_id");
          await del("student_public_key");
          setView("register");
          setIsError(true);
          setMessage("Device access was revoked or transferred to another device.");
          return;
        }

        setRegisteredId(storedId);
        setView("attendance");
        fetchRooms();
        fetchHistory(storedId);
      } else {
        setView("register");
      }
    }

    initialize();
  }, [fetchHistory]);

  useEffect(() => {
    if (view !== "attendance" || !registeredId) return;

    async function verifyActiveSession() {
      if (document.visibilityState === "visible" && registeredId) {
        const statusRes = await checkRevokedStatus(registeredId);
        const localPublicKey = await get("student_public_key");

        const isKeyMismatched =
          statusRes.currentPublicKey &&
          localPublicKey &&
          statusRes.currentPublicKey !== localPublicKey;

        if (statusRes.isRevoked || isKeyMismatched) {
          await del("student_private_key");
          await del("student_id");
          await del("student_public_key");
          setRegisteredId(null);
          setView("register");
          setIsError(true);
          setMessage(
            "Device authorization revoked or transferred. Please register this device again."
          );
        }
      }
    }

    const interval = setInterval(verifyActiveSession, 4000);
    return () => clearInterval(interval);
  }, [view, registeredId]);

  useEffect(() => {
    function updateLocalTime() {
      const now = new Date();
      const timeZone = process.env.NEXT_PUBLIC_APP_TIMEZONE || "Asia/Manila";

      const datePart = new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: timeZone,
      }).format(now);

      const timePart = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: timeZone,
      }).format(now);

      setPhilippineTime(`${datePart} • ${timePart}`);
    }

    updateLocalTime();
    const interval = setInterval(updateLocalTime, 1000);
    return () => clearInterval(interval);
  }, []);

  async function fetchRooms() {
    const response = await getLabRooms();
    if (response.success) {
      setLabRooms(response.data);
    }
  }

  async function handleIdCheck(forcedId?: string) {
    const idToSearch = typeof forcedId === "string" ? forcedId : studentId;

    if (idToSearch.length >= 4) {
      const response = await checkRevokedStatus(idToSearch);

      // FIX: Only lock the input fields if the account is revoked AND a valid name was returned
      if (response.isRevoked && response.firstName) {
        setFirstName(response.firstName);
        setLastName(response.lastName || "");
        setIsNameLocked(true);
        setMessage(
          "Account found. Please enter a new PIN to register this device."
        );
        setIsError(false);
      } else {
        // If the student doesn't exist yet, keep the fields unlocked for new registration
        setIsNameLocked(false);
      }
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    if (recoveryPin.length !== 4 || isNaN(Number(recoveryPin))) {
      setIsError(true);
      setMessage("Recovery PIN must be exactly 4 numbers.");
      return;
    }

    setIsRegistering(true);
    setMessage("");
    setIsError(false);

    try {
      const keyPair = await window.crypto.subtle.generateKey(
        { name: "ECDSA", namedCurve: "P-256" },
        false,
        ["sign", "verify"]
      );
      const exportedPublicKey = await window.crypto.subtle.exportKey(
        "spki",
        keyPair.publicKey
      );
      const publicKeyArray = Array.from(new Uint8Array(exportedPublicKey));
      const publicKeyBase64 = btoa(String.fromCharCode(...publicKeyArray));

      const dbResponse = await registerStudentToDatabase({
        studentId,
        firstName,
        lastName,
        publicKey: publicKeyBase64,
        recoveryPin,
      });

      if (dbResponse.success) {
        await set("student_private_key", keyPair.privateKey);
        await set("student_id", studentId);
        await set("student_public_key", publicKeyBase64);

        setRegisteredId(studentId);

        setMessage("Device registered successfully!");
        setTimeout(() => {
          setMessage("");
          setView("attendance");
          fetchRooms();
          fetchHistory(studentId);
        }, 1500);
      } else {
        setIsError(true);
        setMessage(dbResponse.message);
      }
    } catch (error) {
      console.error(error);
      setIsError(true);
      setMessage(
        "Server Error: Database connection failed. Keys were NOT saved."
      );
    } finally {
      setIsRegistering(false);
    }
  }

  async function handleLogAttendance(e: React.FormEvent) {
    e.preventDefault();

    if (!roomPin || roomPin.length !== 4) {
      setIsError(true);
      setMessage(
        "Please enter the 4-digit Room PIN displayed by your instructor."
      );
      return;
    }

    setIsLogging(true);
    setMessage("");
    setIsError(false);

    try {
      const storedStudentId = await get("student_id");
      const privateKey = await get("student_private_key");

      if (!storedStudentId || !privateKey || !selectedRoom) {
        setIsError(true);
        setMessage("Missing device security keys or lab room selection.");
        setIsLogging(false);
        return;
      }

      const timeResponse = await getServerTime();

      if (!timeResponse.success || !timeResponse.timestamp) {
        setIsError(true);
        setMessage("Failed to synchronize with the server clock.");
        setIsLogging(false);
        return;
      }

      const timestamp = timeResponse.timestamp;
      const messageToSign = `${storedStudentId}-${selectedRoom}-${timestamp}`;
      const encoder = new TextEncoder();
      const encodedMessage = encoder.encode(messageToSign);

      const rawSignature = await window.crypto.subtle.sign(
        { name: "ECDSA", hash: { name: "SHA-256" } },
        privateKey,
        encodedMessage
      );
      const signatureArray = Array.from(new Uint8Array(rawSignature));
      const signatureBase64 = btoa(String.fromCharCode(...signatureArray));

      const response = await submitAttendance({
        studentId: storedStudentId as string,
        labRoom: selectedRoom,
        timestamp: timestamp,
        signature: signatureBase64,
        roomPin: roomPin,
      });

      if (response.success) {
        setMessage(response.message);
        setRoomPin("");
        if (registeredId) fetchHistory(registeredId);
      } else {
        setIsError(true);
        setMessage(response.message);

        const isSecurityError =
          response.message.includes("Student not found") ||
          response.message.includes("DEVICE_REVOKED") ||
          response.message.includes("verification failed") ||
          response.message.includes("Digital signature") ||
          response.message.includes("Server error");

        if (isSecurityError) {
          await del("student_private_key");
          await del("student_id");
          await del("student_public_key");
          setTimeout(() => {
            setView("register");
            setIsError(false);
            setMessage(
              "Security key mismatch detected. Please register this device again."
            );
          }, 2000);
        }
      }
    } catch (error) {
      console.error(error);
      setIsError(true);
      setMessage("An error occurred during verification.");
    } finally {
      setIsLogging(false);
    }
  }

  async function handleRecovery(e: React.FormEvent) {
    e.preventDefault();
    setIsRegistering(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await recoverStudentDevice(studentId, recoveryPin);

      if (response.success) {
        setMessage(response.message);
        await handleIdCheck(studentId);

        await del("student_private_key");
        await del("student_public_key");
        await del("student_id");

        setTimeout(() => {
          setMessage("");
          setRecoveryPin("");
          setView("register");
        }, 2000);
      } else {
        setIsError(true);
        setMessage(response.message);
      }
    } catch (error) {
      setIsError(true);
      setMessage("Failed to process recovery.");
    } finally {
      setIsRegistering(false);
    }
  }

  async function executeDeauthorization() {
    await del("student_private_key");
    await del("student_id");
    await del("student_public_key");

    setRegisteredId(null);
    setShowDeauthModal(false);
    setView("register");
    setMessage("Device deauthorized successfully.");
    setIsError(false);
  }

  const processedLogs = useMemo(() => {
    let sorted = [...historyLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    if (historySearch.trim()) {
      const query = historySearch.toLowerCase();
      sorted = sorted.filter((log) => {
        const course = log.schedule?.course_code?.toLowerCase() || "";
        const room = log.schedule?.lab_room?.toLowerCase() || "";
        const section = log.schedule?.section?.toLowerCase() || "";
        return course.includes(query) || room.includes(query) || section.includes(query);
      });
    }

    return sorted;
  }, [historyLogs, historySearch]);

  const totalPages = Math.ceil(processedLogs.length / ITEMS_PER_PAGE) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return processedLogs.slice(start, start + ITEMS_PER_PAGE);
  }, [processedLogs, currentPage]);

  if (view === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-[#011B51] font-sans">
        <div className="flex flex-col items-center animate-pulse">
          <div className="w-12 h-12 border-4 border-[#011B51] border-t-[#FED702] rounded-full animate-spin mb-4"></div>
          Authenticating Security Keys...
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen w-full flex flex-col lg:flex-row bg-white font-sans">
      <div className="relative w-full lg:w-[40%] min-h-[25vh] sm:min-h-[30vh] lg:min-h-screen bg-[#011B51] flex flex-col justify-center lg:justify-between p-6 sm:p-10 lg:p-14 overflow-hidden shadow-md lg:shadow-2xl z-10 border-b-4 lg:border-b-0 lg:border-r-4 border-[#1e3585] shrink-0">
        <div className="absolute inset-0 z-0 bg-[#011B51]">
          <img
            src="/labs.jpg"
            alt="University of the Assumption Laboratory Background"
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-[#011B51]/60"></div>
        </div>

        <div className="relative z-10 flex flex-col h-full">
          <div className="flex flex-row lg:flex-col items-center lg:items-start space-x-4 lg:space-x-0">
            <img
              src="/ua-logo.png"
              alt="University of the Assumption Logo"
              className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 object-contain lg:mb-8 drop-shadow-xl shrink-0"
            />

            <h1 className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-white tracking-tight leading-tight uppercase drop-shadow-2xl">
              Student <br className="hidden lg:block" />
              <span className="text-[#FED702]">Lab Attendance</span>
              <br className="hidden lg:block" />
              <span className="lg:hidden"> System</span>
              <span className="hidden lg:block">System</span>
            </h1>
          </div>

          <div className="hidden lg:block mt-auto pt-12">
            <p className="text-white/90 text-base lg:text-lg leading-relaxed font-medium drop-shadow-lg max-w-xl">
              Secure entry portal for registered students. Use this encrypted
              interface to register your device and log laboratory sessions
              effortlessly.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-[60%] flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16 bg-white relative">
        <a
          href="/"
          className="absolute top-4 right-6 lg:top-8 lg:right-10 text-xs font-bold text-slate-400 hover:text-[#011B51] transition-colors uppercase tracking-wider"
        >
          &larr; Main Portal
        </a>

        <div className="w-full max-w-lg mt-6 lg:mt-0">
          {view === "register" && (
            <div className="animate-in fade-in duration-500">
              <div className="mb-8 lg:mb-10 text-center lg:text-left">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#011B51] uppercase tracking-tight">
                  Register Device
                </h2>
                <div className="w-12 lg:w-16 h-1 lg:h-1.5 bg-[#FED702] mt-3 lg:mt-4 mb-2 lg:mb-3 rounded-full mx-auto lg:mx-0"></div>
                <p className="text-slate-500 text-xs sm:text-sm font-semibold uppercase tracking-wide">
                  One-time setup for ECC tracking.
                </p>
              </div>

              <form
                onSubmit={handleRegister}
                className="space-y-4 lg:space-y-6"
              >
                <div>
                  <label className="block text-[10px] sm:text-xs font-bold text-[#011B51] uppercase tracking-wide mb-1.5 lg:mb-2 ml-1">
                    Student ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2024-1234"
                    className={`w-full px-4 lg:px-5 py-3.5 lg:py-4 rounded-xl border outline-none text-sm sm:text-base font-medium transition-all shadow-sm ${isNameLocked ? "bg-slate-100 text-slate-500 cursor-not-allowed border-transparent shadow-none" : "bg-slate-50 border-slate-200 focus:bg-white focus:border-[#011B51] focus:ring-2 focus:ring-[#011B51]/20"}`}
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    onBlur={() => handleIdCheck()}
                    disabled={isNameLocked}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                  <div>
                    <label className="block text-[10px] sm:text-xs font-bold text-[#011B51] uppercase tracking-wide mb-1.5 lg:mb-2 ml-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      placeholder="Jane"
                      className={`w-full px-4 lg:px-5 py-3.5 lg:py-4 rounded-xl border outline-none text-sm sm:text-base font-medium transition-all shadow-sm ${isNameLocked ? "bg-slate-100 text-slate-500 cursor-not-allowed border-transparent shadow-none" : "bg-slate-50 border-slate-200 focus:bg-white focus:border-[#011B51] focus:ring-2 focus:ring-[#011B51]/20"}`}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      disabled={isNameLocked}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] sm:text-xs font-bold text-[#011B51] uppercase tracking-wide mb-1.5 lg:mb-2 ml-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      placeholder="Doe"
                      className={`w-full px-4 lg:px-5 py-3.5 lg:py-4 rounded-xl border outline-none text-sm sm:text-base font-medium transition-all shadow-sm ${isNameLocked ? "bg-slate-100 text-slate-500 cursor-not-allowed border-transparent shadow-none" : "bg-slate-50 border-slate-200 focus:bg-white focus:border-[#011B51] focus:ring-2 focus:ring-[#011B51]/20"}`}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      disabled={isNameLocked}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] sm:text-xs font-bold text-[#011B51] uppercase tracking-wide mb-1.5 lg:mb-2 ml-1">
                    Security PIN
                  </label>
                  <input
                    type="password"
                    placeholder="Create a 4-Digit PIN"
                    maxLength={4}
                    pattern="\d{4}"
                    title="Must be exactly 4 numbers"
                    className="w-full px-4 lg:px-5 py-3.5 lg:py-4 rounded-xl bg-slate-50 border border-slate-200 outline-none text-sm sm:text-base font-medium focus:bg-white focus:border-[#011B51] focus:ring-2 focus:ring-[#011B51]/20 transition-all shadow-sm"
                    value={recoveryPin}
                    onChange={(e) => setRecoveryPin(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isRegistering}
                  className="w-full bg-[#011B51] hover:bg-[#022a7a] text-white font-bold py-3.5 lg:py-4 rounded-xl mt-6 lg:mt-8 transition-all shadow-md hover:shadow-lg lg:hover:-translate-y-0.5 border-b-4 border-[#A51A21] disabled:opacity-70 disabled:border-[#011B51] disabled:transform-none text-xs sm:text-sm uppercase tracking-wider cursor-pointer"
                >
                  {isRegistering ? "Registering Device..." : "Register Device"}
                </button>
              </form>

              {isNameLocked ? (
                <div className="mt-8 lg:mt-12 text-center border-t border-slate-100 pt-6 lg:pt-8">
                  <button
                    type="button"
                    onClick={() => {
                      setIsNameLocked(false);
                      setStudentId("");
                      setFirstName("");
                      setLastName("");
                      setMessage("");
                    }}
                    className="text-xs sm:text-sm font-bold text-slate-400 hover:text-[#011B51] uppercase tracking-wide transition-colors cursor-pointer"
                  >
                    Not your account? Clear and try again
                  </button>
                </div>
              ) : (
                <div className="mt-8 lg:mt-12 text-center border-t border-slate-100 pt-6 lg:pt-8">
                  <button
                    type="button"
                    onClick={() => {
                      setView("recovery");
                      setMessage("");
                      setIsError(false);
                    }}
                    className="text-xs sm:text-sm font-bold text-slate-400 hover:text-[#A51A21] uppercase tracking-wide transition-colors cursor-pointer"
                  >
                    Lost your device?{" "}
                    <span className="underline underline-offset-4 decoration-2">
                      Recover account
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}

          {view === "recovery" && (
            <div className="animate-in fade-in duration-500">
              <div className="mb-8 lg:mb-10 text-center lg:text-left">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#011B51] uppercase tracking-tight">
                  Device Recovery
                </h2>
                <div className="w-12 lg:w-16 h-1 lg:h-1.5 bg-[#A51A21] mt-3 lg:mt-4 mb-2 lg:mb-3 rounded-full mx-auto lg:mx-0"></div>
                <p className="text-slate-500 text-xs sm:text-sm font-semibold uppercase tracking-wide">
                  Revoke your old device access safely.
                </p>
              </div>

              <form
                onSubmit={handleRecovery}
                className="space-y-4 lg:space-y-6"
              >
                <div>
                  <label className="block text-[10px] sm:text-xs font-bold text-[#011B51] uppercase tracking-wide mb-1.5 lg:mb-2 ml-1">
                    Student ID
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Student ID"
                    className="w-full px-4 lg:px-5 py-3.5 lg:py-4 rounded-xl bg-slate-50 border border-slate-200 outline-none text-sm sm:text-base font-medium focus:bg-white focus:border-[#011B51] focus:ring-2 focus:ring-[#011B51]/20 transition-all shadow-sm"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] sm:text-xs font-bold text-[#011B51] uppercase tracking-wide mb-1.5 lg:mb-2 ml-1">
                    Security PIN
                  </label>
                  <input
                    type="password"
                    placeholder="Enter 4-Digit PIN"
                    maxLength={4}
                    className="w-full px-4 lg:px-5 py-3.5 lg:py-4 rounded-xl bg-slate-50 border border-slate-200 outline-none text-sm sm:text-base font-medium focus:bg-[#011B51]/5 focus:border-[#011B51] focus:ring-2 focus:ring-[#011B51]/20 transition-all tracking-[0.3em] shadow-sm"
                    value={recoveryPin}
                    onChange={(e) => setRecoveryPin(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isRegistering}
                  className="w-full bg-[#A51A21] hover:bg-[#851319] text-white font-bold py-3.5 lg:py-4 rounded-xl mt-6 lg:mt-8 transition-all shadow-md hover:shadow-lg lg:hover:-translate-y-0.5 border-b-4 border-[#610a10] disabled:opacity-70 disabled:border-[#A51A21] disabled:transform-none text-xs sm:text-sm uppercase tracking-wider cursor-pointer"
                >
                  {isRegistering
                    ? "Processing Request..."
                    : "Revoke Old Device"}
                </button>
              </form>

              <div className="mt-8 lg:mt-12 text-center border-t border-slate-100 pt-6 lg:pt-8">
                <button
                  onClick={() => {
                    setView("register");
                    setMessage("");
                    setIsError(false);
                  }}
                  className="text-xs sm:text-sm font-bold text-slate-400 hover:text-[#011B51] uppercase tracking-wide transition-colors cursor-pointer"
                >
                  &larr; Back to Registration
                </button>
              </div>
            </div>
          )}

          {view === "attendance" && (
            <div className="animate-in fade-in duration-500">
              <div className="mb-6 text-center lg:text-left">
                <span className="inline-block px-3.5 py-1 mb-4 rounded-full bg-[#011B51]/10 text-[#011B51] text-xs font-black uppercase tracking-widest border border-[#011B51]/20">
                  Student ID: {registeredId}
                </span>

                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 mb-6">
                  <button
                    type="button"
                    onClick={() => setStudentTab("checkin")}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${studentTab === "checkin"
                        ? "bg-[#011B51] text-white shadow-md"
                        : "text-slate-500 hover:text-[#011B51]"
                      }`}
                  >
                    Log Attendance
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStudentTab("history");
                      setCurrentPage(1);
                      if (registeredId) fetchHistory(registeredId);
                    }}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${studentTab === "history"
                        ? "bg-[#011B51] text-white shadow-md"
                        : "text-slate-500 hover:text-[#011B51]"
                      }`}
                  >
                    My History
                  </button>
                </div>
              </div>

              {studentTab === "checkin" ? (
                <GeofenceGuard>
                  <form
                    onSubmit={handleLogAttendance}
                    className="space-y-4 lg:space-y-6"
                  >
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-center shadow-sm">
                      <div className="flex items-center space-x-3 text-left">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 text-[#011B51]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Local Standard Time
                          </p>
                          <p className="text-sm font-bold text-[#011B51]">
                            {philippineTime || "Syncing clock..."}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] sm:text-xs font-bold text-[#011B51] uppercase tracking-wide mb-1.5 lg:mb-2 ml-1">
                        Facility Selection
                      </label>
                      <select
                        className="w-full px-4 lg:px-5 py-4 lg:py-5 rounded-xl bg-slate-50 border border-slate-200 outline-none cursor-pointer text-sm sm:text-base font-medium focus:bg-white focus:border-[#011B51] focus:ring-2 focus:ring-[#011B51]/20 transition-all shadow-sm appearance-none"
                        value={selectedRoom}
                        onChange={(e) => setSelectedRoom(e.target.value)}
                        required
                      >
                        <option value="" disabled>
                          Select your laboratory room...
                        </option>
                        {labRooms.map((room, index) => (
                          <option key={index} value={room}>
                            {room}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] sm:text-xs font-bold text-[#011B51] uppercase tracking-wide mb-1.5 lg:mb-2 ml-1">
                        Room PIN
                      </label>
                      <input
                        type="text"
                        maxLength={4}
                        className="w-full px-4 lg:px-5 py-3.5 lg:py-4 rounded-xl bg-slate-50 border border-slate-200 outline-none text-center text-lg sm:text-xl font-mono font-bold tracking-[0.3em] focus:bg-white focus:border-[#011B51] focus:ring-2 focus:ring-[#011B51]/20 transition-all shadow-sm"
                        value={roomPin}
                        onChange={(e) =>
                          setRoomPin(e.target.value.replace(/\D/g, ""))
                        }
                        placeholder="0000"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLogging || labRooms.length === 0}
                      className="w-full bg-[#011B51] hover:bg-[#022a7a] text-white font-bold py-3.5 lg:py-4 rounded-xl mt-6 lg:mt-8 transition-all shadow-md hover:shadow-lg lg:hover:-translate-y-0.5 border-b-4 border-[#A51A21] disabled:opacity-70 disabled:border-[#011B51] disabled:transform-none text-xs sm:text-sm uppercase tracking-wider cursor-pointer"
                    >
                      {isLogging
                        ? "Verifying Keys..."
                        : "Securely Log Attendance"}
                    </button>
                  </form>
                </GeofenceGuard>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-extrabold text-[#011B51] uppercase tracking-wide">
                        Check-In History
                      </h3>
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                        {processedLogs.length} Total
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Search course or room..."
                        value={historySearch}
                        onChange={(e) => {
                          setHistorySearch(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-[#011B51] transition-all w-full sm:w-48"
                      />
                    </div>
                  </div>

                  {isLoadingHistory ? (
                    <div className="p-12 text-center text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse">
                      Loading attendance records...
                    </div>
                  ) : processedLogs.length === 0 ? (
                    <div className="p-8 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-500 font-medium text-xs">
                      {historySearch ? "No logs match your search filter." : "No attendance logs recorded for this student ID."}
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                        {paginatedLogs.map((log) => {
                          const isLate = log.status === "LATE";
                          const isManual = log.signature && log.signature.includes("OVERRIDE");

                          return (
                            <div
                              key={log.id}
                              className="p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-slate-300 transition-all hover:shadow-sm"
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-bold text-sm text-[#011B51]">
                                  {log.schedule?.course_code || "CLASS SESSION"} (Sec {log.schedule?.section || "N/A"})
                                </span>
                                <span
                                  className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider border ${isLate
                                      ? "bg-amber-50 text-amber-800 border-amber-200"
                                      : "bg-emerald-50 text-emerald-800 border-emerald-200"
                                    }`}
                                >
                                  {isLate ? "LATE" : "ON TIME"}
                                </span>
                              </div>

                              <p className="text-xs font-medium text-slate-600">
                                Facility: {log.schedule?.lab_room || "Laboratory"}
                              </p>

                              {isManual && (
                                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                                  Manual Override
                                </span>
                              )}

                              <p className="text-[11px] font-medium text-slate-400 mt-2">
                                {new Date(log.timestamp).toLocaleString("en-US", {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-bold text-slate-500">
                          <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
                          >
                            Previous
                          </button>
                          <span>
                            Page {currentPage} of {totalPages}
                          </span>
                          <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={() => setShowDeauthModal(true)}
                  className="text-xs font-bold text-slate-400 hover:text-rose-600 uppercase tracking-wider transition-colors cursor-pointer underline underline-offset-4"
                >
                  Deauthorize This Device
                </button>
              </div>
            </div>
          )}

          {message && (
            <div
              className={`mt-6 lg:mt-8 p-4 lg:p-5 rounded-xl text-center text-xs sm:text-sm font-bold uppercase tracking-wide border-2 ${isError ? "bg-rose-50 text-rose-700 border-rose-200" : message.includes("LATE") ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}
            >
              {message}
            </div>
          )}
        </div>
      </div>

      {/* Custom Deauthorization Confirmation Modal */}
      {showDeauthModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <div>
              <h3 className="text-lg font-black text-[#011B51] uppercase tracking-tight">
                Deauthorize Device?
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">
                This action deletes your local cryptographic security keys. You will need to register or perform account recovery to check in again.
              </p>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeauthModal(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDeauthorization}
                className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-md cursor-pointer"
              >
                Deauthorize
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}