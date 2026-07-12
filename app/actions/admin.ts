"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { logAdminAction } from "./audit";
import { checkRateLimit } from "@/lib/ratelimit";

export async function loginAdmin(userId: string, passwordString: string) {
  try {
    const rateLimit = await checkRateLimit("login_admin", userId);
    if (!rateLimit.success) {
      return { success: false, message: rateLimit.message };
    }

    const masterPassword = process.env.MASTER_ADMIN_PASSWORD;
    if (
      userId === "MASTER_ADMIN" &&
      masterPassword &&
      passwordString === masterPassword
    ) {
      const cookieStore = await cookies();
      cookieStore.set("admin_session", "MASTER_ADMIN", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 12,
        path: "/",
      });

      await logAdminAction(
        "ADMIN_LOGIN",
        "Master system administrator logged into control panel.",
        "MASTER_ADMIN",
        "MASTER_ADMIN"
      );

      return {
        success: true,
        adminId: "MASTER_ADMIN",
        name: "Master Administrator",
      };
    }

    const user = await prisma.user.findFirst({
      where: { user_id: userId, role: "ADMIN" },
    });

    if (!user) {
      return { success: false, message: "Invalid administrative credentials." };
    }

    const isMatch = await bcrypt.compare(passwordString, user.password);
    if (!isMatch) {
      return { success: false, message: "Invalid administrative credentials." };
    }

    const cookieStore = await cookies();
    cookieStore.set("admin_session", user.user_id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 12,
      path: "/",
    });

    await logAdminAction(
      "ADMIN_LOGIN",
      `Administrator ${user.name} logged into control panel.`,
      user.user_id,
      user.user_id
    );

    return {
      success: true,
      adminId: user.user_id,
      name: user.name,
    };
  } catch (error) {
    return {
      success: false,
      message: "Server error during administrative authentication.",
    };
  }
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
  return { success: true };
}

export async function createAdminAccount(
  userId: string,
  name: string,
  passwordString: string
) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { user_id: userId },
    });
    if (existingUser) {
      return { success: false, message: "This User ID is already registered." };
    }

    const hashedPassword = await bcrypt.hash(passwordString, 10);
    const newUser = await prisma.user.create({
      data: {
        user_id: userId,
        name: name,
        password: hashedPassword,
        role: "ADMIN",
      },
    });

    await logAdminAction(
      "CREATE_ADMIN_ACCOUNT",
      `Created administrator account for ${name} (User ID: ${userId}).`,
      userId
    );

    return {
      success: true,
      message: "Administrative account successfully created.",
      adminDbId: newUser.id,
    };
  } catch (error) {
    return { success: false, message: "Failed to create administrator account." };
  }
}

export async function createStaffAccount(
  userId: string,
  name: string,
  passwordString: string,
  role: "ADMIN" | "TEACHER"
) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { user_id: userId },
    });
    if (existingUser) {
      return { success: false, message: "This User ID is already registered." };
    }

    const hashedPassword = await bcrypt.hash(passwordString, 10);
    const newUser = await prisma.user.create({
      data: {
        user_id: userId,
        name: name,
        password: hashedPassword,
        role: role,
      },
    });

    await logAdminAction(
      role === "ADMIN" ? "CREATE_ADMIN_ACCOUNT" : "CREATE_TEACHER_ACCOUNT",
      `Created ${role.toLowerCase()} account for ${name} (User ID: ${userId}).`,
      userId
    );

    return {
      success: true,
      message: `${role === "ADMIN" ? "Administrator" : "Teacher"} account successfully created.`,
      staffId: newUser.id,
    };
  } catch (error) {
    return { success: false, message: "Failed to create staff account." };
  }
}

export async function deleteTeacherAccount(teacherDbId: number) {
  try {
    const teacher = await prisma.user.findUnique({
      where: { id: teacherDbId },
    });
    await prisma.schedule.updateMany({
      where: { teacher_id: teacherDbId },
      data: { teacher_id: null },
    });
    await prisma.user.delete({ where: { id: teacherDbId } });
    await logAdminAction(
      "DELETE_TEACHER_ACCOUNT",
      `Permanently deleted instructor account ${teacher?.name || ""} (User ID: ${teacher?.user_id || teacherDbId}).`,
      teacher?.user_id || String(teacherDbId)
    );
    return { success: true, message: "Staff account permanently deleted." };
  } catch (error) {
    return { success: false, message: "Failed to delete the staff account." };
  }
}

export async function resetStudentDevice(studentId: string) {
  try {
    await prisma.student.update({
      where: { student_id: studentId },
      data: { public_key: "", recovery_pin: "" },
    });
    await logAdminAction(
      "RESET_STUDENT_DEVICE",
      `Revoked hardware key and security PIN registration for student ID ${studentId}.`,
      studentId
    );
    return {
      success: true,
      message: "Student device access revoked successfully.",
    };
  } catch (error) {
    return { success: false, message: "Failed to reset student device." };
  }
}

export async function getAdminData() {
  try {
    const logs = await prisma.attendanceLog.findMany({
      include: { student: true, schedule: true },
      orderBy: { timestamp: "desc" },
    });
    const students = await prisma.student.findMany();
    const schedules = await prisma.schedule.findMany({
      orderBy: [{ lab_room: "asc" }, { date: "asc" }],
    });
    const auditLogs = await prisma.auditLog.findMany({
      orderBy: { timestamp: "desc" },
    });
    return { success: true, logs, students, schedules, auditLogs };
  } catch (error) {
    return { success: false, logs: [], students: [], schedules: [], auditLogs: [] };
  }
}

export async function fetchAdminData() {
  try {
    const teachers = await prisma.user.findMany({
      where: { role: { in: ["TEACHER", "ADMIN"] } },
      select: { id: true, user_id: true, name: true, role: true },
    });
    const schedules = await prisma.schedule.findMany({
      include: { teacher: { select: { name: true, user_id: true } } },
      orderBy: [{ date: "asc" }, { lab_room: "asc" }],
    });
    const logs = await prisma.attendanceLog.findMany({
      include: { student: true, schedule: true },
      orderBy: { timestamp: "desc" },
    });
    const auditLogs = await prisma.auditLog.findMany({
      orderBy: { timestamp: "desc" },
    });
    return { success: true, teachers, schedules, logs, auditLogs };
  } catch (error) {
    return { success: false, teachers: [], schedules: [], logs: [], auditLogs: [] };
  }
}