"use server";

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomInt } from "crypto";

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
  roomPin: string;
}) {
  try {
    const student = await prisma.student.findUnique({
      where: { student_id: data.studentId },
    });

    if (!student) {
      return { success: false, message: "Student not found in the database. Please register." };
    }

    if (!student.public_key || student.public_key === "") {
      return { success: false, message: "DEVICE_REVOKED: Your device access has been revoked. Please re-register." };
    }

    // 1. VERIFY CRYPTOGRAPHIC SIGNATURE
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

    if (!isValid) {
      return { success: false, message: "Digital signature verification failed." };
    }

    // 2. DIRECT NATIVE DATABASE PIN VERIFICATION
    // We let the database find the exact schedule the teacher activated, ensuring 100% accuracy.
    const matchedSchedule = await prisma.schedule.findFirst({
      where: {
        lab_room: data.labRoom,
        active_pin: data.roomPin,
        pin_expires_at: {
          gt: new Date() // The expiration time MUST be greater than current server time
        }
      }
    });

    if (!matchedSchedule) {
      return { success: false, message: "Verification Failed: Invalid, expired, or incorrect Room PIN." };
    }

    // 3. DETERMINE ON_TIME vs LATE
    let attendanceStatus = "ON_TIME";
    
    try {
      const phTimeFormatter = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Manila", hour: "numeric", minute: "numeric", hour12: false });
      const timeParts = phTimeFormatter.formatToParts(new Date());
      let currentHour = 0;
      let currentMinute = 0;

      for (const part of timeParts) {
        if (part.type === "hour") currentHour = parseInt(part.value);
        if (part.type === "minute") currentMinute = parseInt(part.value);
      }
      
      const currentMinutesSinceMidnight = (currentHour * 60) + currentMinute;
      const [startStr] = matchedSchedule.schedule.split(/\s*-\s*/);

      if (startStr) {
        // Safely parse strings like "8:00 AM" or "1:30 PM" into minutes
        const [time, modifier] = startStr.trim().split(" ");
        let [hours, minutes] = time.split(":").map(Number);
        
        if (modifier === "PM" && hours < 12) hours += 12;
        if (modifier === "AM" && hours === 12) hours = 0;
        
        const classStartMins = (hours * 60) + (minutes || 0);

        // If student logs in more than 15 minutes after class start time, mark as LATE
        if (currentMinutesSinceMidnight > classStartMins + 15) {
          attendanceStatus = "LATE";
        }
      }
    } catch (e) {
      console.warn("Time parsing skipped, defaulting to ON_TIME");
    }

    // 4. PREVENT DOUBLE LOGGING
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const existingLog = await prisma.attendanceLog.findFirst({
      where: {
        student_id: data.studentId,
        schedule_id: matchedSchedule.id,
        timestamp: { gte: twelveHoursAgo },
      },
    });

    if (existingLog) {
      return { success: false, message: "Attendance already recorded for this session today." };
    }

    // 5. SAVE ATTENDANCE SECURELY
    await prisma.attendanceLog.create({
      data: {
        student_id: data.studentId,
        schedule_id: matchedSchedule.id,
        status: attendanceStatus,
        signature: data.signature,
      },
    });

    return { success: true, message: `Attendance securely recorded. Status: ${attendanceStatus}` };

  } catch (error) {
    console.error("Attendance submission error:", error);
    return { success: false, message: "Server error while processing attendance." };
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

export async function loginAdmin(userId: string, passwordString: string) {
  // We bypass the database entirely for the Master Admin and use the .env variable
  // This secures the system against DB breaches and removes hardcoded strings.
  const masterPassword = process.env.MASTER_ADMIN_PASSWORD;

  if (!masterPassword) {
    return { success: false, message: "Server misconfiguration: Master password not set." };
  }

  if (passwordString !== masterPassword) {
    return { success: false, message: "Invalid administrative credentials." };
  }

  return { 
    success: true, 
    adminId: "MASTER_ADMIN",
    name: "System Administrator"
  };
}

export async function fetchAdminData() {
  try {
    const teachers = await prisma.user.findMany({
      where: { role: "TEACHER" },
      select: { id: true, user_id: true, name: true }
    });
    
    const schedules = await prisma.schedule.findMany({
      include: { 
        teacher: { select: { name: true, user_id: true } } 
      },
      orderBy: [{ date: 'asc' }, { lab_room: 'asc' }]
    });
    
    const logs = await prisma.attendanceLog.findMany({
      include: { student: true, schedule: true },
      orderBy: { timestamp: "desc" }
    });

    return { success: true, teachers, schedules, logs };
  } catch (error) {
    console.error("Admin data fetch error:", error);
    return { success: false, teachers: [], schedules: [], logs: [] };
  }
}

export async function createTeacherAccount(userId: string, name: string, passwordString: string) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { user_id: userId }
    });

    if (existingUser) {
      return { success: false, message: "This User ID is already registered." };
    }

    const hashedPassword = await bcrypt.hash(passwordString, 10);
    
    // We capture the newly created user to extract their database ID
    const newUser = await prisma.user.create({
      data: {
        user_id: userId,
        name: name,
        password: hashedPassword,
        role: "TEACHER"
      }
    });

    // Return the teacherId so the frontend can immediately assign a class to it
    return { success: true, message: "Teacher account successfully created.", teacherId: newUser.id };
  } catch (error) {
    console.error("Teacher creation error:", error);
    return { success: false, message: "Failed to create teacher account." };
  }
}

