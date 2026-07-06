import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

let prisma: PrismaClient;

const getUrl = () => {
  // Always resolve SQLite connection to the absolute path of prisma/dev.db
  // to avoid discrepancies between Prisma CLI (resolves relative to prisma/)
  // and Next.js runtime (resolves relative to process.cwd()).
  const dbPath = path.join(process.cwd(), "prisma", "dev.db");
  return `file:${dbPath}`;
};

if (process.env.NODE_ENV === "production") {
  const adapter = new PrismaBetterSqlite3({ url: getUrl() });
  prisma = new PrismaClient({ adapter });
} else {
  if (!globalForPrisma.prisma) {
    const adapter = new PrismaBetterSqlite3({ url: getUrl() });
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
  prisma = globalForPrisma.prisma;
}

export default prisma;
export { prisma };
