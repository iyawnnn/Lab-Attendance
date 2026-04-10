"use server";

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function registerStudentToDatabase(data: {
  studentId: string; firstName: string; lastName: string; publicKey: string; recoveryPin: string;
}) {
  try {
    const existingStudent = await prisma.student.findUnique({ where: { student_id: data.studentId } });
    const salt = await bcrypt.genSalt(10);
    const hashedPin = await bcrypt.hash(data.recoveryPin, salt);

    if (existingStudent) {
      if (existingStudent.public_key === "") {
        await prisma.student.update({
          where: { student_id: data.studentId },
          data: { public_key: data.publicKey, recovery_pin: hashedPin },
        });
        return { success: true, message: `Welcome back, ${existingStudent.first_name}! New device registered.` };
      } else {
        return { success: false, message: "Student ID is already registered to an active device." };
      }
    }

    await prisma.student.create({
      data: {
        student_id: data.studentId, first_name: data.firstName, last_name: data.lastName,
        public_key: data.publicKey, recovery_pin: hashedPin,
      },
    });
    return { success: true, message: "Student registered successfully." };
  } catch (error) {
    return { success: false, message: "Failed to connect to the database." };
  }
}

export async function recoverStudentDevice(studentId: string, pin: string) {
  try {
    const student = await prisma.student.findUnique({ where: { student_id: studentId } });
    if (!student) return { success: false, message: "Student ID not found in the system." };

    const isPinValid = await bcrypt.compare(pin, student.recovery_pin);
    if (!isPinValid) return { success: false, message: "Incorrect Recovery PIN." };

    await prisma.student.update({
      where: { student_id: studentId },
      data: { public_key: "", recovery_pin: "" },
    });
    return { success: true, message: "Device access revoked. You may now register your new device." };
  } catch (error) {
    return { success: false, message: "Failed to process recovery request." };
  }
}

export async function getLabRooms() {
  try {
    const schedules = await prisma.schedule.findMany({
      select: { lab_room: true }, distinct: ["lab_room"],
    });
    return { success: true, data: schedules.map((s) => s.lab_room) };
  } catch (error) {
    return { success: false, data: [] };
  }
}

export async function submitAttendance(data: {
  studentId: string; labRoom: string; timestamp: string; signature: string; roomPin: string;
}) {
  try {
    const student = await prisma.student.findUnique({ where: { student_id: data.studentId } });
    if (!student) return { success: false, message: "Student not found in the database. Please register." };
    if (!student.public_key || student.public_key === "") return { success: false, message: "DEVICE_REVOKED: Your device access has been revoked." };

    const encoder = new TextEncoder();
    const encodedMessage = encoder.encode(`${data.studentId}-${data.labRoom}-${data.timestamp}`);
    const binarySignature = new Uint8Array(atob(data.signature).split("").map((c) => c.charCodeAt(0)));
    const binaryPublicKey = new Uint8Array(atob(student.public_key).split("").map((c) => c.charCodeAt(0)));

    const importedPublicKey = await globalThis.crypto.subtle.importKey(
      "spki", binaryPublicKey, { name: "ECDSA", namedCurve: "P-256" }, true, ["verify"]
    );

    const isValid = await globalThis.crypto.subtle.verify(
      { name: "ECDSA", hash: { name: "SHA-256" } }, importedPublicKey, binarySignature, encodedMessage
    );

    if (!isValid) return { success: false, message: "Digital signature verification failed." };

    const matchedSchedule = await prisma.schedule.findFirst({
      where: { lab_room: data.labRoom, active_pin: data.roomPin, pin_expires_at: { gt: new Date() } }
    });

    if (!matchedSchedule) return { success: false, message: "Verification Failed: Invalid, expired, or incorrect Room PIN." };

    let attendanceStatus = "ON_TIME";
    try {
      const phTimeFormatter = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Manila", hour: "numeric", minute: "numeric", hour12: false });
      const timeParts = phTimeFormatter.formatToParts(new Date());
      let currentHour = 0; let currentMinute = 0;
      for (const part of timeParts) {
        if (part.type === "hour") currentHour = parseInt(part.value);
        if (part.type === "minute") currentMinute = parseInt(part.value);
      }
      
      const currentMinutesSinceMidnight = (currentHour * 60) + currentMinute;
      const [startStr] = matchedSchedule.schedule.split(/\s*-\s*/);
      if (startStr) {
        const [time, modifier] = startStr.trim().split(" ");
        let [hours, minutes] = time.split(":").map(Number);
        if (modifier === "PM" && hours < 12) hours += 12;
        if (modifier === "AM" && hours === 12) hours = 0;
        const classStartMins = (hours * 60) + (minutes || 0);
        if (currentMinutesSinceMidnight > classStartMins + 15) attendanceStatus = "LATE";
      }
    } catch (e) {}

    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const existingLog = await prisma.attendanceLog.findFirst({
      where: { student_id: data.studentId, schedule_id: matchedSchedule.id, timestamp: { gte: twelveHoursAgo } },
    });

    if (existingLog) return { success: false, message: "Attendance already recorded for this session today." };

    await prisma.attendanceLog.create({
      data: { student_id: data.studentId, schedule_id: matchedSchedule.id, status: attendanceStatus, signature: data.signature },
    });

    return { success: true, message: `Attendance securely recorded. Status: ${attendanceStatus}` };
  } catch (error) {
    return { success: false, message: "Server error while processing attendance." };
  }
}

export async function getAdminData() {
  try {
    const logs = await prisma.attendanceLog.findMany({ include: { student: true, schedule: true }, orderBy: { timestamp: "desc" } });
    const students = await prisma.student.findMany();
    const schedules = await prisma.schedule.findMany({ orderBy: [{ lab_room: "asc" }, { date: "asc" }] });
    return { success: true, logs, students, schedules };
  } catch (error) {
    return { success: false, logs: [], students: [], schedules: [] };
  }
}

export async function resetStudentDevice(studentId: string) {
  try {
    await prisma.student.update({
      where: { student_id: studentId },
      data: { public_key: "", recovery_pin: "" },
    });
    return { success: true, message: "Student device access revoked successfully." };
  } catch (error) {
    return { success: false, message: "Failed to reset student device." };
  }
}

export async function loginAdmin(userId: string, passwordString: string) {
  const masterPassword = process.env.MASTER_ADMIN_PASSWORD;
  if (!masterPassword) return { success: false, message: "Server misconfiguration: Master password not set." };
  if (passwordString !== masterPassword) return { success: false, message: "Invalid administrative credentials." };
  return { success: true, adminId: "MASTER_ADMIN", name: "System Administrator" };
}

export async function fetchAdminData() {
  try {
    const teachers = await prisma.user.findMany({ where: { role: "TEACHER" }, select: { id: true, user_id: true, name: true } });
    const schedules = await prisma.schedule.findMany({
      include: { teacher: { select: { name: true, user_id: true } } },
      orderBy: [{ date: 'asc' }, { lab_room: 'asc' }]
    });
    const logs = await prisma.attendanceLog.findMany({ include: { student: true, schedule: true }, orderBy: { timestamp: "desc" } });
    return { success: true, teachers, schedules, logs };
  } catch (error) {
    return { success: false, teachers: [], schedules: [], logs: [] };
  }
}

export async function createTeacherAccount(userId: string, name: string, passwordString: string) {
  try {
    const existingUser = await prisma.user.findUnique({ where: { user_id: userId } });
    if (existingUser) return { success: false, message: "This User ID is already registered." };
    const hashedPassword = await bcrypt.hash(passwordString, 10);
    const newUser = await prisma.user.create({ data: { user_id: userId, name: name, password: hashedPassword, role: "TEACHER" } });
    return { success: true, message: "Teacher account successfully created.", teacherId: newUser.id };
  } catch (error) {
    return { success: false, message: "Failed to create teacher account." };
  }
}

export async function createSchedule(data: { lab_room: string; date: string; schedule: string; course_code: string; section: string; }) {
  try {
    await prisma.schedule.create({
      data: { lab_room: data.lab_room, date: data.date, schedule: data.schedule, course_code: data.course_code, section: data.section },
    });
    return { success: true, message: "Class schedule created successfully." };
  } catch (error) {
    return { success: false, message: "Failed to create the schedule." };
  }
}

export async function updateSchedule(id: number, data: { lab_room: string; date: string; schedule: string; course_code: string; section: string; }) {
  try {
    await prisma.schedule.update({
      where: { id: id },
      data: { lab_room: data.lab_room, date: data.date, schedule: data.schedule, course_code: data.course_code, section: data.section },
    });
    return { success: true, message: "Class schedule updated successfully." };
  } catch (error) {
    return { success: false, message: "Failed to update the schedule." };
  }
}

