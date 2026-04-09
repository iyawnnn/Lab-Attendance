import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  await prisma.attendanceLog.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany(); 

  const admin = await prisma.user.create({
    data: {
      user_id: "MASTER_ADMIN",
      public_key: "PENDING_REGISTRATION", 
      role: "ADMIN"
    }
  });

  const teacher = await prisma.user.create({
    data: {
      user_id: "DEFAULT_TEACHER",
      public_key: "PENDING_REGISTRATION",
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