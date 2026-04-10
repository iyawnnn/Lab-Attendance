"use client";

import { useState, useEffect } from "react";
import { getDistance } from "geolib";

interface GeofenceGuardProps {
  children: React.ReactNode;
}

export default function GeofenceGuard({ children }: GeofenceGuardProps) {
  const [isWithinRadius, setIsWithinRadius] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your device.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const targetLat = parseFloat(process.env.NEXT_PUBLIC_CAMPUS_LAT || "0");
        const targetLng = parseFloat(process.env.NEXT_PUBLIC_CAMPUS_LNG || "0");
        const maxRadius = parseFloat(process.env.NEXT_PUBLIC_GEOFENCE_RADIUS_METERS || "75");

        const distanceInMeters = getDistance(
          { latitude: position.coords.latitude, longitude: position.coords.longitude },
          { latitude: targetLat, longitude: targetLng }
        );

        setIsWithinRadius(distanceInMeters <= maxRadius);
        setError(null);
      },
      (err) => {
        setError(err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  if (error) {
    return <div className="p-4 bg-red-100 text-red-700 rounded-md">Location Error: {error}</div>;
  }

  if (isWithinRadius === null) {
    return <div className="p-4 text-gray-600">Verifying your location...</div>;
  }

  if (!isWithinRadius) {
    return (
      <div className="p-4 bg-yellow-100 text-yellow-800 rounded-md">
        You must be within the campus premises to log your attendance.
      </div>
    );
  }

  return <>{children}</>;
}