import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

async function test() {
  const dbUrl = process.env.DATABASE_URL;
  console.log("DB URL:", dbUrl);
  
  const pool = new Pool({ connectionString: dbUrl });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  
  try {
    console.log("Connecting...");
    const res = await prisma.$queryRaw`SELECT NOW()`;
    console.log("SUCCESS!", res);
  } catch (e: any) {
    console.error("CONN ERR:", e.message);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

test();
