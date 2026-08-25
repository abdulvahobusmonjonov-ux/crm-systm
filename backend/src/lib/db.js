import { PrismaClient } from "../generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 requires a driver adapter (no `url` in the schema's datasource block),
// same as the Next.js app's src/lib/db.ts — just without the dev-hot-reload
// singleton cache, which only matters for Next.js's module-reloading dev server.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const db = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
});
