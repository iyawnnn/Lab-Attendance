"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { logAdminAction } from "./audit";

export async function loginTeacher(userId: string, passwordString: string) {
  try {
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

export async function generateSessionPin(
  scheduleId: number,
  teacherUserId: string
) {
  try {
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      return { success: false, message: "Schedule not found." };
    }

    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    const dbExpiresAt = new Date(Date.now() + 70 * 1000);

    await prisma.schedule.update({
      where: { id: scheduleId },
      data: { active_pin: pin, pin_expires_at: dbExpiresAt },
    });

    await logAdminAction(
      "GENERATE_SESSION_PIN",
      `Teacher generated 60s PIN for room ${schedule.lab_room} (${schedule.course_code}).`,
      String(scheduleId),
      teacherUserId
    );

    return {
      success: true,
      pin,
      expiresAt: new Date(Date.now() + 60 * 1000).toISOString(),
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