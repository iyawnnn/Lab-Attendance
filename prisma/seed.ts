import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Initiating database wipe...');
  
  // 1. Wipe existing data to prevent relational conflicts
  await prisma.attendanceLog.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.user.deleteMany();
  await prisma.student.deleteMany();

  console.log('Database wiped successfully.');

  // 2. Read and parse the schedules.json file
  const schedulesPath = path.join(process.cwd(), 'schedules.json');
  const schedulesData = JSON.parse(fs.readFileSync(schedulesPath, 'utf-8'));

  // 3. Extract unique professor names (excluding empty strings)
  const uniqueProfessors = Array.from(
    new Set(
      schedulesData
        .map((s: any) => s.professor_name?.trim())
        .filter((name: string) => name && name !== "")
    )
  ) as string[];

  console.log(`Found ${uniqueProfessors.length} unique professors. Generating accounts...`);

  const defaultPassword = await bcrypt.hash('password123', 10);
  
  // 4. Create User accounts and map their names to their new database IDs
  const teacherIdMap = new Map<string, number>();

  for (let i = 0; i < uniqueProfessors.length; i++) {
    const professorName = uniqueProfessors[i];
    const generatedUserId = `TCH-${String(i + 1).padStart(3, '0')}`; // e.g., TCH-001

    const newTeacher = await prisma.user.create({
      data: {
        user_id: generatedUserId,
        name: professorName,
        password: defaultPassword,
        role: 'TEACHER',
      }
    });

    teacherIdMap.set(professorName, newTeacher.id);
    console.log(`Created account for ${professorName} (ID: ${generatedUserId})`);
  }

  // 5. Seed the schedules and link them to the newly created accounts
  console.log('Seeding schedules and establishing relations...');
  let assignedCount = 0;
  let unassignedCount = 0;

  for (const item of schedulesData) {
    const profName = item.professor_name?.trim();
    const teacherDbId = profName ? teacherIdMap.get(profName) : null;

    await prisma.schedule.create({
      data: {
        lab_room: item.lab_room,
        date: item.date,
        schedule: item.schedule,
        course_code: item.course_code,
        section: item.section,
        teacher_id: teacherDbId || null,
      }
    });

    if (teacherDbId) assignedCount++;
    else unassignedCount++;
  }

  console.log(`Seeding complete. ${assignedCount} classes assigned, ${unassignedCount} classes unassigned.`);
  console.log('Temporary password for all staff is: password123');
}

main()
  .catch((e) => {
    console.error('Fatal error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });