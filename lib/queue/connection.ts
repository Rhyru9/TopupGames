import IORedis from "ioredis";

const globalForRedis = globalThis as unknown as {
  r9hostRedis?: IORedis;
  r9hostLookupRedis?: IORedis;
};

export function getRedisConnection(): IORedis {
  if (globalForRedis.r9hostRedis) return globalForRedis.r9hostRedis;

  const url = process.env.REDIS_URL?.trim() || "redis://127.0.0.1:6379";
  if (process.env.NODE_ENV === "production" && !new URL(url).password) {
    throw new Error("Production REDIS_URL must include authentication");
  }
  const connection = new IORedis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    connectTimeout: 10_000,
    keepAlive: 10_000,
  });

  globalForRedis.r9hostRedis = connection;

  return connection;
}

export function getRateLimitRedisConnection(): IORedis {
  if (globalForRedis.r9hostLookupRedis) return globalForRedis.r9hostLookupRedis;
  const url = process.env.REDIS_URL?.trim() || "redis://127.0.0.1:6379";
  if (process.env.NODE_ENV === "production" && !new URL(url).password) {
    throw new Error("Production REDIS_URL must include authentication");
  }
  // Queue workers issue blocking Redis commands; only the HTTP limiter has a short timeout.
  const connection = new IORedis(url, { maxRetriesPerRequest: 1, commandTimeout: 3000, connectTimeout: 3000 });
  connection.on("error", () => { /* limiter fails closed below */ });
  globalForRedis.r9hostLookupRedis = connection;
  return connection;
}
