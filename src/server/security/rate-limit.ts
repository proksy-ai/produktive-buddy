interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitOptions {
  key: string;
  limit: number;
  windowMs: number;
}

export class RateLimitError extends Error {
  retryAfterSec: number;

  constructor(retryAfterSec: number) {
    super("Too many requests. Try again later.");
    this.name = "RateLimitError";
    this.retryAfterSec = retryAfterSec;
  }
}

export function checkRateLimit({ key, limit, windowMs }: RateLimitOptions) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  current.count++;
  if (current.count > limit) {
    throw new RateLimitError(Math.ceil((current.resetAt - now) / 1000));
  }
}

export function requestIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
