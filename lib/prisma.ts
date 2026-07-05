import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// Prevent multiple Prisma Client instances in development
// Next.js hot-reloads modules, which would create a new PrismaClient each time

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL ?? "";
  if (dbUrl.startsWith("postgresql://") || dbUrl.startsWith("postgres://")) {
    return new PrismaClient();
  }
  
  // Fallback to SQLite adapter for local dev if URL is not a postgres string
  const adapter = new PrismaBetterSqlite3({
    url: dbUrl || "file:./prisma/dev.db",
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
