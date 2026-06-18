import { defineConfig } from "@prisma/config";

/**
 * Prisma 7 moved datasource connection URLs out of schema.prisma.
 * Migration / introspection commands read the URL from here; the runtime
 * client connects via a driver adapter (see src/lib/db.ts).
 *
 * Prefer DIRECT_URL (non-pooled) for migrations, falling back to DATABASE_URL.
 */
const migrationUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  ...(migrationUrl ? { datasource: { url: migrationUrl } } : {}),
});
