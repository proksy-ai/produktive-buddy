export function canonicalAppUrl(requestLike?: Request | string): string {
  const configured = process.env.APP_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;

  if (process.env.NODE_ENV === "production") {
    throw new Error("APP_URL must be configured in production.");
  }

  if (!requestLike) return "http://127.0.0.1:3000";
  if (typeof requestLike === "string") return new URL(requestLike).origin;
  return new URL(requestLike.url).origin;
}
