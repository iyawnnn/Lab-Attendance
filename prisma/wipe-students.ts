import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("[WIPE] Starting database cleanup routine...");

  // 1. Wipe dependent attendance logs using your exact 'attendanceLog' model property
  console.log("[WIPE] Purging all student attendance logs...");
  const attendanceResult = await prisma.attendanceLog.deleteMany({});
  console.log(`[SUCCESS] Wiped ${attendanceResult.count} rows from attendance logs.`);

  // 2. Safely wipe student records now that foreign key dependencies are clear
  console.log("[WIPE] Purging all registered student accounts...");
  const studentResult = await prisma.student.deleteMany({});
  console.log(`[SUCCESS] Wiped ${studentResult.count} rows from the Student table.`);

  console.log("[STATUS] Database cleanup complete. Lab rooms, schedules, and user accounts remain completely untouched.");
}

main()
  .catch((e) => {
    console.error("[ERROR] Critical failure during database wipe execution:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });