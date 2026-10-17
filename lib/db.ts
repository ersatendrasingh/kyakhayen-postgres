import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return undefined;

  try {
    const url = new URL(databaseUrl);

    // Vercel can start several serverless instances together. Keep every
    // instance to one connection and use Prisma's transaction-pooler mode
    // when DATABASE_URL points at Neon's pooled endpoint.
    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", "1");
    }
    if (url.hostname.includes("-pooler.")) {
      url.searchParams.set("pgbouncer", "true");
    }

    return url.toString();
  } catch {
    // Let Prisma surface the original configuration error with its usual
    // diagnostic instead of masking it during module initialization.
    return databaseUrl;
  }
}

const databaseUrl = getDatabaseUrl();

export const db =
  globalThis.prisma ||
  new PrismaClient(
    databaseUrl ? { datasources: { db: { url: databaseUrl } } } : undefined,
  );

if (process.env.NODE_ENV !== "production") globalThis.prisma = db;
