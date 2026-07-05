import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-better-sqlite3", "pdf-parse", "mammoth"],
};

export default nextConfig;
