// prisma/seed-sunday-test.ts

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // 1. Verify instructor TCH-001 exists
  const teacher = await prisma.user.findUnique({
    where: { user_id: "TCH-001" },
  });

  if (!teacher) {
    throw new Error("Teacher TCH-001 not found. Ensure npx prisma db seed has been run.");
  }

  // 2. Hash the security PIN using bcrypt
  const hashedPin = await bcrypt.hash("1234", 10);

  // 3. Create or update test student 999999999 with the hashed PIN
  const student = await prisma.student.upsert({
    where: { student_id: "999999999" },
    update: {
      recovery_pin: hashedPin,
    },
    create: {
      student_id: "999999999",
      first_name: "Sunday",
      last_name: "Tester",
      recovery_pin: hashedPin,
      public_key: "MOCK_PUBLIC_KEY_SUNDAY_TEST",
    },
  });

  // 4. Create two Sunday schedules
  const sundaySchedule1 = await prisma.schedule.create({
    data: {
      lab_room: "Lab 1",
      date: "Sunday",
      schedule: "Sunday 8:00 AM - 11:00 AM",
      course_code: "IT 412",
      section: "4A",
      teacher: {
        connect: { id: teacher.id },
      },
    },
  });

  const sundaySchedule2 = await prisma.schedule.create({
    data: {
      lab_room: "Lab 2",
      date: "Sunday",
      schedule: "Sunday 1:00 PM - 4:00 PM",
      course_code: "IT 413",
      section: "4B",
      teacher: {
        connect: { id: teacher.id },
      },
    },
  });

  // 5. Create attendance logs for student 999999999
  const now = new Date();
  const morningLogTime = new Date(now);
  morningLogTime.setHours(8, 15, 0, 0);

  const afternoonLogTime = new Date(now);
  afternoonLogTime.setHours(13, 45, 0, 0);

  await prisma.attendanceLog.createMany({
    data: [
      {
        student_id: student.student_id,
        schedule_id: sundaySchedule1.id,
        timestamp: morningLogTime,
        status: "ON_TIME",
        signature: "MOCK_ECDSA_SIGNATURE_SUNDAY_1",
      },
      {
        student_id: student.student_id,
        schedule_id: sundaySchedule2.id,
        timestamp: afternoonLogTime,
        status: "LATE",
        signature: "MOCK_ECDSA_SIGNATURE_SUNDAY_2",
      },
    ],
  });

  console.log(
    `Successfully hashed PIN and populated Sunday test data for student ${student.student_id} (${student.first_name} ${student.last_name}).`
  );
}

main()
  .catch((e) => {
    console.error("Error seeding Sunday test data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });