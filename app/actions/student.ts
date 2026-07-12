"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getCurrentPHTimeInMinutes, parseScheduleTime } from "./utils";

export async function getServerTime() {
  return { success: true, timestamp: new Date().toISOString() };
}

export async function registerStudentToDatabase(data: {
  studentId: string;
  firstName: string;
  lastName: string;
  publicKey: string;
  recoveryPin: string;
}) {
  try {
    const existingStudent = await prisma.student.findUnique({
      where: { student_id: data.studentId },
    });
    const salt = await bcrypt.genSalt(10);
    const hashedPin = await bcrypt.hash(data.recoveryPin, salt);

    if (existingStudent) {
      if (existingStudent.public_key === "") {
        await prisma.student.update({
          where: { student_id: data.studentId },
          data: {
            public_key: data.publicKey,
            recovery_pin: hashedPin,
          },
        });
        return {
          success: true,
          message: `Welcome back, ${existingStudent.first_name}! New device registered.`,
        };
      } else {
        return {
          success: false,
          message: "Student ID is already registered to an active device.",
        };
      }
    }

    await prisma.student.create({
      data: {
        student_id: data.studentId,
        first_name: data.firstName,
        last_name: data.lastName,
        public_key: data.publicKey,
        recovery_pin: hashedPin,
      },
    });
    return { success: true, message: "Student registered successfully." };
  } catch (error) {
    return { success: false, message: "Failed to connect to the database." };
  }
}

export async function recoverStudentDevice(studentId: string, pin: string) {
  try {
    const student = await prisma.student.findUnique({
      where: { student_id: studentId },
    });
    if (!student)
      return { success: false, message: "Student ID not found in the system." };

    if (!student.recovery_pin) {
      return {
        success: false,
        message:
          "No recovery PIN set for this account. Please contact administrator.",
      };
    }

    const isPinValid = await bcrypt.compare(pin, student.recovery_pin);
    if (!isPinValid)
      return { success: false, message: "Incorrect Recovery PIN." };

    await prisma.student.update({
      where: { student_id: studentId },
      data: { public_key: "" },
    });

    return {
      success: true,
      message: "Device access revoked. You may now register your new device.",
    };
  } catch (error) {
    return { success: false, message: "Failed to process recovery request." };
  }
}

export async function checkRevokedStatus(studentId: string) {
  try {
    const student = await prisma.student.findUnique({
      where: { student_id: studentId },
    });

    if (!student) return { isRevoked: true };

    if (!student.public_key || student.public_key === "") {
      return {
        isRevoked: true,
        firstName: student.first_name,
        lastName: student.last_name,
      };
    }

    return {
      isRevoked: false,
      currentPublicKey: student.public_key,
      firstName: student.first_name,
      lastName: student.last_name,
    };
  } catch (error) {
    return { isRevoked: false };
  }
}

export async function getLabRooms() {
  try {
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

    const currentMinutes = hour * 60 + minute;

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

    const schedules = await prisma.schedule.findMany({
      select: {
        lab_room: true,
        date: true,
        schedule: true,
        active_pin: true,
        pin_expires_at: true,
      },
    });

    const activeRoomsSet = new Set<string>();

    for (const item of schedules) {
      const isPinActive =
        item.active_pin &&
        item.pin_expires_at &&
        new Date(item.pin_expires_at) > new Date();

      if (isPinActive) {
        activeRoomsSet.add(item.lab_room);
        continue;
      }

      const isToday =
        item.date === isoDate ||
        item.date.toLowerCase() === weekday.toLowerCase() ||
        item.date === "";

      if (isToday && item.schedule) {
        const [startStr, endStr] = item.schedule.split(/\s*-\s*/);
        if (startStr && endStr) {
          const startMins = parseScheduleTime(startStr);
          const endMins = parseScheduleTime(endStr);

          if (
            currentMinutes >= startMins - 15 &&
            currentMinutes <= endMins + 15
          ) {
            activeRoomsSet.add(item.lab_room);
          }
        }
      }
    }

    return { success: true, data: Array.from(activeRoomsSet).sort() };
  } catch (error) {
    return { success: false, data: [] };
  }
}

