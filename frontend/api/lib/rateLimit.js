'use strict';

// Best-effort in-memory fallback used when no KV store is configured, or if
// the KV store errors. Resets on cold start, which is fine as a soft limit only.
const memoryStore = new Map();

const MAX_USES = parseInt(process.env.RATE_LIMIT_MAX || '1', 10);
const WINDOW_SECONDS = parseInt(process.env.RATE_LIMIT_WINDOW_SECONDS || '86400', 10);

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function upstashFetch(path) {
  const res = await fetch(`${UPSTASH_URL}${path}`, {
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
  });
  if (!res.ok) throw new Error(`Upstash error: ${res.status}`);
  return res.json();
}

async function checkRateLimitUpstash(ip, bucket, max) {
  const key = `oia:${bucket}:ip:${ip}`;
  const incrResult = await upstashFetch(`/incr/${encodeURIComponent(key)}`);
  const count = incrResult.result;
  if (count === 1) {
    await upstashFetch(`/expire/${encodeURIComponent(key)}/${WINDOW_SECONDS}`);
  }
  return { allowed: count <= max, max, count };
}

function checkRateLimitMemory(ip, bucket, max) {
  const now = Date.now();
  const memKey = `${bucket}:${ip}`;
  const entry = memoryStore.get(memKey);
  if (!entry || now > entry.resetAt) {
    memoryStore.set(memKey, { count: 1, resetAt: now + WINDOW_SECONDS * 1000 });
    return { allowed: true, max, count: 1 };
  }
  entry.count += 1;
  return { allowed: entry.count <= max, max, count: entry.count };
}

/**
 * Enforces N uses per IP within a rolling window. Nothing stored here is
 * ever the user's data: only a counter keyed by IP address, auto-expiring.
 * `bucket` keeps separate counters (e.g. resume analysis vs. module runs).
 */
async function checkRateLimit(ip, { bucket = 'analyze', max = MAX_USES } = {}) {
  if (!ip || ip === 'unknown') return { allowed: true, max, count: 0 };

  if (UPSTASH_URL && UPSTASH_TOKEN) {
    try {
      return await checkRateLimitUpstash(ip, bucket, max);
    } catch (err) {
      console.error('[RateLimit] Upstash unavailable, falling back to in-memory:', err.message);
      return checkRateLimitMemory(ip, bucket, max);
    }
  }

  return checkRateLimitMemory(ip, bucket, max);
}

module.exports = { checkRateLimit };
