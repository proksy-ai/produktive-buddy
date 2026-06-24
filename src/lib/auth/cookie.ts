// Dependency-free so the edge middleware can import it without pulling in Prisma.
export const SESSION_COOKIE = "pb_session";
export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 days