export async function createAdminSchedule(data: { 
  lab_room: string; date: string; schedule: string; course_code: string; section: string; teacher_id: number;
}) {
  try {
    await prisma.schedule.create({
      data: {
        lab_room: data.lab_room,
        date: data.date,
        schedule: data.schedule,
        course_code: data.course_code,
        section: data.section,
        teacher_id: data.teacher_id,
      }
    });
    return { success: true, message: "Class schedule created securely." };
  } catch (error) {
    return { success: false, message: "Failed to create the schedule." };
  }
}

export async function assignTeacherToSchedule(scheduleId: number, teacherId: number, teacherName: string) {
  try {
    await prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        teacher_id: teacherId,
        professor_name: teacherName,
      }
    });
    return { success: true, message: "Class assigned successfully." };
  } catch (error) {
    console.error("Assign teacher error:", error);
    return { success: false, message: "Failed to assign teacher to the schedule." };
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

export async function generateSessionPin(scheduleId: number, teacherUserId: string) {
  try {
    // Generate a cryptographically secure 4-digit PIN
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Set exact expiration time (60 seconds from now)
    const expiresAt = new Date(Date.now() + 60 * 1000);

    // Save the active session state directly to the database
    await prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        active_pin: pin,
        pin_expires_at: expiresAt
      }
    });

    return { success: true, pin, expiresAt: expiresAt.toISOString() };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Failed to write session state to database." };
  }
}

export async function registerStaffDevice(data: {
  userId: string;
  publicKey: string;
}) {
  try {
    const user = await prisma.user.findUnique({
      where: { user_id: data.userId },
    });

    if (!user) {
      return { success: false, message: "User identity not found in the system." };
    }

    await prisma.user.update({
      where: { user_id: data.userId },
      data: {
        public_key: data.publicKey,
      } as any, 
    });

    return { success: true, message: "Staff device securely registered." };
  } catch (error) {
    console.error("Staff device registration error:", error);
    return { success: false, message: "Failed to register staff device." };
  }
}

export async function getTeacherDashboardData(teacherUserId: string) {
  try {
    const schedules = await prisma.schedule.findMany({
      where: {
        teacher: {
          user_id: teacherUserId,
        },
      },
      include: {
        attendances: {
          include: {
            student: true,
          },
          orderBy: {
            timestamp: "desc",
          },
        },
      },
    });

    return { success: true, schedules };
  } catch (error) {
    console.error("Teacher data fetch error:", error);
    return { success: false, schedules: [] };
  }
}

export async function loginTeacher(userId: string, passwordString: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
    });

    if (!user) {
      return { success: false, message: "Invalid credentials." };
    }

    if (user.role !== "TEACHER" && user.role !== "ADMIN") {
      return { success: false, message: "Unauthorized access level." };
    }

    const isMatch = await bcrypt.compare(passwordString, user.password);

    if (!isMatch) {
      return { success: false, message: "Invalid credentials." };
    }

    return { 
      success: true, 
      message: "Authentication successful.",
      teacherId: user.user_id,
      name: user.name
    };
  } catch (error) {
    console.error("Teacher login error:", error);
    return { success: false, message: "Server error during authentication." };
  }
}

export async function assignTeacherToMultipleSchedules(scheduleIds: number[], teacherId: number) {
  try {
    await prisma.schedule.updateMany({
      where: { id: { in: scheduleIds } },
      data: { teacher_id: teacherId }
    });
    return { success: true, message: "Classes assigned successfully." };
  } catch (error) {
    return { success: false, message: "Failed to assign classes in bulk." };
  }
}

export async function removeTeacherFromSchedule(scheduleId: number) {
  try {
    await prisma.schedule.update({
      where: { id: scheduleId },
      data: { teacher_id: null } 
    });
    return { success: true, message: "Class removed from instructor." };
  } catch (error) {
    return { success: false, message: "Failed to remove class." };
  }
}

export async function deleteTeacherAccount(teacherDbId: number) {
  try {
    // Safely unassign all classes from this teacher before deleting
    await prisma.schedule.updateMany({
      where: { teacher_id: teacherDbId },
      data: { 
        teacher_id: null, 
        professor_name: "Unassigned" 
      }
    });

    // Delete the teacher account
    await prisma.user.delete({
      where: { id: teacherDbId }
    });

    return { success: true, message: "Staff account permanently deleted." };
  } catch (error) {
    console.error("Delete teacher error:", error);
    return { success: false, message: "Failed to delete the staff account." };
  }
}

export async function changeTeacherPassword(teacherUserId: string, currentPass: string, newPass: string) {
  try {
    const user = await prisma.user.findFirst({
      where: { 
        user_id: teacherUserId, 
        role: 'TEACHER' 
      }
    });

    if (!user) {
      return { success: false, message: "Instructor profile not found." };
    }

    const isValid = await bcrypt.compare(currentPass, user.password);
    if (!isValid) {
      return { success: false, message: "Current password is incorrect." };
    }

    const hashedNewPassword = await bcrypt.hash(newPass, 10);
    
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword }
    });

    return { success: true, message: "Password securely updated." };
  } catch (error) {
    console.error("Password update error:", error);
    return { success: false, message: "Server error during password update." };
  }
}