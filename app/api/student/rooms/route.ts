// app/api/student/rooms/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Calculates current time in minutes since midnight and date strings for Asia/Manila.
 */
function getCurrentPHMinutesAndDate() {
  const timeZone = process.env.NEXT_PUBLIC_APP_TIMEZONE || "Asia/Manila";
  const now = new Date();

  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });
  const timeParts = timeFormatter.formatToParts(now);
  let hour = 0;
  let minute = 0;
  for (const part of timeParts) {
    if (part.type === "hour") hour = parseInt(part.value, 10);
    if (part.type === "minute") minute = parseInt(part.value, 10);
  }

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
  });
  const dateParts = dateFormatter.formatToParts(now);
  let year = "";
  let month = "";
  let day = "";
  let weekday = "";
  for (const part of dateParts) {
    if (part.type === "year") year = part.value;
    if (part.type === "month") month = part.value;
    if (part.type === "day") day = part.value;
    if (part.type === "weekday") weekday = part.value;
  }

  const isoDate = `${year}-${month}-${day}`;
  const minutesSinceMidnight = hour * 60 + minute;

  return { minutesSinceMidnight, isoDate, weekday };
}

/**
 * Parses time strings formatted like "07:00 AM" into total minutes from midnight.
 */
function parseScheduleTime(timeStr: string) {
  if (!timeStr) return 0;
  const match = timeStr.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return 0;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const modifier = match[3].toUpperCase();

  if (modifier === "PM" && hours < 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

export async function GET() {
  try {
    const { minutesSinceMidnight, isoDate, weekday } = getCurrentPHMinutesAndDate();

    const allSchedules = await db.schedule.findMany({
      select: {
        id: true,
        lab_room: true,
        date: true,
        schedule: true,
        active_pin: true,
        pin_expires_at: true,
      },
    });

    const activeRoomsSet = new Set<string>();

    for (const item of allSchedules) {
      // Rule 1: Always include room if an active PIN is currently open
      const isPinActive =
        item.active_pin &&
        item.pin_expires_at &&
        new Date(item.pin_expires_at) > new Date();

      if (isPinActive) {
        activeRoomsSet.add(item.lab_room);
        continue;
      }

      // Rule 2: Check 15-minute buffer before start and after end
      const isToday =
        item.date === isoDate ||
        item.date.toLowerCase() === weekday.toLowerCase() ||
        item.date === "";

      if (isToday && item.schedule) {
        const [startStr, endStr] = item.schedule.split(/\s*-\s*/);
        if (startStr && endStr) {
          const startMins = parseScheduleTime(startStr);
          const endMins = parseScheduleTime(endStr);

          const bufferedStart = startMins - 15;
          const bufferedEnd = endMins + 15;

          if (
            minutesSinceMidnight >= bufferedStart &&
            minutesSinceMidnight <= bufferedEnd
          ) {
            activeRoomsSet.add(item.lab_room);
          }
        }
      }
    }

    const activeRooms = Array.from(activeRoomsSet).sort();

    return NextResponse.json({
      success: true,
      data: activeRooms,
    });
  } catch (error) {
    console.error("Fetch Active Rooms Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch active rooms." },
      { status: 500 }
    );
  }
}