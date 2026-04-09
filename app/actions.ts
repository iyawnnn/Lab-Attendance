"use server";

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

function parseTimeInMinutes(timeString: string) {
  const parts = timeString.trim().split(" ");
  const time = parts[0];
  const period = parts[1];

  let hours = parseInt(time.split(":")[0]);
  const minutes = parseInt(time.split(":")[1]);

  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  return hours * 60 + minutes;
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
      // If the public key is empty, the device was revoked and they can register a new one.
      if (existingStudent.public_key === "") {
        await prisma.student.update({
          where: { student_id: data.studentId },
          data: {
            // Intentionally excluding first_name and last_name to prevent identity tampering
            public_key: data.publicKey,
            recovery_pin: hashedPin,
          },
        });

        return {
          success: true,
          message: `Welcome back, ${existingStudent.first_name}! New device registered successfully.`,
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
    console.error("Database error:", error);
    return { success: false, message: "Failed to connect to the database." };
  }
}

export async function recoverStudentDevice(studentId: string, pin: string) {
  try {
    const student = await prisma.student.findUnique({
      where: { student_id: studentId },
    });

    if (!student) {
      return { success: false, message: "Student ID not found in the system." };
    }

    const isPinValid = await bcrypt.compare(pin, student.recovery_pin);

    if (!isPinValid) {
      return { success: false, message: "Incorrect Recovery PIN." };
    }

    // Instead of deleting, we just wipe the keys to keep their attendance history safe
    await prisma.student.update({
      where: { student_id: studentId },
      data: {
        public_key: "",
        recovery_pin: "",
      },
    });

    return {
      success: true,
      message: "Device access revoked. You may now register your new device.",
    };
  } catch (error) {
    console.error("Recovery error:", error);
    return { success: false, message: "Failed to process recovery request." };
  }
}

export async function verifyAdminSecret(secret: string) {
  const configuredSecret = process.env.ADMIN_SETUP_SECRET;

  if (!configuredSecret) {
    return {
      success: false,
      message: "Administrative secret is not configured.",
    };
  }

  if (secret !== configuredSecret) {
    return {
      success: false,
      message: "Invalid Administrative Secret.",
    };
  }

  return {
    success: true,
    message: "Administrative Secret verified.",
  };
}

export async function getLabRooms() {
  try {
    const schedules = await prisma.schedule.findMany({
      select: { lab_room: true },
      distinct: ["lab_room"],
    });
    const rooms = schedules.map((s) => s.lab_room);
    return { success: true, data: rooms };
  } catch (error) {
    console.error(error);
    return { success: false, data: [] };
  }
}

function convertTimeToMinutes(timeStr: string) {
  // Removes all spaces and forces uppercase so "4:10PM" and " 04:10 PM " become identical
  const cleanStr = timeStr.replace(/\s+/g, "").toUpperCase();

  // Extracts the hours, minutes, and AM/PM regardless of formatting
  const match = cleanStr.match(/(\d+):(\d+)(AM|PM)/);
  if (!match) return 0;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const modifier = match[3];

  if (hours === 12) {
    hours = modifier === "AM" ? 0 : 12;
  } else if (modifier === "PM") {
    hours += 12;
  }

  return hours * 60 + minutes;
}

export async function submitAttendance(data: {
  studentId: string;
  labRoom: string;
  timestamp: string;
  signature: string;
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
        message:
          "DEVICE_REVOKED: Your device access has been revoked. Please re-register.",
      };
    }

    const encoder = new TextEncoder();
    const encodedMessage = encoder.encode(
      `${data.studentId}-${data.labRoom}-${data.timestamp}`,
    );

    const binarySignature = new Uint8Array(
      atob(data.signature)
        .split("")
        .map((c) => c.charCodeAt(0)),
    );
    const binaryPublicKey = new Uint8Array(
      atob(student.public_key)
        .split("")
        .map((c) => c.charCodeAt(0)),
    );

    // FIX 1: Added globalThis to prevent Node.js crashes
    const importedPublicKey = await globalThis.crypto.subtle.importKey(
      "spki",
      binaryPublicKey,
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["verify"],
    );

    // FIX 1: Added globalThis here as well
    const isValid = await globalThis.crypto.subtle.verify(
      { name: "ECDSA", hash: { name: "SHA-256" } },
      importedPublicKey,
      binarySignature,
      encodedMessage,
    );

    if (!isValid) {
      return {
        success: false,
        message: "Digital signature verification failed.",
      };
    }

    const now = new Date();
    const phTimeFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Manila",
      weekday: "long",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    });

    const timeParts = phTimeFormatter.formatToParts(now);
    let currentDay = "";
    let currentHour = 0;
    let currentMinute = 0;

    for (const part of timeParts) {
      if (part.type === "weekday") currentDay = part.value;
      if (part.type === "hour") currentHour = parseInt(part.value);
      if (part.type === "minute") currentMinute = parseInt(part.value);
    }

    const currentMinutesSinceMidnight = currentHour * 60 + currentMinute;

    const activeSchedules = await prisma.schedule.findMany({
      where: {
        lab_room: data.labRoom,
        date: currentDay,
      },
    });

    let matchedScheduleId = null;
    let attendanceStatus = "ON_TIME";

    for (const sched of activeSchedules) {
      // FIX 2: Bulletproof splitting for schedules.json formatting
      const [startStr, endStr] = sched.schedule.split(/\s*-\s*/);

      if (!startStr || !endStr) continue;

      const classStartMins = convertTimeToMinutes(startStr);
      const classEndMins = convertTimeToMinutes(endStr);

      const allowedStartMins = classStartMins - 15;

      if (
        currentMinutesSinceMidnight >= allowedStartMins &&
        currentMinutesSinceMidnight <= classEndMins
      ) {
        matchedScheduleId = sched.id;

        if (currentMinutesSinceMidnight > classStartMins + 15) {
          attendanceStatus = "LATE";
        }
        break;
      }
    }

    if (!matchedScheduleId) {
      return {
        success: false,
        message:
          "Error: No active class session found for you in this room at this current time.",
      };
    }

    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

    const existingLog = await prisma.attendanceLog.findFirst({
      where: {
        student_id: data.studentId,
        schedule_id: matchedScheduleId,
        timestamp: {
          gte: twelveHoursAgo,
        },
      },
    });

    if (existingLog) {
      return {
        success: false,
        message: "Attendance already recorded for this session today.",
      };
    }

    // 4. Save the Verified and Time-Checked Record
    await prisma.attendanceLog.create({
      data: {
        student_id: data.studentId,
        schedule_id: matchedScheduleId,
        status: attendanceStatus,
        signature: data.signature,
      },
    });

    return {
      success: true,
      message: `Attendance securely recorded. Status: ${attendanceStatus}`,
    };
  } catch (error) {
    console.error("Attendance submission error:", error);
    return {
      success: false,
      message: "Server error while processing attendance.",
    };
  }
}

