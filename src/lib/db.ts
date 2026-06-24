import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient() {
  // Prisma 7 connects through a driver adapter rather than a datasource URL
  // in schema.prisma. The pg adapter manages its own connection pool.
  //
  // Cap pool size so many Cloud Run instances don't exhaust a small Cloud SQL
  // tier. Budget = (DB_POOL_MAX * max Cloud Run instances) < instance max_connections.
  // e.g. db-f1-micro (~25-50 conns): pool 5 x 4 instances = 20. Tune via env.
  const poolMax = Number(process.env.DB_POOL_MAX ?? 5);

  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    max: Number.isFinite(poolMax) && poolMax > 0 ? poolMax : 5,
    // Fail fast instead of hanging if the DB is briefly unreachable.
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
  });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