export async function submitAttendance(data: {
  studentId: string;
  labRoom: string;
  timestamp: string;
  signature: string;
  roomPin: string;
}) {
  try {
    const student = await prisma.student.findUnique({
      where: { student_id: data.studentId },
    });

    if (!student) {
      return {
        success: false,
        message: "Student not found in the database. Please register.",
      };
    }

    if (!student.public_key || student.public_key === "") {
      return {
        success: false,
        message: "DEVICE_REVOKED: Your device access has been revoked.",
      };
    }

    const clientTime = new Date(data.timestamp).getTime();
    const serverTime = Date.now();
    const allowedDrift = parseInt(
      process.env.ALLOWED_TIME_DRIFT_MS || "60000",
      10
    );

    if (Math.abs(serverTime - clientTime) > allowedDrift) {
      return {
        success: false,
        message: "Request rejected: Timestamp desynchronization detected.",
      };
    }

    let isValid = false;

    try {
      const encoder = new TextEncoder();
      const encodedMessage = encoder.encode(
        `${data.studentId}-${data.labRoom}-${data.timestamp}`
      );

      const binarySignature = new Uint8Array(
        atob(data.signature)
          .split("")
          .map((c) => c.charCodeAt(0))
      );
      const binaryPublicKey = new Uint8Array(
        atob(student.public_key)
          .split("")
          .map((c) => c.charCodeAt(0))
      );

      const importedPublicKey = await globalThis.crypto.subtle.importKey(
        "spki",
        binaryPublicKey,
        { name: "ECDSA", namedCurve: "P-256" },
        true,
        ["verify"]
      );

      isValid = await globalThis.crypto.subtle.verify(
        { name: "ECDSA", hash: { name: "SHA-256" } },
        importedPublicKey,
        binarySignature,
        encodedMessage
      );
    } catch (cryptoErr) {
      console.warn("ECC Signature Import/Verification Error:", cryptoErr);
      return {
        success: false,
        message:
          "Digital signature verification failed. Security key mismatch detected.",
      };
    }

    if (!isValid) {
      return {
        success: false,
        message:
          "Digital signature verification failed. Security key mismatch detected.",
      };
    }

    const matchedSchedule = await prisma.schedule.findFirst({
      where: {
        lab_room: data.labRoom,
        active_pin: data.roomPin,
        pin_expires_at: { gt: new Date() },
      },
    });

    if (!matchedSchedule) {
      return {
        success: false,
        message:
          "Verification Failed: Invalid, expired, or incorrect Room PIN.",
      };
    }

    let attendanceStatus = "ON_TIME";
    const currentMinutesSinceMidnight = getCurrentPHTimeInMinutes();
    const [startStr, endStr] = matchedSchedule.schedule.split(/\s*-\s*/);

    if (startStr && endStr) {
      const classStartMins = parseScheduleTime(startStr);
      const classEndMins = parseScheduleTime(endStr);

      if (currentMinutesSinceMidnight > classEndMins) {
        return {
          success: false,
          message: "Submission failed. This class session has already ended.",
        };
      }

      if (currentMinutesSinceMidnight < classStartMins - 30) {
        return {
          success: false,
          message: "Submission failed. This class session has not started yet.",
        };
      }

      const lateThreshold = parseInt(
        process.env.LATE_THRESHOLD_MINUTES || "15",
        10
      );

      if (currentMinutesSinceMidnight > classStartMins + lateThreshold) {
        attendanceStatus = "LATE";
      }
    }

    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const existingLog = await prisma.attendanceLog.findFirst({
      where: {
        student_id: data.studentId,
        schedule_id: matchedSchedule.id,
        timestamp: { gte: twelveHoursAgo },
      },
    });

    if (existingLog) {
      return {
        success: false,
        message: "Attendance already recorded for this session today.",
      };
    }

    await prisma.attendanceLog.create({
      data: {
        student_id: data.studentId,
        schedule_id: matchedSchedule.id,
        status: attendanceStatus,
        signature: data.signature,
      },
    });

    return {
      success: true,
      message: `Attendance securely recorded. Status: ${attendanceStatus}`,
    };
  } catch (error) {
    console.error("Attendance Server Exception:", error);
    return {
      success: false,
      message:
        "Digital signature verification failed. Security key mismatch detected.",
    };
  }
}