export async function getAdminData() {
  try {
    const logs = await prisma.attendanceLog.findMany({
      include: { student: true, schedule: true },
      orderBy: { timestamp: "desc" },
    });
    const students = await prisma.student.findMany();
    // Fetch the schedules to display in the new viewer
    const schedules = await prisma.schedule.findMany({
      orderBy: [{ lab_room: "asc" }, { date: "asc" }],
    });
    return { success: true, logs, students, schedules };
  } catch (error) {
    console.error(error);
    return { success: false, logs: [], students: [], schedules: [] };
  }
}

export async function resetStudentDevice(studentId: string) {
  try {
    // Again, we just wipe the keys instead of deleting the student
    await prisma.student.update({
      where: { student_id: studentId },
      data: {
        public_key: "",
        recovery_pin: "",
      },
    });
    return {
      success: true,
      message: "Student device access revoked successfully.",
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Failed to reset student device." };
  }
}

export async function registerAdmin(adminId: string, password: string) {
  try {
    const existingAdmin = await prisma.admin.findUnique({
      where: { admin_id: adminId },
    });

    if (existingAdmin) {
      return { success: false, message: "This Admin ID is already registered." };
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await prisma.admin.create({
      data: {
        admin_id: adminId,
        password: hashedPassword,
      },
    });

    return { success: true, message: "Admin account successfully created!" };
  } catch (error) {
    console.error("Admin registration error:", error);
    return { success: false, message: "Server error during registration." };
  }
}

export async function loginAdmin(adminId: string, password: string) {
  try {
    const admin = await prisma.admin.findUnique({
      where: { admin_id: adminId },
    });

    if (!admin) {
      return { success: false, message: "Invalid Admin ID or password." };
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return { success: false, message: "Invalid Admin ID or password." };
    }

    return { success: true, message: "Login successful." };
  } catch (error) {
    console.error("Admin login error:", error);
    return { success: false, message: "Server error during verification." };
  }
}

export async function createSchedule(data: {
  lab_room: string;
  date: string;
  schedule: string;
  course_code: string;
  section: string;
  professor_name: string;
}) {
  try {
    await prisma.schedule.create({
      data: {
        lab_room: data.lab_room,
        date: data.date,
        schedule: data.schedule,
        course_code: data.course_code,
        section: data.section,
        professor_name: data.professor_name,
      },
    });
    return { success: true, message: "Class schedule created successfully." };
  } catch (error) {
    console.error("Create schedule error:", error);
    return { success: false, message: "Failed to create the schedule." };
  }
}

export async function updateSchedule(
  id: number,
  data: {
    lab_room: string;
    date: string;
    schedule: string;
    course_code: string;
    section: string;
    professor_name: string;
  },
) {
  try {
    await prisma.schedule.update({
      where: { id: id },
      data: {
        lab_room: data.lab_room,
        date: data.date,
        schedule: data.schedule,
        course_code: data.course_code,
        section: data.section,
        professor_name: data.professor_name,
      },
    });
    return { success: true, message: "Class schedule updated successfully." };
  } catch (error) {
    console.error("Update schedule error:", error);
    return { success: false, message: "Failed to update the schedule." };
  }
}

export async function deleteSchedule(id: number) {
  try {
    await prisma.schedule.delete({
      where: { id: id },
    });
    return { success: true, message: "Class schedule deleted successfully." };
  } catch (error) {
    console.error("Delete schedule error:", error);
    return { success: false, message: "Failed to delete the schedule." };
  }
}

export async function manualAttendanceOverride(data: {
  studentId: string;
  scheduleId: number;
  status: string;
}) {
  try {
    const student = await prisma.student.findUnique({
      where: { student_id: data.studentId },
    });

    if (!student) {
      return {
        success: false,
        message: "Student ID not found in the database.",
      };
    }

    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const existingLog = await prisma.attendanceLog.findFirst({
      where: {
        student_id: data.studentId,
        schedule_id: data.scheduleId,
        timestamp: {
          gte: twelveHoursAgo,
        },
      },
    });

    if (existingLog) {
      return {
        success: false,
        message: "Student already has an attendance record for this session.",
      };
    }

    await prisma.attendanceLog.create({
      data: {
        student_id: data.studentId,
        schedule_id: data.scheduleId,
        status: data.status,
        signature: "MANUAL_ADMIN_OVERRIDE",
      },
    });

    return {
      success: true,
      message: `Manual override successful. Student marked as ${data.status.replace("_", " ")}.`,
    };
  } catch (error) {
    console.error("Manual override error:", error);
    return { success: false, message: "Server error during manual override." };
  }
}

export async function checkRevokedStatus(studentId: string) {
  try {
    const student = await prisma.student.findUnique({
      where: { student_id: studentId }
    });
    
    // If the student exists and their key is blank, they are in recovery mode
    if (student && student.public_key === "") {
      return { 
        isRevoked: true, 
        firstName: student.first_name, 
        lastName: student.last_name 
      };
    }
    return { isRevoked: false };
  } catch (error) {
    return { isRevoked: false };
  }
}