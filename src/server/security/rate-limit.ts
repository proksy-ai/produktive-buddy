import { isIP } from "node:net";

import { createClient, type RedisClientType } from "redis";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_LOCAL_BUCKETS = 10_000;
const REDIS_PREFIX = "pb:ratelimit:";

let redisClient: RedisClientType | null = null;
let redisInitPromise: Promise<RedisClientType | null> | null = null;
let redisUnavailableLogged = false;

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

function cleanLocalBuckets(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  if (buckets.size <= MAX_LOCAL_BUCKETS) return;
  const sorted = [...buckets.entries()].sort((a, b) => a[1].resetAt - b[1].resetAt);
  const toDelete = sorted.slice(0, buckets.size - MAX_LOCAL_BUCKETS);
  for (const [key] of toDelete) buckets.delete(key);
}

function normalizeIp(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  // Strip RFC 3986 port suffix in common "ip:port" proxy forms.
  const withoutPort = trimmed.replace(/:\d+$/, "");
  if (isIP(withoutPort)) return withoutPort;
  return null;
}

async function initRedisClient(): Promise<RedisClientType | null> {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return null;
  if (redisClient?.isReady) return redisClient;
  if (redisInitPromise) return redisInitPromise;

  redisInitPromise = (async () => {
    try {
      const client = createClient({ url: redisUrl });
      client.on("error", (err) => {
        if (!redisUnavailableLogged) {
          redisUnavailableLogged = true;
          console.error("[rate-limit] redis client error", err);
        }
      });
      await client.connect();
      redisClient = client;
      return client;
    } catch (err) {
      if (!redisUnavailableLogged) {
        redisUnavailableLogged = true;
        console.error("[rate-limit] redis unavailable, falling back to memory", err);
      }
      return null;
    } finally {
      redisInitPromise = null;
    }
  })();

  return redisInitPromise;
}

async function checkRedisRateLimit({
  key,
  limit,
  windowMs,
}: RateLimitOptions): Promise<boolean> {
  const client = await initRedisClient();
  if (!client) return false;

  const redisKey = `${REDIS_PREFIX}${key}`;
  const result = (await client
    .multi()
    .incr(redisKey)
    .pTTL(redisKey)
    .exec()) as unknown as [number, number] | null;

  const count = Number(result?.[0] ?? 0);
  let ttlMs = Number(result?.[1] ?? -1);
  if (count <= 1 || ttlMs < 0) {
    await client.pExpire(redisKey, windowMs);
    ttlMs = windowMs;
  }

  if (count > limit) {
    throw new RateLimitError(Math.max(1, Math.ceil(ttlMs / 1000)));
  }
  return true;
}

function checkLocalRateLimit({ key, limit, windowMs }: RateLimitOptions) {
  const now = Date.now();
  cleanLocalBuckets(now);

  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  current.count += 1;
  if (current.count > limit) {
    throw new RateLimitError(Math.ceil((current.resetAt - now) / 1000));
  }
}

export async function checkRateLimit(opts: RateLimitOptions): Promise<void> {
  const usedRedis = await checkRedisRateLimit(opts);
  if (!usedRedis) checkLocalRateLimit(opts);
}

export function requestIp(request: Request): string {
  // Cloud Run and similar proxies set x-forwarded-for as client-first.
  const trustedProxyHeaders =
    process.env.TRUST_PROXY_HEADERS !== "false" || process.env.NODE_ENV === "production";
  const forwardedChain = request.headers.get("x-forwarded-for");

  if (trustedProxyHeaders && forwardedChain) {
    const first = normalizeIp(forwardedChain.split(",")[0] ?? null);
    if (first) return first;
  }

  const realIp = normalizeIp(request.headers.get("x-real-ip"));
  if (realIp) return realIp;

  return "unknown";
}
