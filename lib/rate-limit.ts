/**
 * Простой in-memory rate-limit для MVP.
 * Когда понадобится распределённый — заменим на Redis/Upstash без переписывания
 * вызовов (интерфейс остаётся).
 */

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export type RateLimitOptions = {
  /** Кол-во разрешённых попыток в окне */
  limit: number;
  /** Длина окна в миллисекундах */
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetIn: number;
};

export function rateLimit(
  key: string,
  options: RateLimitOptions,
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return {
      allowed: true,
      remaining: options.limit - 1,
      resetIn: options.windowMs,
    };
  }

  if (bucket.count >= options.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: bucket.resetAt - now,
    };
  }

  bucket.count++;
  return {
    allowed: true,
    remaining: options.limit - bucket.count,
    resetIn: bucket.resetAt - now,
  };
}

export const AUTH_RATE_LIMIT: RateLimitOptions = {
  limit: 5,
  windowMs: 5 * 60 * 1000, // 5 минут
};
