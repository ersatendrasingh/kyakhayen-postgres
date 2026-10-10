import type { RedisOptions } from "bullmq";

export function getRedisConnection(): RedisOptions {
  if (process.env.REDIS_URL) {
    return { url: process.env.REDIS_URL };
  }

  return {
    host: process.env.REDIS_SERVER_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_SERVER_PORT || "6379"),
    ...(process.env.REDIS_SERVER_PASSWORD
      ? { password: process.env.REDIS_SERVER_PASSWORD }
      : {}),
    ...(process.env.REDIS_SERVER_TLS === "true" ? { tls: {} } : {}),
  };
}
