import { createHmac } from "node:crypto";

const memoryCounters = new Map();

function positiveInt(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function pruneMemory(now) {
  for (const [key, entry] of memoryCounters.entries()) {
    if (entry.expiresAt <= now) memoryCounters.delete(key);
  }
}

function reserveMemory(key, limit, windowSeconds) {
  const now = Date.now();
  pruneMemory(now);
  const existing = memoryCounters.get(key);
  const next = existing && existing.expiresAt > now
    ? { count: existing.count + 1, expiresAt: existing.expiresAt }
    : { count: 1, expiresAt: now + windowSeconds * 1000 };

  if (next.count > limit) {
    return {
      allowed: false,
      count: next.count - 1,
      retryAfterSeconds: Math.max(1, Math.ceil((next.expiresAt - now) / 1000)),
    };
  }

  memoryCounters.set(key, next);
  return {
    allowed: true,
    count: next.count,
    retryAfterSeconds: Math.max(1, Math.ceil((next.expiresAt - now) / 1000)),
  };
}

function releaseMemory(key) {
  const entry = memoryCounters.get(key);
  if (!entry) return;
  if (entry.count <= 1) memoryCounters.delete(key);
  else memoryCounters.set(key, { ...entry, count: entry.count - 1 });
}

async function redisCommand(url, token, command) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  const payload = await response.json();
  if (!response.ok || payload?.error) {
    throw new Error(payload?.error ?? `Rate-limit store returned HTTP ${response.status}.`);
  }
  return payload.result;
}

async function reserveRedis({ url, token, key, limit, windowSeconds }) {
  const script = [
    "local current = redis.call('INCR', KEYS[1])",
    "if current == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end",
    "local ttl = redis.call('TTL', KEYS[1])",
    "if current > tonumber(ARGV[2]) then redis.call('DECR', KEYS[1]); return {0, current - 1, ttl} end",
    "return {1, current, ttl}",
  ].join(" ");

  const result = await redisCommand(url, token, ["EVAL", script, 1, key, windowSeconds, limit]);
  const [allowed, count, ttl] = Array.isArray(result) ? result : [0, 0, windowSeconds];
  return {
    allowed: Number(allowed) === 1,
    count: Number(count),
    retryAfterSeconds: Number(ttl) > 0 ? Number(ttl) : windowSeconds,
  };
}

async function releaseRedis({ url, token, key }) {
  const script = [
    "local current = redis.call('GET', KEYS[1])",
    "if not current then return 0 end",
    "if tonumber(current) <= 1 then redis.call('DEL', KEYS[1]); return 0 end",
    "return redis.call('DECR', KEYS[1])",
  ].join(" ");
  await redisCommand(url, token, ["EVAL", script, 1, key]);
}

export function createDemoRateLimiter(env = process.env) {
  const enabled = /^(1|true|yes)$/i.test(env.DEMO_PUBLIC_MODE ?? "false");
  const perPhoneLimit = positiveInt(env.DEMO_CALL_LIMIT_PER_PHONE, 3);
  const globalLimit = positiveInt(env.DEMO_GLOBAL_CALL_LIMIT, 50);
  const windowSeconds = positiveInt(env.DEMO_CALL_WINDOW_SECONDS, 86400);
  const redisUrl = env.UPSTASH_REDIS_REST_URL ?? env.KV_REST_API_URL ?? "";
  const redisToken = env.UPSTASH_REDIS_REST_TOKEN ?? env.KV_REST_API_TOKEN ?? "";
  const useRedis = Boolean(redisUrl && redisToken);
  const hashSecret = env.DEMO_RATE_LIMIT_SECRET ?? env.CALL_E_API_KEY ?? "tomorrow-is-calling-local-demo";

  function phoneHash(phone) {
    return createHmac("sha256", hashSecret).update(phone).digest("hex");
  }

  async function reserveKey(key, limit) {
    return useRedis
      ? reserveRedis({ url: redisUrl, token: redisToken, key, limit, windowSeconds })
      : reserveMemory(key, limit, windowSeconds);
  }

  async function releaseKey(key) {
    return useRedis
      ? releaseRedis({ url: redisUrl, token: redisToken, key })
      : releaseMemory(key);
  }

  async function reserve(phone) {
    if (!enabled) {
      return { allowed: true, enabled: false, store: useRedis ? "redis" : "memory", release: async () => {} };
    }

    const phoneKey = `tomorrow-is-calling:demo:phone:${phoneHash(phone)}`;
    const globalKey = "tomorrow-is-calling:demo:global";
    const phoneReservation = await reserveKey(phoneKey, perPhoneLimit);

    if (!phoneReservation.allowed) {
      return {
        allowed: false,
        enabled: true,
        scope: "phone",
        limit: perPhoneLimit,
        retryAfterSeconds: phoneReservation.retryAfterSeconds,
        store: useRedis ? "redis" : "memory",
      };
    }

    const globalReservation = await reserveKey(globalKey, globalLimit);
    if (!globalReservation.allowed) {
      await releaseKey(phoneKey);
      return {
        allowed: false,
        enabled: true,
        scope: "global",
        limit: globalLimit,
        retryAfterSeconds: globalReservation.retryAfterSeconds,
        store: useRedis ? "redis" : "memory",
      };
    }

    let released = false;
    return {
      allowed: true,
      enabled: true,
      store: useRedis ? "redis" : "memory",
      phoneRemaining: Math.max(0, perPhoneLimit - phoneReservation.count),
      globalRemaining: Math.max(0, globalLimit - globalReservation.count),
      retryAfterSeconds: Math.max(phoneReservation.retryAfterSeconds, globalReservation.retryAfterSeconds),
      release: async () => {
        if (released) return;
        released = true;
        await Promise.allSettled([releaseKey(phoneKey), releaseKey(globalKey)]);
      },
    };
  }

  return { enabled, perPhoneLimit, globalLimit, windowSeconds, store: useRedis ? "redis" : "memory", reserve };
}
