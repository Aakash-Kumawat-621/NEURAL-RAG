import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Prevent multiple Prisma Client / pg Pool instances in development
// Next.js hot-reloads modules, which would create new connections each time

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
};

function createPrismaClient() {
  // Use a dummy PostgreSQL connection string as a fallback for build-time static evaluation
  const dbUrl = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/postgres";

  const pool = globalForPrisma.pgPool ?? new Pool({ connectionString: dbUrl });
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pgPool = pool;
  }
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
