import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import type { PublicQRData } from "@/lib/types";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// 10 QR-code creations per minute per user - protects the DB and
// QStash budget from abuse/bots.
export const createQrRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  prefix: "ratelimit:create-qr",
});

// 60 scan-landing hits per minute per IP - generous, just anti-abuse.
export const scanRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 m"),
  prefix: "ratelimit:scan",
});

const QR_CACHE_TTL_SECONDS = 60 * 60 * 24; // 24h
const cacheKey = (code: string) => `qr:${code}`;
const counterKey = (id: string) => `qr:${id}:scans`;

export async function getCachedQr(code: string): Promise<PublicQRData | null> {
  return (await redis.get<PublicQRData>(cacheKey(code))) ?? null;
}

export async function setCachedQr(code: string, data: PublicQRData) {
  await redis.set(cacheKey(code), data, { ex: QR_CACHE_TTL_SECONDS });
}

export async function invalidateCachedQr(code: string) {
  await redis.del(cacheKey(code));
}

// Fast, eventually-consistent scan counter. The source of truth for
// detailed analytics is the qr_scans table, written asynchronously by
// the QStash callback; this counter just lets the dashboard render a
// near-real-time number without waiting on that write.
export async function incrementScanCounter(qrCodeId: string) {
  await redis.incr(counterKey(qrCodeId));
}

export async function getScanCounter(qrCodeId: string): Promise<number> {
  return (await redis.get<number>(counterKey(qrCodeId))) ?? 0;
}
