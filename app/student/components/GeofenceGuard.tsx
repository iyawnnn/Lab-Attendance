"use client";

import { useState, useEffect, useRef, ReactNode } from "react";
import { MapPinOff, Navigation, AlertTriangle, RefreshCw } from "lucide-react";
import { getDistance } from "geolib";

interface GeofenceGuardProps {
  children: ReactNode;
}

export default function GeofenceGuard({ children }: GeofenceGuardProps) {
  const [status, setStatus] = useState<"checking" | "allowed" | "denied" | "error">("checking");
  const [errorMessage, setErrorMessage] = useState("");
  const watchIdRef = useRef<number | null>(null);

  // Core logic to check distance
  const evaluatePosition = (position: GeolocationPosition) => {
    const targetLat = parseFloat(process.env.NEXT_PUBLIC_CAMPUS_LAT || "0");
    const targetLng = parseFloat(process.env.NEXT_PUBLIC_CAMPUS_LNG || "0");
    const maxRadius = parseFloat(process.env.NEXT_PUBLIC_GEOFENCE_RADIUS_METERS || "75");

    const distanceInMeters = getDistance(
      { latitude: position.coords.latitude, longitude: position.coords.longitude },
      { latitude: targetLat, longitude: targetLng }
    );

    if (distanceInMeters <= maxRadius) {
      setStatus("allowed");
    } else {
      setStatus("denied");
    }
  };

  // Error handler
  const handleError = (error: GeolocationPositionError) => {
    setStatus("error");
    switch (error.code) {
      case error.PERMISSION_DENIED:
        setErrorMessage("Location permission was denied. Please allow location access in your browser settings.");
        break;
      case error.POSITION_UNAVAILABLE:
        setErrorMessage("Location information is currently unavailable.");
        break;
      case error.TIMEOUT:
        setErrorMessage("The request to get your location timed out.");
        break;
      default:
        setErrorMessage("An unknown error occurred while verifying location.");
        break;
    }
  };

  // Start the continuous watcher
  const startWatching = () => {
    if (!navigator.geolocation) {
      setStatus("error");
      setErrorMessage("Geolocation is not supported by your browser or device.");
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      evaluatePosition,
      handleError,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Forced hardware refresh for the manual retry button
  const handleRetry = () => {
    setStatus("checking");
    setErrorMessage("");

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    // Explicitly request a fresh, un-cached position before restarting the watcher
    navigator.geolocation.getCurrentPosition(
      (position) => {
        evaluatePosition(position);
        startWatching(); // Resume continuous monitoring
      },
      (error) => {
        handleError(error);
        startWatching(); // Restart watcher anyway so it can auto-recover
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Initialize on mount
  useEffect(() => {
    startWatching();
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // If inside the campus, render the actual student page
  if (status === "allowed") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6 font-sans">
      
      {/* 1. VERIFYING LOCATION STATE */}
      {status === "checking" && (
        <div className="flex flex-col items-center justify-center p-10 bg-white rounded-[2rem] shadow-xl border border-slate-100 text-center animate-in fade-in zoom-in-95 duration-500 max-w-sm w-full">
          <div className="relative w-24 h-24 mb-8 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-[#011B51] border-t-transparent animate-spin"></div>
            <div className="absolute inset-4 rounded-full bg-[#011B51]/5 animate-pulse"></div>
            <Navigation className="w-8 h-8 text-[#011B51] animate-pulse relative z-10" />
          </div>
          <h3 className="text-xl font-black text-[#011B51] uppercase tracking-tight mb-3">
            Locating Device
          </h3>
          <p className="text-sm font-semibold text-slate-500 leading-relaxed">
            Securely verifying your presence within the campus geofence...
          </p>
        </div>
      )}

      {/* 2. OUTSIDE CAMPUS STATE */}
      {status === "denied" && (
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-[2rem] shadow-xl border border-slate-100 text-center animate-in zoom-in-95 duration-500 max-w-md w-full relative overflow-hidden">
          
          <div className="relative w-24 h-24 mb-6 mt-2 flex items-center justify-center bg-rose-50 rounded-full shadow-inner ring-8 ring-slate-50">
            <div className="absolute inset-0 bg-rose-500 rounded-full animate-ping opacity-10"></div>
            <MapPinOff className="w-10 h-10 text-rose-500 relative z-10" />
          </div>
          
          <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-5 relative z-10">
            Access Restricted
          </h3>
          
          <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-5 mb-6 relative z-10 w-full shadow-sm">
            <p className="text-sm font-black text-rose-700 leading-relaxed uppercase tracking-wider">
              You must be within the campus premises to log your attendance.
            </p>
          </div>
          
          <p className="text-xs font-bold text-slate-500 mb-8 relative z-10 px-2 leading-relaxed">
            Your current GPS coordinates indicate you are outside the permitted university perimeter.
          </p>
          
          <button 
            onClick={handleRetry}
            className="w-full bg-[#011B51] hover:bg-[#022a7a] border-b-4 border-[#A51A21] text-white font-bold py-4 px-6 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-3 relative z-10 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Location Check
          </button>
        </div>
      )}

      {/* 3. BROWSER/HARDWARE ERROR STATE */}
      {status === "error" && (
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-[2rem] shadow-xl border border-slate-100 text-center animate-in zoom-in-95 duration-500 max-w-md w-full">
          <div className="w-20 h-20 mb-6 flex items-center justify-center bg-amber-50 rounded-full text-amber-500 ring-8 ring-slate-50">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-4">
            Location Error
          </h3>
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-8 w-full">
            <p className="text-sm font-bold text-slate-600 leading-relaxed">
              {errorMessage}
            </p>
          </div>
          <button 
            onClick={handleRetry}
            className="w-full bg-amber-500 hover:bg-amber-600 border-b-4 border-amber-700 text-white font-bold py-4 px-6 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md active:scale-[0.98] cursor-pointer"
          >
            Try Again
          </button>
        </div>
      )}

    </div>
  );
}