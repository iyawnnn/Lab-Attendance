"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { get, set, del } from "idb-keyval";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { ArrowLeft, LogOut, Loader2, Clock } from "lucide-react";
import {
  getLabRooms,
  submitAttendance,
  getServerTime,
} from "@/app/actions/student";
import GeofenceGuard from "./components/GeofenceGuard";
import { usePusherEvent } from "@/hooks/usePusher";

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

const ITEMS_PER_PAGE = 3;
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
const STUDENT_ID_PLACEHOLDER =
  process.env.NEXT_PUBLIC_STUDENT_ID_PLACEHOLDER || "2023001671";

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

  usePusherEvent("schedules-channel", "schedule-created", () => {
    if (view === "attendance") fetchRooms();
  });
  usePusherEvent("schedules-channel", "schedule-updated", () => {
    if (view === "attendance") fetchRooms();
  });
  usePusherEvent("schedules-channel", "schedule-deleted", () => {
    if (view === "attendance") {
      fetchRooms();
      setSelectedRoom("");
    }
  });

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
            if (typeof window !== "undefined") {
              sessionStorage.removeItem("google_id_token");
              sessionStorage.removeItem("google_email");
            }
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
            if (typeof window !== "undefined") {
              sessionStorage.removeItem("google_id_token");
              sessionStorage.removeItem("google_email");
            }

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
    if (typeof window !== "undefined") {
      sessionStorage.setItem("google_id_token", token);
    }

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
          setMessage("Device re-authorization required. Provide your PIN to transfer this account.");
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
        if (typeof window !== "undefined") {
          sessionStorage.setItem("google_email", data.email);
        }
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
      const tokenToUse =
        googleIdToken ||
        (typeof window !== "undefined"
          ? sessionStorage.getItem("google_id_token")
          : "") ||
        "";

      const emailToUse =
        googleEmail ||
        (typeof window !== "undefined"
          ? sessionStorage.getItem("google_email")
          : "") ||
        "";

      if (!tokenToUse || !emailToUse) {
        setIsError(true);
        setMessage("Google authentication context expired. Please sign in again.");
        setIsSubmitting(false);
        return;
      }

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
          idToken: tokenToUse,
          studentId,
          firstName,
          lastName,
          publicKey: publicKeyBase64,
          recoveryPin,
          email: emailToUse,
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

        setMessage("Verification Successful! Previous hardware bindings dropped.");
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
      setMessage("Please enter the 4-digit Room PIN displayed by your instructor.");
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
          if (typeof window !== "undefined") {
            sessionStorage.removeItem("google_id_token");
            sessionStorage.removeItem("google_email");
          }
          setView("login");
          setIsError(false);
          setMessage("Security key mismatch. Please authenticate again.");
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
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("google_id_token");
      sessionStorage.removeItem("google_email");
    }

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-800 font-sans">
        <div className="flex flex-col items-center gap-3 text-sm font-semibold tracking-wide text-slate-500">
          <Loader2 className="w-6 h-6 text-slate-900 animate-spin" />
          Verifying security hardware credentials...
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen w-full flex flex-col lg:flex-row bg-white font-sans">

      {/* LEFT SIDE PANEL */}
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

      {/* RIGHT SIDE PANEL */}
      <div className="w-full lg:w-[60%] flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16 bg-white relative">
        <a
          href="/"
          className="absolute top-4 right-6 lg:top-8 lg:right-10 text-xs font-bold text-slate-400 hover:text-[#011B51] transition-colors uppercase tracking-wider flex items-center gap-1.5"
        >
          <ArrowLeft size={13} />
          Main Portal
        </a>

        {/* Form Container */}
        <div className="w-full max-w-md mt-6 lg:mt-0">

          {/* AUTHENTICATION VIEW */}
          {view === "login" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-10">
              <div className="text-center lg:text-left space-y-2">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#011B51] uppercase tracking-tight">
                  Institutional Login
                </h2>
                <div className="w-12 lg:w-16 h-1 lg:h-1.5 bg-[#FED702] rounded-full mx-auto lg:mx-0" />
                <p className="text-slate-400 text-xs sm:text-sm font-semibold uppercase tracking-wide pt-1">
                  Sign in with your official institutional email.
                </p>
              </div>

              <div className="space-y-4 text-center">
                <div className="flex justify-center py-2">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => {
                      setIsError(true);
                      setMessage("Google Sign-In popup context dropped.");
                    }}
                    theme="outline"
                    shape="rectangular"
                    size="large"
                  />
                </div>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                  Access parameters restrict identity checking exclusively to <span className="font-bold text-[#011B51]">@ua.edu.ph</span> emails.
                </p>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setGoogleEmail(""); setStudentId(""); setFirstName(""); setLastName("");
                    setView("recovery_verify"); setIsError(false); setMessage("");
                  }}
                  className="text-xs font-bold text-slate-400 hover:text-[#011B51] uppercase tracking-widest transition-colors cursor-pointer underline underline-offset-4"
                >
                  Recover / Transfer Account to this Device
                </button>
              </div>

              <div className="border-t border-slate-100 pt-8 space-y-3">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  Portal Guidelines
                </p>
                <ul className="space-y-2.5 text-xs text-slate-400 font-medium leading-relaxed">
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#011B51] font-black">01.</span>
                    <span>Authenticate utilizing your personal structural laboratory SSO account credentials.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#011B51] font-black">02.</span>
                    <span>The identity ledger automatically configures secure terminal key pairs on initial match.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#011B51] font-black">03.</span>
                    <span>Verify your proximity parameter maps to clear the physical geofence boundary gates.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* ONBOARDING VIEW */}
          {view === "onboarding" && (
            <div className="animate-in fade-in duration-500 space-y-6">
              <div className="text-center lg:text-left space-y-2">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#011B51] uppercase tracking-tight">
                  One-Time Profile Setup
                </h2>
                <div className="w-12 lg:w-16 h-1 lg:h-1.5 bg-[#FED702] rounded-full mx-auto lg:mx-0" />
                <p className="text-slate-400 text-xs sm:text-sm font-semibold uppercase tracking-wide">
                  Bind your Student ID and hardware key to complete onboarding.
                </p>
              </div>

              <form onSubmit={handleCompleteOnboarding} className="space-y-4">
                <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Authenticated Email</span>
                  <span className="font-bold text-slate-700">{googleEmail}</span>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 ml-0.5">Student ID</label>
                  <input
                    type="text"
                    placeholder={`e.g. ${STUDENT_ID_PLACEHOLDER}`}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-[#011B51] focus:ring-2 focus:ring-[#011B51]/10 transition-all shadow-sm"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 ml-0.5">First Name</label>
                    <input type="text" className="w-full px-4 py-3 bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed text-sm font-medium rounded-xl outline-none" value={firstName} disabled />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 ml-0.5">Last Name</label>
                    <input type="text" className="w-full px-4 py-3 bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed text-sm font-medium rounded-xl outline-none" value={lastName} disabled />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 ml-0.5">Recovery PIN (6 Digits)</label>
                  <input
                    type="password"
                    placeholder="Create 6-Digit PIN"
                    maxLength={6}
                    pattern="\d{6}"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-[#011B51] focus:ring-2 focus:ring-[#011B51]/20 transition-all shadow-sm"
                    value={recoveryPin}
                    onChange={(e) => setRecoveryPin(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full bg-[#011B51] hover:bg-[#022a7a] text-white font-bold py-3.5 rounded-xl transition-all shadow-md border-b-4 border-[#A51A21] disabled:opacity-70 text-xs uppercase tracking-wider cursor-pointer">
                  {isSubmitting ? "Registering Profile..." : "Complete Setup & Register"}
                </button>
              </form>

              <div className="text-center lg:text-left pt-2">
                <button type="button" onClick={() => { setView("login"); setMessage(""); }} className="text-xs font-bold text-slate-400 hover:text-[#011B51] uppercase tracking-wide transition-colors cursor-pointer">
                  &larr; Cancel and Switch Account
                </button>
              </div>
            </div>
          )}

          {/* RECOVERY STEP 1 VIEW */}
          {view === "recovery_verify" && (
            <div className="animate-in fade-in duration-500 space-y-6">
              <div className="text-center lg:text-left space-y-2">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#011B51] uppercase tracking-tight">
                  Device Authorization Transfer
                </h2>
                <div className="w-12 lg:w-16 h-1 lg:h-1.5 bg-[#FED702] rounded-full mx-auto lg:mx-0" />
                <p className="text-slate-400 text-xs sm:text-sm font-semibold uppercase tracking-wide">
                  Authenticate and clear previous active sessions to sync mappings.
                </p>
              </div>

              <form onSubmit={handleRecoveryStep1Verify} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 ml-0.5">Student ID</label>
                  <input
                    type="text"
                    placeholder={`e.g. ${STUDENT_ID_PLACEHOLDER}`}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-[#011B51] focus:ring-2 focus:ring-[#011B51]/20 transition-all shadow-sm"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 ml-0.5">Current Recovery PIN</label>
                  <input
                    type="password"
                    placeholder="Enter Current PIN"
                    maxLength={6}
                    pattern="\d{6}"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 outline-none text-center text-lg sm:text-xl font-mono font-bold tracking-[0.25em] focus:bg-white focus:border-[#011B51] focus:ring-2 focus:ring-[#011B51]/20 transition-all shadow-sm rounded-xl"
                    value={recoveryPin}
                    onChange={(e) => setRecoveryPin(e.target.value.replace(/\D/g, ""))}
                    required
                  />
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full bg-[#011B51] hover:bg-[#022a7a] text-white font-bold py-3.5 rounded-xl transition-all shadow-md border-b-4 border-[#A51A21] disabled:opacity-70 text-xs uppercase tracking-wider cursor-pointer">
                  {isSubmitting ? "Verifying..." : "Verify & Evict Other Terminal"}
                </button>
              </form>

              <div className="text-center lg:text-left pt-2">
                <button type="button" onClick={() => { setView("login"); setMessage(""); setIsError(false); }} className="text-xs font-bold text-slate-400 hover:text-[#011B51] uppercase tracking-wide transition-colors cursor-pointer">
                  &larr; Cancel and Return to Sign In
                </button>
              </div>
            </div>
          )}

          {/* RECOVERY STEP 2 VIEW */}
          {view === "recovery_set_pin" && (
            <div className="animate-in fade-in duration-500 space-y-6">
              <div className="text-center lg:text-left space-y-2">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#011B51] uppercase tracking-tight">
                  Profile Recovery PIN Configuration
                </h2>
                <div className="w-12 lg:w-16 h-1 lg:h-1.5 bg-[#FED702] rounded-full mx-auto lg:mx-0" />
                <p className="text-slate-400 text-xs sm:text-sm font-semibold uppercase tracking-wide">
                  Terminal active. Complete your final PIN configuration mapping rules.
                </p>
              </div>

              <form onSubmit={handleRecoveryStep2CommitPin} className="space-y-4">
                {googleEmail && (
                  <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-xl cursor-not-allowed opacity-80 text-xs">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Authenticated Email</p>
                    <p className="font-bold text-slate-500">{googleEmail}</p>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 ml-0.5">Student ID</label>
                  <input type="text" disabled className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 outline-none text-sm font-medium text-slate-400 cursor-not-allowed" value={studentId} />
                </div>

                {googleEmail && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 ml-0.5">First Name</label>
                      <input type="text" className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed outline-none font-medium text-sm" value={firstName} disabled />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 ml-0.5">Last Name</label>
                      <input type="text" className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed outline-none font-medium text-sm" value={lastName} disabled />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 ml-0.5">Set Recovery PIN (6 Digits)</label>
                  <input
                    type="password"
                    placeholder="Configure New 6-Digit PIN"
                    maxLength={6}
                    pattern="\d{6}"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 outline-none text-center text-lg sm:text-xl font-mono font-bold tracking-[0.25em] focus:bg-white focus:border-[#011B51] focus:ring-2 focus:ring-[#011B51]/20 transition-all shadow-sm rounded-xl"
                    value={newRecoveryPin}
                    onChange={(e) => setNewRecoveryPin(e.target.value.replace(/\D/g, ""))}
                    required
                  />
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full bg-[#011B51] hover:bg-[#022a7a] text-white font-bold py-3.5 rounded-xl transition-all shadow-md border-b-4 border-[#A51A21] disabled:opacity-70 text-xs uppercase tracking-wider cursor-pointer">
                  {isSubmitting ? "Finalizing PIN..." : "Confirm PIN & Complete Setup"}
                </button>
              </form>
            </div>
          )}

          {/* ATTENDANCE MAIN PORTAL WORKSPACE */}
          {view === "attendance" && (
            <div className="animate-in fade-in duration-500 space-y-6">
              
              {/* CENTERED STUDENT ID BADGE */}
              <div className="flex justify-center">
                <span className="inline-block px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-[#011B51] text-xs font-bold uppercase tracking-wider shadow-sm">
                  STUDENT ID: {registeredId}
                </span>
              </div>

              {/* SEGMENTED SWITCHER BAR */}
              <div className="grid grid-cols-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setStudentTab("checkin")}
                  className={`py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    studentTab === "checkin"
                      ? "bg-[#011B51] text-white shadow-sm"
                      : "text-slate-500 hover:text-[#011B51]"
                  }`}
                >
                  LOG ATTENDANCE
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStudentTab("history");
                    setCurrentPage(1);
                    if (registeredId) fetchHistory(registeredId);
                  }}
                  className={`py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    studentTab === "history"
                      ? "bg-[#011B51] text-white shadow-sm"
                      : "text-slate-500 hover:text-[#011B51]"
                  }`}
                >
                  MY HISTORY
                </button>
              </div>

              {/* LOG ATTENDANCE PANEL */}
              {studentTab === "checkin" ? (
                <GeofenceGuard>
                  <form onSubmit={handleLogAttendance} className="space-y-5">
                    
                    {/* CLOCK CONTAINER WITH ICON & SUBHEADER */}
                    <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-center gap-3 shadow-sm">
                      <Clock className="w-5 h-5 text-[#011B51] shrink-0" />
                      <div className="flex flex-col text-left">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 leading-none mb-1">
                          LOCAL STANDARD TIME
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight">
                          {philippineTime || "Syncing clock..."}
                        </span>
                      </div>
                    </div>

                    {/* FACILITY SELECTION */}
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 ml-0.5">
                        FACILITY SELECTION
                      </label>
                      <select
                        className="w-full px-4 py-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 outline-none cursor-pointer text-sm font-semibold text-slate-700 focus:bg-white focus:border-[#011B51] focus:ring-2 focus:ring-[#011B51]/20 transition-all shadow-sm appearance-none h-[50px]"
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

                    {/* ROOM PIN */}
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 ml-0.5">
                        ROOM PIN
                      </label>
                      <input
                        type="text"
                        maxLength={4}
                        className="w-full px-4 py-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 outline-none text-center text-lg font-mono font-bold tracking-[0.4em] focus:bg-white focus:border-[#011B51] focus:ring-2 focus:ring-[#011B51]/20 transition-all shadow-sm h-[50px]"
                        value={roomPin}
                        onChange={(e) => setRoomPin(e.target.value.replace(/\D/g, ""))}
                        placeholder="0 0 0 0"
                        required
                      />
                    </div>

                    {/* SUBMIT ACTION BUTTON */}
                    <button
                      type="submit"
                      disabled={isLogging || labRooms.length === 0}
                      className="w-full bg-[#011B51] hover:bg-[#022a7a] text-white font-bold py-4 rounded-2xl transition-all shadow-md border-b-4 border-[#A51A21] disabled:opacity-70 text-xs uppercase tracking-wider cursor-pointer h-[50px] flex items-center justify-center mt-2"
                    >
                      {isLogging ? "SIGNING PAYLOAD..." : "SECURELY LOG ATTENDANCE"}
                    </button>
                  </form>
                </GeofenceGuard>
              ) : (
                /* HISTORY LIST LOG ROWS WITH PAGINATION */
                <div className="space-y-4 animate-in fade-in duration-300">
                  <input
                    type="text"
                    placeholder="Search history logs..."
                    value={historySearch}
                    onChange={(e) => {
                      setHistorySearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-3 text-xs font-medium bg-slate-50/80 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-[#011B51] focus:ring-2 focus:ring-[#011B51]/20 transition-all shadow-sm"
                  />

                  {isLoadingHistory ? (
                    <div className="py-12 text-center text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse">
                      Loading history logs...
                    </div>
                  ) : processedLogs.length === 0 ? (
                    <div className="py-10 text-center text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50/80 rounded-2xl border border-dashed border-slate-200">
                      No records matching filters
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {paginatedLogs.map((log) => {
                          const isLate = log.status === "LATE";
                          const isManual = log.signature && log.signature.includes("OVERRIDE");

                          return (
                            <div
                              key={log.id}
                              className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl flex items-center justify-between text-xs transition-all hover:border-slate-300 shadow-sm"
                            >
                              <div className="space-y-1 truncate pr-3">
                                <span className="font-extrabold text-slate-900 block truncate text-sm">
                                  {log.schedule?.course_code || "CLASS SESSION"}
                                </span>
                                <span className="text-slate-500 font-semibold block truncate text-[11px]">
                                  {log.schedule?.lab_room} • Sec {log.schedule?.section}
                                </span>
                                <span className="text-[10px] text-slate-400 block font-medium">
                                  {new Date(log.timestamp).toLocaleString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  })}
                                </span>
                              </div>

                              <div className="flex flex-col items-end gap-1.5 shrink-0">
                                <span
                                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                    isLate
                                      ? "bg-amber-50 text-amber-800 border-amber-200"
                                      : "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  }`}
                                >
                                  {isLate ? "LATE" : "ON TIME"}
                                </span>
                                {isManual && (
                                  <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100">
                                    Manual
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* PAGINATION CONTROL BAR */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <button
                          type="button"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <span className="text-slate-500 font-semibold">
                          Page {currentPage} of {totalPages}
                        </span>
                        <button
                          type="button"
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* CENTERED DEAUTHORIZE DEVICE TRIGGER */}
              <div className="pt-4 text-center">
                <button
                  type="button"
                  onClick={() => setShowDeauthModal(true)}
                  className="text-xs font-bold text-slate-400 hover:text-rose-600 uppercase tracking-widest transition-colors cursor-pointer underline underline-offset-4"
                >
                  DEAUTHORIZE THIS DEVICE
                </button>
              </div>

            </div>
          )}

          {/* NOTIFICATION FEEDBACK BANNER */}
          {message && (
            <div
              className={`p-4 rounded-xl text-center text-xs font-bold uppercase tracking-wide border-2 mt-6 ${isError
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : message.includes("LATE")
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-emerald-50 text-emerald-800 border-emerald-200"
                }`}
            >
              {message}
            </div>
          )}
        </div>
      </div>

      {/* DEAUTHORIZATION MODAL DIALOG */}
      {showDeauthModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-100">
              <LogOut size={18} />
            </div>

            <div>
              <h3 className="text-base font-black text-[#011B51] uppercase tracking-wide">
                Deauthorize Device?
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1.5 leading-relaxed">
                This action deletes your local cryptographic security keys. You
                will need to authenticate again to check in.
              </p>
            </div>

            <div className="flex space-x-3 pt-2 text-xs font-bold uppercase tracking-wider">
              <button
                type="button"
                onClick={() => setShowDeauthModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDeauthorization}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-colors cursor-pointer"
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