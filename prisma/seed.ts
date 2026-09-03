import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seed boshlandi...");

  // Super Admin
  const adminHash = await bcrypt.hash("Admin123!@#", 12);
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      fullName: "Super Admin",
      username: "admin",
      email: "admin@crm.uz",
      passwordHash: adminHash,
      role: "SUPER_ADMIN",
      canManageLeads: true,
      canManageCourses: true,
      canManageUsers: true,
      canViewReports: true,
      canExportData: true,
    },
  });
  console.log("✅ Super Admin yaratildi:", admin.username);

  // Sample manager
  const managerHash = await bcrypt.hash("Manager123!", 12);
  await prisma.user.upsert({
    where: { username: "manager1" },
    update: {},
    create: {
      fullName: "Sardor Toshmatov",
      username: "manager1",
      passwordHash: managerHash,
      role: "MANAGER",
      canManageLeads: true,
      canViewReports: true,
    },
  });

  // Sample operators
  for (const [username, fullName] of [["operator1","Dilnoza Yusupova"],["operator2","Javlon Rahimov"]]) {
    const hash = await bcrypt.hash("Operator123!", 12);
    await prisma.user.upsert({
      where: { username },
      update: {},
      create: { fullName, username, passwordHash: hash, role: "OPERATOR", canManageLeads: true },
    });
  }
  console.log("✅ Hodimlar yaratildi");

  // Time Slots
  const timeSlots = [
    { startTime: "08:00", endTime: "09:30", label: "08:00 - 09:30" },
    { startTime: "09:30", endTime: "11:00", label: "09:30 - 11:00" },
    { startTime: "11:00", endTime: "12:30", label: "11:00 - 12:30" },
    { startTime: "12:30", endTime: "14:00", label: "12:30 - 14:00" },
    { startTime: "14:00", endTime: "15:30", label: "14:00 - 15:30" },
    { startTime: "15:30", endTime: "17:00", label: "15:30 - 17:00" },
    { startTime: "17:00", endTime: "18:30", label: "17:00 - 18:30" },
    { startTime: "18:30", endTime: "20:00", label: "18:30 - 20:00" },
  ];

  for (const slot of timeSlots) {
    const existing = await prisma.timeSlot.findFirst({ where: { startTime: slot.startTime } });
    if (!existing) await prisma.timeSlot.create({ data: slot });
  }
  console.log("✅ Vaqt slotlari yaratildi");

  // Courses
  const courses = [
    { name: "Frontend Development", slug: "frontend", description: "HTML, CSS, JavaScript, React", durationMonths: 6, price: 800000, color: "#6366f1" },
    { name: "Backend Development", slug: "backend", description: "Node.js, Python, Databases", durationMonths: 6, price: 800000, color: "#10b981" },
    { name: "Mobile Development", slug: "mobile", description: "React Native, Flutter", durationMonths: 6, price: 900000, color: "#f59e0b" },
    { name: "UI/UX Design", slug: "uiux", description: "Figma, Adobe XD, User Research", durationMonths: 4, price: 600000, color: "#ec4899" },
    { name: "Python & Data Science", slug: "python", description: "Python, ML, Data Analysis", durationMonths: 5, price: 750000, color: "#06b6d4" },
  ];

  for (const course of courses) {
    await prisma.course.upsert({
      where: { slug: course.slug },
      update: {},
      create: course,
    });
  }
  console.log("✅ Kurslar yaratildi");

  // Tags
  const tags = [
    { name: "VIP", color: "#f59e0b" },
    { name: "Shoshilinch", color: "#f43f5e" },
    { name: "Qayta murojaat", color: "#6366f1" },
    { name: "Stipendiyachi", color: "#10b981" },
    { name: "Talaba", color: "#06b6d4" },
    { name: "Ishchi", color: "#8b5cf6" },
    { name: "Maktab o'quvchisi", color: "#ec4899" },
    { name: "Referral", color: "#14b8a6" },
    { name: "Online", color: "#84cc16" },
    { name: "Offline", color: "#f97316" },
  ];

  for (const tag of tags) {
    await prisma.tag.upsert({ where: { name: tag.name }, update: {}, create: tag });
  }
  console.log("✅ Teglar yaratildi");

  // Settings
  await prisma.setting.upsert({
    where: { key: "center_name" },
    update: {},
    create: { key: "center_name", value: "IT O'quv Markaz", description: "Markaz nomi" },
  });
  await prisma.setting.upsert({
    where: { key: "timezone" },
    update: {},
    create: { key: "timezone", value: "Asia/Tashkent", description: "Vaqt mintaqasi" },
  });
  console.log("✅ Sozlamalar yaratildi");

  // Kanban stages — the board renders nothing at all when this table is empty.
  const stages = [
    { name: "Yangi", color: "#6366f1", order: 0, status: "NEW" as const },
    { name: "Bog'landi", color: "#3b82f6", order: 1, status: "CONTACTED" as const },
    { name: "Qiziqdi", color: "#06b6d4", order: 2, status: "INTERESTED" as const },
    { name: "Sinov bron", color: "#f59e0b", order: 3, status: "TRIAL_BOOKED" as const },
    { name: "Sinov o'tdi", color: "#f97316", order: 4, status: "TRIAL_COMPLETED" as const },
    { name: "Yozildi", color: "#10b981", order: 5, status: "ENROLLED" as const, isWon: true },
    { name: "Kechiktirildi", color: "#eab308", order: 6, status: "POSTPONED" as const },
    { name: "Yo'qotildi", color: "#ef4444", order: 7, status: "LOST" as const, isLost: true },
  ];
  const stageByStatus: Record<string, string> = {};
  for (const { name, color, order, status, isWon, isLost } of stages) {
    let stage = await prisma.stage.findFirst({ where: { name } });
    if (!stage) stage = await prisma.stage.create({ data: { name, color, order, isWon: !!isWon, isLost: !!isLost } });
    stageByStatus[status] = stage.id;
  }
  console.log("✅ Kanban ustunlari yaratildi");

  // Sample leads
  const allCourses = await prisma.course.findMany();
  const allSlots = await prisma.timeSlot.findMany();
  const operators = await prisma.user.findMany({ where: { role: { in: ["OPERATOR","MANAGER"] } } });

  const sampleLeads = [
    { fullName: "Aziza Karimova", phone: "+998901234567", source: "INSTAGRAM" as const, status: "NEW" as const },
    { fullName: "Bobur Toshmatov", phone: "+998911234568", source: "TELEGRAM" as const, status: "CONTACTED" as const },
    { fullName: "Dilnoza Hasanova", phone: "+998921234569", source: "REFERRAL" as const, status: "INTERESTED" as const },
    { fullName: "Eldor Yusupov", phone: "+998931234560", source: "FACEBOOK" as const, status: "TRIAL_BOOKED" as const },
    { fullName: "Feruza Mirzayeva", phone: "+998941234561", source: "WEBSITE" as const, status: "ENROLLED" as const },
    { fullName: "Gulnora Rajabova", phone: "+998951234562", source: "TIKTOK" as const, status: "POSTPONED" as const },
    { fullName: "Hamidjon Ergashev", phone: "+998961234563", source: "INSTAGRAM" as const, status: "LOST" as const },
    { fullName: "Iroda Xolmatova", phone: "+998971234564", source: "WALK_IN" as const, status: "TRIAL_COMPLETED" as const },
    { fullName: "Jasur Abdullayev", phone: "+998981234565", source: "PHONE_CALL" as const, status: "NEW" as const },
    { fullName: "Kamola Sobirov", phone: "+998991234566", source: "REFERRAL" as const, status: "INTERESTED" as const },
  ];

  for (let i = 0; i < sampleLeads.length; i++) {
    const lead = sampleLeads[i];
    const existing = await prisma.lead.findFirst({ where: { phone: lead.phone } });
    if (!existing) {
      const createdLead = await prisma.lead.create({
        data: {
          ...lead,
          courseId: allCourses[i % allCourses.length]?.id,
          timeSlotId: allSlots[i % allSlots.length]?.id,
          assignedToId: operators[i % operators.length]?.id,
          createdById: admin.id,
          notes: `Namuna lid #${i+1}`,
          enrolledAt: lead.status === "ENROLLED" ? new Date() : null,
          stageId: stageByStatus[lead.status],
        },
      });
      await prisma.activity.create({
        data: { leadId: createdLead.id, userId: admin.id, action: "lead_created" },
      });
    }
  }
  console.log("✅ Namuna lidlar yaratildi");

  console.log("\n🎉 Seed muvaffaqiyatli yakunlandi!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔐 Super Admin login ma'lumotlari:");
  console.log("   Username: admin");
  console.log("   Parol:    Admin123!@#");
  console.log("⚠️  BIRINCHI KIRISHDA PAROLNI O'ZGARTIRING!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .catch((e) => { console.error("❌ Seed xatoligi:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
