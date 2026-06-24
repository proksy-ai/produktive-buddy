import "dotenv/config";

import { defineConfig } from "@prisma/config";

const migrationUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!migrationUrl) {
  throw new Error(
    "Set DIRECT_URL or DATABASE_URL in .env before running Prisma commands.",
  );
}

/**
 * Prisma 7 moved datasource connection URLs out of schema.prisma.
 * Migration / introspection commands read the URL from here; the runtime
 * client connects via a driver adapter (see src/lib/db.ts).
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: migrationUrl,
  },
});
