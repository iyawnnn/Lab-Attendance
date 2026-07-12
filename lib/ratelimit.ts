import { headers } from "next/headers";

interface RateLimitRule {
  maxRequests: number;
  windowMs: number;
  message: string;
}

const RATE_LIMIT_RULES: Record<string, RateLimitRule> = {
  attendance: {
    maxRequests: 5,
    windowMs: 2 * 60 * 1000,
    message: "Too many check-in attempts. Please wait 2 minutes before trying again.",
  },
  register: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
    message: "Too many registration attempts. Please wait 15 minutes before trying again.",
  },
  recover: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
    message: "Too many recovery attempts. Please wait 15 minutes before trying again.",
  },
  login_admin: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
    message: "Too many administrative login attempts. Access throttled for 15 minutes.",
  },
  login_teacher: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
    message: "Too many instructor login attempts. Access throttled for 15 minutes.",
  },
};

interface MemoryRecord {
  timestamps: number[];
}

const memoryStore = new Map<string, MemoryRecord>();

// Periodically clean up expired keys every 5 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of memoryStore.entries()) {
      const validTimestamps = record.timestamps.filter((ts) => now - ts < 15 * 60 * 1000);
      if (validTimestamps.length === 0) {
        memoryStore.delete(key);
      } else {
        memoryStore.set(key, { timestamps: validTimestamps });
      }
    }
  }, 5 * 60 * 1000);
}

export async function getClientIp(): Promise<string> {
  try {
    const headerList = await headers();
    const forwardedFor = headerList.get("x-forwarded-for");
    if (forwardedFor) {
      return forwardedFor.split(",")[0].trim();
    }
    const realIp = headerList.get("x-real-ip");
    if (realIp) {
      return realIp.trim();
    }
  } catch (error) {
    // Fallback if headers context is unavailable
  }
  return "127.0.0.1";
}

export async function checkRateLimit(
  type: keyof typeof RATE_LIMIT_RULES,
  identifier?: string
): Promise<{ success: boolean; message?: string }> {
  const rule = RATE_LIMIT_RULES[type];
  if (!rule) {
    return { success: true };
  }

  const clientIp = await getClientIp();
  const key = `${type}:${clientIp}:${identifier || "anonymous"}`;
  const now = Date.now();

  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  // Option A: Upstash Redis REST API when environment variables are supplied
  if (upstashUrl && upstashToken) {
    try {
      const expireSeconds = Math.ceil(rule.windowMs / 1000);
      
      const incrResponse = await fetch(`${upstashUrl}/incr/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${upstashToken}` },
        cache: "no-store",
      });
      const incrData = await incrResponse.json();
      const currentCount = incrData.result;

      if (currentCount === 1) {
        await fetch(`${upstashUrl}/expire/${encodeURIComponent(key)}/${expireSeconds}`, {
          headers: { Authorization: `Bearer ${upstashToken}` },
          cache: "no-store",
        });
      }

      if (currentCount > rule.maxRequests) {
        return { success: false, message: rule.message };
      }

      return { success: true };
    } catch (error) {
      console.warn("Upstash Redis rate-limit request failed, using in-memory fallback.");
    }
  }

  // Option B: Local In-Memory Sliding Window
  const existingRecord = memoryStore.get(key) || { timestamps: [] };
  const validTimestamps = existingRecord.timestamps.filter(
    (timestamp) => now - timestamp < rule.windowMs
  );

  if (validTimestamps.length >= rule.maxRequests) {
    return { success: false, message: rule.message };
  }

  validTimestamps.push(now);
  memoryStore.set(key, { timestamps: validTimestamps });

  return { success: true };
}