// Creates (or removes with --down) the temporary SUPER_ADMIN account that
// test-api.sh logs in as. Not part of the app — a test fixture only.
import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "./src/lib/db.js";

const USERNAME = "__api_test_admin__";

if (process.argv.includes("--down")) {
  await db.user.deleteMany({ where: { username: USERNAME } });
  console.log("test admin removed");
} else {
  const passwordHash = await bcrypt.hash("TestPass123", 10);
  const u = await db.user.upsert({
    where: { username: USERNAME },
    update: { passwordHash, isActive: true, role: "SUPER_ADMIN" },
    create: {
      fullName: "API Test Admin",
      username: USERNAME,
      passwordHash,
      role: "SUPER_ADMIN",
      canManageLeads: true,
      canManageCourses: true,
      canManageUsers: true,
      canViewReports: true,
      canExportData: true,
    },
  });
  console.log("test admin ready:", u.id);
}

await db.$disconnect();
