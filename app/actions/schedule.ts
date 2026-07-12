"use server";

import { prisma } from "@/lib/db";
import { logAdminAction } from "./audit";

export async function createSchedule(data: {
  lab_room: string;
  date: string;
  schedule: string;
  course_code: string;
  section: string;
}) {
  try {
    await prisma.schedule.create({
      data: {
        lab_room: data.lab_room,
        date: data.date,
        schedule: data.schedule,
        course_code: data.course_code,
        section: data.section,
      },
    });
    await logAdminAction(
      "CREATE_SCHEDULE",
      `Created schedule entry for course ${data.course_code} (Sec ${data.section}) in ${data.lab_room}.`,
      data.course_code
    );
    return { success: true, message: "Class schedule created successfully." };
  } catch (error) {
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
  }
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
      },
    });
    await logAdminAction(
      "UPDATE_SCHEDULE",
      `Updated parameters for schedule ID ${id} (${data.course_code}, Sec ${data.section}, ${data.lab_room}).`,
      String(id)
    );
    return { success: true, message: "Class schedule updated successfully." };
  } catch (error) {
    return { success: false, message: "Failed to update the schedule." };
  }
}

export async function deleteSchedule(id: number) {
  try {
    await prisma.schedule.delete({ where: { id: id } });
    await logAdminAction(
      "DELETE_SCHEDULE",
      `Deleted class schedule entry ID ${id}.`,
      String(id)
    );
    return { success: true, message: "Class schedule deleted successfully." };
  } catch (error) {
    return { success: false, message: "Failed to delete the schedule." };
  }
}

export async function assignTeacherToSchedule(
  scheduleId: number,
  teacherId: number
) {
  try {
    await prisma.schedule.update({
      where: { id: scheduleId },
      data: { teacher_id: teacherId },
    });
    await logAdminAction(
      "ASSIGN_TEACHER_SCHEDULE",
      `Assigned instructor DB ID ${teacherId} to schedule ID ${scheduleId}.`,
      String(scheduleId)
    );
    return { success: true, message: "Class assigned successfully." };
  } catch (error) {
    return {
      success: false,
      message: "Failed to assign teacher to the schedule.",
    };
  }
}

export async function assignTeacherToMultipleSchedules(
  scheduleIds: number[],
  teacherId: number
) {
  try {
    await prisma.schedule.updateMany({
      where: { id: { in: scheduleIds } },
      data: { teacher_id: teacherId },
    });
    await logAdminAction(
      "BATCH_ASSIGN_TEACHER_SCHEDULE",
      `Linked instructor DB ID ${teacherId} to ${scheduleIds.length} class schedule(s).`,
      String(teacherId)
    );
    return { success: true, message: "Classes assigned successfully." };
  } catch (error) {
    return { success: false, message: "Failed to assign classes in bulk." };
  }
}

export async function removeTeacherFromSchedule(scheduleId: number) {
  try {
    await prisma.schedule.update({
      where: { id: scheduleId },
      data: { teacher_id: null },
    });
    await logAdminAction(
      "REMOVE_TEACHER_SCHEDULE",
      `Unlinked instructor assignment from schedule ID ${scheduleId}.`,
      String(scheduleId)
    );
    return { success: true, message: "Class removed from instructor." };
  } catch (error) {
    return { success: false, message: "Failed to remove class." };
  }
}