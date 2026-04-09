import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  await prisma.attendanceLog.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();

  const adminPasswordRaw = process.env.DEFAULT_ADMIN_PASSWORD || "admin123";
  const teacherPasswordRaw = process.env.DEFAULT_TEACHER_PASSWORD || "teacher123";

  const saltRounds = 10;
  const adminPasswordHashed = await bcrypt.hash(adminPasswordRaw, saltRounds);
  const teacherPasswordHashed = await bcrypt.hash(teacherPasswordRaw, saltRounds);

  const admin = await prisma.user.create({
    data: {
      user_id: "MASTER_ADMIN",
      password: adminPasswordHashed,
      name: "System Admin",
      role: "ADMIN"
    }
  });

  const teacher = await prisma.user.create({
    data: {
      user_id: "DEFAULT_TEACHER",
      password: teacherPasswordHashed,
      name: "Default Professor",
      role: "TEACHER"
    }
  });

  const schedulesPath = path.join(process.cwd(), 'schedules.json');
  const schedulesData = JSON.parse(fs.readFileSync(schedulesPath, 'utf-8'));

  for (const item of schedulesData) {
    await prisma.schedule.create({
      data: {
        lab_room: item.lab_room,
        date: item.date,
        schedule: item.schedule,
        course_code: item.course_code,
        section: item.section,
        professor_name: item.professor_name,
        teacher_id: teacher.id,
      }
    });
  }

  console.log('Database seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });