"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { logAdminAction } from "./audit";
import { checkRateLimit } from "@/lib/ratelimit";

export async function loginTeacher(userId: string, passwordString: string) {
  try {
    const rateLimit = await checkRateLimit("login_teacher", userId);
    if (!rateLimit.success) {
      return { success: false, message: rateLimit.message };
    }

    const user = await prisma.user.findUnique({ where: { user_id: userId } });
    if (!user) return { success: false, message: "Invalid credentials." };
    if (user.role !== "TEACHER" && user.role !== "ADMIN")
      return { success: false, message: "Unauthorized access level." };
    const isMatch = await bcrypt.compare(passwordString, user.password);
    if (!isMatch) return { success: false, message: "Invalid credentials." };

    const cookieStore = await cookies();
    cookieStore.set("teacher_session", user.user_id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 12,
      path: "/",
    });

    return {
      success: true,
      message: "Authentication successful.",
      teacherId: user.user_id,
      name: user.name,
    };
  } catch (error) {
    return { success: false, message: "Server error during authentication." };
  }
}

export async function logoutTeacher() {
  const cookieStore = await cookies();
  cookieStore.delete("teacher_session");
  return { success: true };
}

export async function getTeacherDashboardData(teacherUserId: string) {
  try {
    const teacher = await prisma.user.findUnique({
      where: { user_id: teacherUserId },
    });
    if (!teacher) return { success: false, schedules: [] };
    const schedules = await prisma.schedule.findMany({
      where: { teacher_id: teacher.id },
      include: {
        attendances: {
          include: { student: true },
          orderBy: { timestamp: "desc" },
        },
      },
    });
    return { success: true, schedules };
  } catch (error) {
    return { success: false, schedules: [] };
  }
}

// 🟢 NEW: Instantly kills an active PIN session in the database
export async function clearSessionPin(scheduleId: number) {
  try {
    await prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        active_pin: null,
        pin_expires_at: null,
      },
    });
    return { success: true };
  } catch (error) {
    return { success: false, message: "Failed to stop session." };
  }
}

export async function generateSessionPin(
  scheduleId: number,
  teacherUserId: string,
  durationSeconds: number // 🟢 Pass the teacher's custom time here
) {
  try {
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      return { success: false, message: "Schedule not found." };
    }

    // 1. Strictly enforce the 60s to 900s (15 min) limit on the backend
    const safeDuration = Math.max(60, Math.min(durationSeconds, 900));

    // 2. Generate 4-digit PIN (1000 - 9999)
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    
    // 3. Keep your 10-second network buffer for the database
    const dbExpiresAt = new Date(Date.now() + (safeDuration + 10) * 1000);

    await prisma.schedule.update({
      where: { id: scheduleId },
      data: { active_pin: pin, pin_expires_at: dbExpiresAt },
    });

    await logAdminAction(
      "GENERATE_SESSION_PIN",
      `Teacher generated a ${safeDuration}s PIN for room ${schedule.lab_room} (${schedule.course_code}).`,
      String(scheduleId),
      teacherUserId
    );

    return {
      success: true,
      pin,
      // 4. Return the exact time to the client UI so the countdown is perfectly accurate
      expiresAt: new Date(Date.now() + safeDuration * 1000).toISOString(),
    };
  } catch (error) {
    return { success: false, message: "Failed to generate session PIN." };
  }
}

export async function changeTeacherPassword(
  teacherUserId: string,
  currentPass: string,
  newPass: string
) {
  try {
    const user = await prisma.user.findFirst({
      where: { user_id: teacherUserId, role: "TEACHER" },
    });
    if (!user)
      return { success: false, message: "Instructor profile not found." };
    const isValid = await bcrypt.compare(currentPass, user.password);
    if (!isValid)
      return { success: false, message: "Current password is incorrect." };
    const hashedNewPassword = await bcrypt.hash(newPass, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword },
    });
    return { success: true, message: "Password securely updated." };
  } catch (error) {
    return { success: false, message: "Server error during password update." };
  }
}

export async function manuallyAdmitStudent(data: {
  studentId: string;
  scheduleId: number;
  teacherUserId: string;
  status: string;
}) {
  try {
    const teacher = await prisma.user.findUnique({
      where: { user_id: data.teacherUserId },
    });

    if (!teacher) {
      return { success: false, message: "Instructor authorization failed." };
    }

    const schedule = await prisma.schedule.findUnique({
      where: { id: data.scheduleId },
    });

    if (!schedule || schedule.teacher_id !== teacher.id) {
      return {
        success: false,
        message: "Unauthorized. You do not manage this schedule.",
      };
    }

    const student = await prisma.student.findUnique({
      where: { student_id: data.studentId },
    });

    if (!student) {
      return {
        success: false,
        message: "Student ID does not exist in the system.",
      };
    }

    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const existingLog = await prisma.attendanceLog.findFirst({
      where: {
        student_id: data.studentId,
        schedule_id: data.scheduleId,
        timestamp: { gte: twelveHoursAgo },
      },
    });

    if (existingLog) {
      return {
        success: false,
        message: "Student is already recorded as present for this session.",
      };
    }

    await prisma.attendanceLog.create({
      data: {
        student_id: data.studentId,
        schedule_id: data.scheduleId,
        status: data.status,
        signature: `OVERRIDE_AUTHORIZED_BY_${data.teacherUserId}`,
      },
    });

    return {
      success: true,
      message: `Student ${data.studentId} has been manually admitted.`,
    };
  } catch (error) {
    return {
      success: false,
      message: "Database error during manual override.",
    };
  }
}