"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { get, set, del } from "idb-keyval";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import {
  getLabRooms,
  submitAttendance,
  getServerTime,
} from "@/app/actions/student";
import GeofenceGuard from "./components/GeofenceGuard";
import { usePusherEvent } from "@/hooks/usePusher"; // Integrated clean real-time hook

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
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
const ALLOWED_DOMAINS = process.env.NEXT_PUBLIC_ALLOWED_DOMAINS || "ua.edu.ph";
const STUDENT_ID_PLACEHOLDER = process.env.NEXT_PUBLIC_STUDENT_ID_PLACEHOLDER || "2023001839";

function StudentPortalContent() {
  const [view, setView] = useState<
    "loading" | "login" | "onboarding" | "attendance" | "recovery_verify" | "recovery_set_pin"
  >("loading");

  const [studentTab, setStudentTab] = useState<"checkin" | "history">("checkin");

  const [googleIdToken, setGoogleIdToken] = useState("");
  const [googleEmail, setGoogleEmail] = useState("");

  const [studentId, setStudentId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [recoveryPin, setRecoveryPin] = useState("");
  const [newRecoveryPin, setNewRecoveryPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [cachedSessionToken, setCachedSessionToken] = useState("");
  const [cachedKeyPair, setCachedKeyPair] = useState<any>(null);
  const [cachedPublicKeyBase64, setCachedPublicKeyBase64] = useState("");

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

  const [philippineTime, setPhilippineTime] = useState("");
  const [registeredId, setRegisteredId] = useState<string | null>(null);

  const formattedDomains = useMemo(() => {
    return ALLOWED_DOMAINS.split(',').map(d => `@${d.trim()}`).join(' or ');
  }, []);

  const fetchHistory = useCallback(async (idToFetch: string) => {
    if (!idToFetch) return;
    setIsLoadingHistory(true);
    try {
      const res = await fetch(
        `/api/student/history?studentId=${encodeURIComponent(idToFetch)}`
      );
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

  const fetchRooms = useCallback(async () => {
    const response = await getLabRooms();
    if (response.success) {
      setLabRooms(response.data);
    }
  }, []);

  // --- Pusher Real-Time Background Synchronization ---
  // Instantly re-fetch available lab rooms when an admin/teacher makes scheduling changes
  usePusherEvent("schedules-channel", "schedule-created", () => {
    if (view === "attendance") fetchRooms();
  });
  usePusherEvent("schedules-channel", "schedule-updated", () => {
    if (view === "attendance") fetchRooms();
  });
  usePusherEvent("schedules-channel", "schedule-deleted", () => {
    if (view === "attendance") {
      fetchRooms();
      setSelectedRoom(""); // Clear selection to prevent out-of-sync submits
    }
  });

  // Watch individual student security channel for account recovery context shifts
  usePusherEvent(`student-${registeredId}-channel`, "recovery-pin-updated", () => {
    if (registeredId) fetchHistory(registeredId);
  });

  useEffect(() => {
    async function initializeSession() {
      const privateKey = await get("student_private_key");
      const storedId = await get("student_id");
      const localPublicKey = await get("student_public_key");
      const localSessionToken = await get("session_token");

      if (privateKey && storedId) {
        try {
          const url = `/api/student/check-status?studentId=${encodeURIComponent(storedId)}&sessionToken=${encodeURIComponent(localSessionToken || "")}&publicKey=${encodeURIComponent(localPublicKey || "")}`;

          const checkRes = await fetch(url, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "x-student-id": storedId,
              "x-session-token": localSessionToken || "",
            },
          });

          if (checkRes.status === 401 || !checkRes.ok) {
            await del("student_private_key");
            await del("student_id");
            await del("student_public_key");
            await del("session_token");
            setView("login");
            setIsError(true);
            setMessage("Session has expired or device binding access was transferred.");
            return;
          }

          setRegisteredId(storedId);
          setView("attendance");
          fetchRooms();
          fetchHistory(storedId);
        } catch (err) {
          console.error("Failed to execute initial network status validation pass:", err);
          setRegisteredId(storedId);
          setView("attendance");
          fetchRooms();
          fetchHistory(storedId);
        }
      } else {
        setView("login");
      }
    }

    initializeSession();
  }, [fetchHistory, fetchRooms]);

  useEffect(() => {
    if (view !== "attendance" || !registeredId) return;

    async function verifyActiveSession() {
      if (document.visibilityState === "visible" && registeredId) {
        const localPublicKey = await get("student_public_key");
        const localSessionToken = await get("session_token");

        try {
          const url = `/api/student/check-status?studentId=${encodeURIComponent(registeredId)}&sessionToken=${encodeURIComponent(localSessionToken || "")}&publicKey=${encodeURIComponent(localPublicKey || "")}`;

          const response = await fetch(url, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "x-student-id": registeredId,
              "x-session-token": localSessionToken || "",
            },
          });

          if (response.status === 401) {
            console.warn("[SECURITY] Session token mismatch detected. Evicting local token context.");
            await del("student_private_key");
            await del("student_id");
            await del("student_public_key");
            await del("session_token");

            setRegisteredId(null);
            setView("login");
            setIsError(true);
            setMessage(
              "Active session revoked. A newer login signature was initiated on another terminal."
            );
          }
        } catch (error) {
          console.error("Real-time session token status verification polling network error:", error);
        }
      }
    }

    // Polling relaxed to 20s since WebSocket triggers are instant and protect database connections
    const interval = setInterval(verifyActiveSession, 20000);
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
        timeZone,
      }).format(now);

      const timePart = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone,
      }).format(now);

      setPhilippineTime(`${datePart} • ${timePart}`);
    }

    updateLocalTime();
    const interval = setInterval(updateLocalTime, 1000);
    return () => clearInterval(interval);
  }, []);

  async function handleGoogleSuccess(credentialResponse: any) {
    if (!credentialResponse.credential) {
      setIsError(true);
      setMessage("Google authentication failed to produce token.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    setIsError(false);

    const token = credentialResponse.credential;
    setGoogleIdToken(token);

    try {
      const res = await fetch("/api/student/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: token }),
      });

      const data = await res.json();

      if (!res.ok) {
        setIsError(true);
        setMessage(data.error || "Google authentication rejected.");
        setIsSubmitting(false);
        return;
      }

      if (data.isRegistered && data.studentId) {
        const privateKey = await get("student_private_key");

        if (!privateKey) {
          setStudentId(data.studentId);
          setGoogleEmail(data.email || "");
          setFirstName(data.firstName || "");
          setLastName(data.lastName || "");

          setView("recovery_verify");
          setIsError(true);
          setMessage("Device Re-authorization Required: This account is active on another terminal. Provide your PIN to complete the device transfer.");
          setIsSubmitting(false);
          return;
        }

        await set("student_id", data.studentId);
        await set("session_token", data.sessionToken);
        if (data.publicKey) {
          await set("student_public_key", data.publicKey);
        }

        setRegisteredId(data.studentId);
        setView("attendance");
        fetchRooms();
        fetchHistory(data.studentId);
        return;
      }

      if (!data.isRegistered && data.email) {
        setGoogleEmail(data.email);
        setFirstName(data.firstName || "");
        setLastName(data.lastName || "");
        setView("onboarding");
      }
    } catch (error) {
      console.error("Google Auth error:", error);
      setIsError(true);
      setMessage("Unable to verify Google credentials with backend server.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCompleteOnboarding(e: React.FormEvent) {
    e.preventDefault();

    if (recoveryPin.length !== 6 || isNaN(Number(recoveryPin))) {
      setIsError(true);
      setMessage("Recovery PIN must be exactly 6 numeric digits.");
      return;
    }

    setIsSubmitting(true);
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

      const res = await fetch("/api/student/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken: googleIdToken,
          studentId,
          firstName,
          lastName,
          publicKey: publicKeyBase64,
          recoveryPin,
        }),
      });

      const data = await res.json();

      if (data.success) {
        await set("student_private_key", keyPair.privateKey);
        await set("student_id", studentId);
        await set("student_public_key", publicKeyBase64);
        await set("session_token", data.sessionToken);

        setRegisteredId(studentId);
        setMessage("Student onboarding complete and device registered.");
        setTimeout(() => {
          setMessage("");
          setView("attendance");
          fetchRooms();
          fetchHistory(studentId);
        }, 1200);
      } else {
        setIsError(true);
        setMessage(data.message || "Onboarding failed. Please try again.");
      }
    } catch (error) {
      console.error("Onboarding Error:", error);
      setIsError(true);
      setMessage("Server error encountered during account onboarding.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRecoveryStep1Verify(e: React.FormEvent) {
    e.preventDefault();

    if (recoveryPin.length !== 6 || isNaN(Number(recoveryPin))) {
      setIsError(true);
      setMessage("Current Recovery PIN must be exactly 6 numeric digits.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    setIsError(false);

    try {
      const keyPair = await window.crypto.subtle.generateKey(
        { name: "ECDSA", namedCurve: "P-256" },
        false,
        ["sign", "verify"]
      );

      const exportedPublicKey = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
      const publicKeyArray = Array.from(new Uint8Array(exportedPublicKey));
      const publicKeyBase64 = btoa(String.fromCharCode(...publicKeyArray));

      const res = await fetch("/api/student/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: studentId,
          recoveryPin: recoveryPin,
          publicKey: publicKeyBase64,
        }),
      });

      const data = await res.json();

      if (data.success && data.sessionToken) {
        setCachedSessionToken(data.sessionToken);
        setCachedKeyPair(keyPair);
        setCachedPublicKeyBase64(publicKeyBase64);

        setGoogleEmail(data.email || googleEmail);
        setFirstName(data.firstName || firstName);
        setLastName(data.lastName || lastName);

        setMessage("Verification Successful! Previous hardware terminal sessions dropped.");
        setIsError(false);
        setTimeout(() => {
          setMessage("");
          setView("recovery_set_pin");
        }, 1200);
      } else {
        setIsError(true);
        setMessage(data.message || "Recovery failed. Incorrect Student ID or PIN combination.");
      }
    } catch (error) {
      console.error("Recovery Step 1 error:", error);
      setIsError(true);
      setMessage("An error occurred during account recovery validation.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRecoveryStep2CommitPin(e: React.FormEvent) {
    e.preventDefault();

    if (!newRecoveryPin || newRecoveryPin.length !== 6 || isNaN(Number(newRecoveryPin))) {
      setIsError(true);
      setMessage("New Recovery PIN configuration must consist of exactly 6 numeric digits.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    setIsError(false);

    try {
      const res = await fetch("/api/student/update-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: studentId,
          newPin: newRecoveryPin,
          sessionToken: cachedSessionToken,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        await set("student_private_key", cachedKeyPair.privateKey);
        await set("student_id", studentId);
        await set("student_public_key", cachedPublicKeyBase64);
        await set("session_token", cachedSessionToken);

        setRegisteredId(studentId);
        setMessage("Account successfully recovered and PIN code updated!");
        setRecoveryPin("");
        setNewRecoveryPin("");

        setTimeout(() => {
          setMessage("");
          setView("attendance");
          fetchRooms();
          fetchHistory(studentId);
        }, 1200);
      } else {
        setIsError(true);
        setMessage(data.message || "Failed to finalize PIN setup updates.");
      }
    } catch (error) {
      console.error("Recovery Step 2 error:", error);
      setIsError(true);
      setMessage("An error occurred while writing PIN updates.");
    } finally {
      setIsSubmitting(false);
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
        timestamp,
        signature: signatureBase64,
        roomPin,
      });

      if (response.success) {
        setMessage(response.message || "Attendance securely recorded.");
        setRoomPin("");
        if (registeredId) fetchHistory(registeredId);
      } else {
        setIsError(true);
        setMessage(response.message || "Attendance submission failed.");

        const isSecurityError =
          response.message &&
          (response.message.includes("Student not found") ||
            response.message.includes("DEVICE_REVOKED") ||
            response.message.includes("verification failed") ||
            response.message.includes("Digital signature"));

        if (isSecurityError) {
          await del("student_private_key");
          await del("student_id");
          await del("student_public_key");
          await del("session_token");
          setTimeout(() => {
            setView("login");
            setIsError(false);
            setMessage("Security key mismatch. Please authenticate again.");
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

  async function executeDeauthorization() {
    await del("student_private_key");
    await del("student_id");
    await del("student_public_key");
    await del("session_token");

    setRegisteredId(null);
    setShowDeauthModal(false);
    setView("login");
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
        return (
          course.includes(query) ||
          room.includes(query) ||
          section.includes(query)
        );
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
          <div className="w-12 h-12 border-4 border-[#011B51] border-t-[#FED702] rounded-full animate-spin mb-4" />
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
            alt="University of the Assumption Laboratory"
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-[#011B51]/60" />
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
              Secure entry portal for registered students. Authenticate using
              your institutional Google SSO account to log laboratory sessions
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
          {view === "login" && (
            <div className="animate-in fade-in duration-500">
              <div className="mb-8 lg:mb-10 text-center lg:text-left">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#011B51] uppercase tracking-tight">
                  Institutional Login
                </h2>
                <div className="w-12 lg:w-16 h-1 lg:h-1.5 bg-[#FED702] mt-3 lg:mt-4 mb-2 lg:mb-3 rounded-full mx-auto lg:mx-0" />
                <p className="text-slate-500 text-xs sm:text-sm font-semibold uppercase tracking-wide">
                  Sign in with your official institutional email.
                </p>
              </div>

              <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border border-slate-200 rounded-2xl shadow-sm space-y-6">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => {
                    setIsError(true);
                    setMessage("Google Sign-In popup closed or failed.");
                  }}
                  theme="filled_blue"
                  shape="rectangular"
                  size="large"
                />

                <p className="text-xs text-center text-slate-500 font-medium">
                  Access is strictly restricted to valid {formattedDomains} institutional addresses.
                </p>
              </div>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setGoogleEmail("");
                    setStudentId("");
                    setFirstName("");
                    setLastName("");
                    setView("recovery_verify");
                    setIsError(false);
                    setMessage("");
                  }}
                  className="text-xs font-bold text-slate-400 hover:text-[#011B51] uppercase tracking-wider transition-all cursor-pointer underline underline-offset-4"
                >
                  Recover/Transfer Account to this Device
                </button>
              </div>
            </div>
          )}

          {view === "onboarding" && (
            <div className="animate-in fade-in duration-500">
              <div className="mb-8 lg:mb-10 text-center lg:text-left">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#011B51] uppercase tracking-tight">
                  One-Time Profile Setup
                </h2>
                <div className="w-12 lg:w-16 h-1 lg:h-1.5 bg-[#FED702] mt-3 lg:mt-4 mb-2 lg:mb-3 rounded-full mx-auto lg:mx-0" />
                <p className="text-slate-500 text-xs sm:text-sm font-semibold uppercase tracking-wide">
                  Bind your Student ID and hardware key to complete onboarding.
                </p>
              </div>

              <form
                onSubmit={handleCompleteOnboarding}
                className="space-y-4 lg:space-y-6"
              >
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-1">
                    Authenticated Email
                  </p>
                  <p className="text-sm font-bold text-[#011B51]">{googleEmail}</p>
                </div>

                <div>
                  <label className="block text-[10px] sm:text-xs font-bold text-[#011B51] uppercase tracking-wide mb-1.5 lg:mb-2 ml-1">
                    Student ID
                  </label>
                  <input
                    type="text"
                    placeholder={`e.g. ${STUDENT_ID_PLACEHOLDER}`}
                    className="w-full px-4 lg:px-5 py-3.5 lg:py-4 rounded-xl bg-slate-50 border border-slate-200 outline-none text-sm sm:text-base font-medium focus:bg-white focus:border-[#011B51] focus:ring-2 focus:ring-[#011B51]/20 transition-all shadow-sm"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
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
                      className="w-full px-4 lg:px-5 py-3.5 lg:py-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 cursor-not-allowed outline-none text-sm sm:text-base font-medium"
                      value={firstName}
                      disabled
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] sm:text-xs font-bold text-[#011B51] uppercase tracking-wide mb-1.5 lg:mb-2 ml-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 lg:px-5 py-3.5 lg:py-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 cursor-not-allowed outline-none text-sm sm:text-base font-medium"
                      value={lastName}
                      disabled
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] sm:text-xs font-bold text-[#011B51] uppercase tracking-wide mb-1.5 lg:mb-2 ml-1">
                    Recovery PIN (6 Digits)
                  </label>
                  <input
                    type="password"
                    placeholder="Create 6-Digit PIN"
                    maxLength={6}
                    pattern="\d{6}"
                    title="Must be exactly 6 digits"
                    className="w-full px-4 lg:px-5 py-3.5 lg:py-4 rounded-xl bg-slate-50 border border-slate-200 outline-none text-sm sm:text-base font-medium focus:bg-white focus:border-[#011B51] focus:ring-2 focus:ring-[#011B51]/20 transition-all shadow-sm"
                    value={recoveryPin}
                    onChange={(e) => setRecoveryPin(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#011B51] hover:bg-[#022a7a] text-white font-bold py-3.5 lg:py-4 rounded-xl mt-6 lg:mt-8 transition-all shadow-md hover:shadow-lg lg:hover:-translate-y-0.5 border-b-4 border-[#A51A21] disabled:opacity-70 disabled:border-[#011B51] disabled:transform-none text-xs sm:text-sm uppercase tracking-wider cursor-pointer"
                >
                  {isSubmitting
                    ? "Registering Profile..."
                    : "Complete Setup & Register"}
                </button>
              </form>

              <div className="mt-8 lg:mt-12 text-center border-t border-slate-100 pt-6 lg:pt-8">
                <button
                  type="button"
                  onClick={() => {
                    setView("login");
                    setMessage("");
                  }}
                  className="text-xs sm:text-sm font-bold text-slate-400 hover:text-[#011B51] uppercase tracking-wide transition-colors cursor-pointer"
                >
                  &larr; Cancel and Switch Account
                </button>
              </div>
            </div>
          )}

          {view === "recovery_verify" && (
            <div className="animate-in fade-in duration-500">
              <div className="mb-8 lg:mb-10 text-center lg:text-left">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#011B51] uppercase tracking-tight">
                  Device Authorization Transfer
                </h2>
                <div className="w-12 lg:w-16 h-1 lg:h-1.5 bg-[#FED702] mt-3 lg:mt-4 mb-2 lg:mb-3 rounded-full mx-auto lg:mx-0" />
                <p className="text-slate-500 text-xs sm:text-sm font-semibold uppercase tracking-wide">
                  Authenticate and clear previous active sessions to sync mappings.
                </p>
              </div>

              <form
                onSubmit={handleRecoveryStep1Verify}
                className="space-y-4 lg:space-y-6"
              >
                <div>
                  <label className="block text-[10px] sm:text-xs font-bold text-[#011B51] uppercase tracking-wide mb-1.5 lg:mb-2 ml-1">
                    Student ID
                  </label>
                  <input
                    type="text"
                    placeholder={`e.g. ${STUDENT_ID_PLACEHOLDER}`}
                    className="w-full px-4 lg:px-5 py-3.5 lg:py-4 rounded-xl bg-slate-50 border border-slate-200 outline-none text-sm sm:text-base font-medium focus:bg-white focus:border-[#011B51] focus:ring-2 focus:ring-[#011B51]/20 transition-all shadow-sm"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] sm:text-xs font-bold text-[#011B51] uppercase tracking-wide mb-1.5 lg:mb-2 ml-1">
                    Current 6-Digit Recovery PIN
                  </label>
                  <input
                    type="password"
                    placeholder="Enter Current PIN"
                    maxLength={6}
                    pattern="\d{6}"
                    title="Must be exactly 6 digits"
                    className="w-full px-4 lg:px-5 py-3.5 lg:py-4 rounded-xl bg-slate-50 border border-slate-200 outline-none text-center text-lg sm:text-xl font-mono font-bold tracking-[0.3em] focus:bg-white focus:border-[#011B51] focus:ring-2 focus:ring-[#011B51]/20 transition-all shadow-sm"
                    value={recoveryPin}
                    onChange={(e) => setRecoveryPin(e.target.value.replace(/\D/g, ""))}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#011B51] hover:bg-[#022a7a] text-white font-bold py-3.5 lg:py-4 rounded-xl mt-6 lg:mt-8 transition-all shadow-md hover:shadow-lg lg:hover:-translate-y-0.5 border-b-4 border-[#A51A21] disabled:opacity-70 disabled:border-[#011B51] disabled:transform-none text-xs sm:text-sm uppercase tracking-wider cursor-pointer"
                >
                  {isSubmitting
                    ? "Verifying..."
                    : "Verify & Evict Other Terminal"}
                </button>
              </form>

              <div className="mt-8 lg:mt-12 text-center border-t border-slate-100 pt-6 lg:pt-8">
                <button
                  type="button"
                  onClick={() => {
                    setView("login");
                    setMessage("");
                    setIsError(false);
                    setStudentId("");
                    setRecoveryPin("");
                    setNewRecoveryPin("");
                  }}
                  className="text-xs sm:text-sm font-bold text-slate-400 hover:text-[#011B51] uppercase tracking-wide transition-colors cursor-pointer"
                >
                  &larr; Back to Institutional Login
                </button>
              </div>
            </div>
          )}

          {view === "recovery_set_pin" && (
            <div className="animate-in fade-in duration-500">
              <div className="mb-8 lg:mb-10 text-center lg:text-left">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#011B51] uppercase tracking-tight">
                  Profile Recovery PIN Configuration
                </h2>
                <div className="w-12 lg:w-16 h-1 lg:h-1.5 bg-[#FED702] mt-3 lg:mt-4 mb-2 lg:mb-3 rounded-full mx-auto lg:mx-0" />
                <p className="text-slate-500 text-xs sm:text-sm font-semibold uppercase tracking-wide">
                  Terminal active. Complete your final PIN configuration mapping rules.
                </p>
              </div>

              <form
                onSubmit={handleRecoveryStep2CommitPin}
                className="space-y-4 lg:space-y-6"
              >
                {googleEmail && (
                  <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl cursor-not-allowed opacity-80">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Authenticated Email
                    </p>
                    <p className="text-sm font-bold text-slate-500">{googleEmail}</p>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] sm:text-xs font-bold text-[#011B51] uppercase tracking-wide mb-1.5 lg:mb-2 ml-1">
                    Student ID
                  </label>
                  <input
                    type="text"
                    disabled
                    className="w-full px-5 py-4 rounded-xl bg-slate-100 border border-slate-200 outline-none text-base font-medium text-slate-400 cursor-not-allowed"
                    value={studentId}
                  />
                </div>

                {googleEmail && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] sm:text-xs font-bold text-[#011B51] uppercase tracking-wide mb-1.5 lg:mb-2 ml-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        className="w-full px-5 py-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed outline-none font-medium"
                        value={firstName}
                        disabled
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] sm:text-xs font-bold text-[#011B51] uppercase tracking-wide mb-1.5 lg:mb-2 ml-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        className="w-full px-5 py-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed outline-none font-medium"
                        value={lastName}
                        disabled
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] sm:text-xs font-bold text-[#011B51] uppercase tracking-wide mb-1.5 lg:mb-2 ml-1">
                    Set Recovery PIN (6 Digits)
                  </label>
                  <input
                    type="password"
                    placeholder="Type New or Current 6-Digit PIN"
                    maxLength={6}
                    pattern="\d{6}"
                    title="Must be exactly 6 digits"
                    className="w-full px-4 lg:px-5 py-3.5 lg:py-4 rounded-xl bg-slate-50 border border-slate-200 outline-none text-center text-lg sm:text-xl font-mono font-bold tracking-[0.3em] focus:bg-white focus:border-[#011B51] focus:ring-2 focus:ring-[#011B51]/20 transition-all shadow-sm"
                    value={newRecoveryPin}
                    onChange={(e) => setNewRecoveryPin(e.target.value.replace(/\D/g, ""))}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#011B51] hover:bg-[#022a7a] text-white font-bold py-3.5 lg:py-4 rounded-xl mt-6 lg:mt-8 transition-all shadow-md hover:shadow-lg lg:hover:-translate-y-0.5 border-b-4 border-[#A51A21] disabled:opacity-70 disabled:border-[#011B51] disabled:transform-none text-xs sm:text-sm uppercase tracking-wider cursor-pointer"
                >
                  {isSubmitting
                    ? "Finalizing PIN..."
                    : "Confirm PIN & Complete Setup"}
                </button>
              </form>
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
                            strokeWidth={2}
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
                      {historySearch
                        ? "No logs match your search filter."
                        : "No attendance logs recorded for this student ID."}
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                        {paginatedLogs.map((log) => {
                          const isLate = log.status === "LATE";
                          const isManual =
                            log.signature && log.signature.includes("OVERRIDE");

                          return (
                            <div
                              key={log.id}
                              className="p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-slate-300 transition-all hover:shadow-sm"
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-bold text-sm text-[#011B51]">
                                  {log.schedule?.course_code || "CLASS SESSION"}{" "}
                                  (Sec {log.schedule?.section || "N/A"})
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

                      {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-bold text-slate-500">
                          <button
                            onClick={() =>
                              setCurrentPage((p) => Math.max(1, p - 1))
                            }
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
                          >
                            Previous
                          </button>
                          <span>
                            Page {currentPage} of {totalPages}
                          </span>
                          <button
                            onClick={() =>
                              setCurrentPage((p) => Math.min(totalPages, p + 1))
                            }
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
              className={`mt-6 lg:mt-8 p-4 lg:p-5 rounded-xl text-center text-xs sm:text-sm font-bold uppercase tracking-wide border-2 ${isError
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : message.includes("LATE")
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}
            >
              {message}
            </div>
          )}
        </div>
      </div>

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
                This action deletes your local cryptographic security keys. You
                will need to authenticate again to check in.
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

export default function SmartStudentPortal() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <StudentPortalContent />
    </GoogleOAuthProvider>
  );
}