export async function deleteSchedule(id: number) {
  try {
    await prisma.schedule.delete({ where: { id: id } });
    return { success: true, message: "Class schedule deleted successfully." };
  } catch (error) {
    return { success: false, message: "Failed to delete the schedule." };
  }
}

export async function checkRevokedStatus(studentId: string) {
  try {
    const student = await prisma.student.findUnique({ where: { student_id: studentId } });
    if (student && student.public_key === "") return { isRevoked: true, firstName: student.first_name, lastName: student.last_name };
    return { isRevoked: false };
  } catch (error) {
    return { isRevoked: false };
  }
}

export async function generateSessionPin(scheduleId: number, teacherUserId: string) {
  try {
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 60 * 1000);
    await prisma.schedule.update({
      where: { id: scheduleId },
      data: { active_pin: pin, pin_expires_at: expiresAt }
    });
    return { success: true, pin, expiresAt: expiresAt.toISOString() };
  } catch (error) {
    return { success: false, message: "Failed to write session state to database." };
  }
}

export async function getTeacherDashboardData(teacherUserId: string) {
  try {
    const teacher = await prisma.user.findUnique({ where: { user_id: teacherUserId } });
    if (!teacher) return { success: false, schedules: [] };
    const schedules = await prisma.schedule.findMany({
      where: { teacher_id: teacher.id },
      include: { attendances: { include: { student: true }, orderBy: { timestamp: "desc" } } }
    });
    return { success: true, schedules };
  } catch (error) {
    return { success: false, schedules: [] };
  }
}

export async function loginTeacher(userId: string, passwordString: string) {
  try {
    const user = await prisma.user.findUnique({ where: { user_id: userId } });
    if (!user) return { success: false, message: "Invalid credentials." };
    if (user.role !== "TEACHER" && user.role !== "ADMIN") return { success: false, message: "Unauthorized access level." };
    const isMatch = await bcrypt.compare(passwordString, user.password);
    if (!isMatch) return { success: false, message: "Invalid credentials." };
    return { success: true, message: "Authentication successful.", teacherId: user.user_id, name: user.name };
  } catch (error) {
    return { success: false, message: "Server error during authentication." };
  }
}

// BATCH AND INDIVIDUAL ASSIGNMENT FIXES (No third argument for 'teacherName')
export async function assignTeacherToMultipleSchedules(scheduleIds: number[], teacherId: number) {
  try {
    await prisma.schedule.updateMany({ where: { id: { in: scheduleIds } }, data: { teacher_id: teacherId } });
    return { success: true, message: "Classes assigned successfully." };
  } catch (error) {
    return { success: false, message: "Failed to assign classes in bulk." };
  }
}

export async function assignTeacherToSchedule(scheduleId: number, teacherId: number) {
  try {
    await prisma.schedule.update({ where: { id: scheduleId }, data: { teacher_id: teacherId } });
    return { success: true, message: "Class assigned successfully." };
  } catch (error) {
    return { success: false, message: "Failed to assign teacher to the schedule." };
  }
}

export async function removeTeacherFromSchedule(scheduleId: number) {
  try {
    await prisma.schedule.update({ where: { id: scheduleId }, data: { teacher_id: null } });
    return { success: true, message: "Class removed from instructor." };
  } catch (error) {
    return { success: false, message: "Failed to remove class." };
  }
}

export async function deleteTeacherAccount(teacherDbId: number) {
  try {
    await prisma.schedule.updateMany({ where: { teacher_id: teacherDbId }, data: { teacher_id: null } });
    await prisma.user.delete({ where: { id: teacherDbId } });
    return { success: true, message: "Staff account permanently deleted." };
  } catch (error) {
    return { success: false, message: "Failed to delete the staff account." };
  }
}

export async function changeTeacherPassword(teacherUserId: string, currentPass: string, newPass: string) {
  try {
    const user = await prisma.user.findFirst({ where: { user_id: teacherUserId, role: 'TEACHER' } });
    if (!user) return { success: false, message: "Instructor profile not found." };
    const isValid = await bcrypt.compare(currentPass, user.password);
    if (!isValid) return { success: false, message: "Current password is incorrect." };
    const hashedNewPassword = await bcrypt.hash(newPass, 10);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashedNewPassword } });
    return { success: true, message: "Password securely updated." };
  } catch (error) {
    return { success: false, message: "Server error during password update." };
  }
}