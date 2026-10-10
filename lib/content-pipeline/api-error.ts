import { NextResponse } from "next/server";

const TEMPORARILY_UNAVAILABLE_PRISMA_CODES = new Set([
  "P1001",
  "P1002",
  "P1017",
]);

const MISSING_SCHEMA_PRISMA_CODES = new Set(["P2021", "P2022"]);

function prismaCode(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) return "";
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : "";
}

export async function parseRequestJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function contentPipelineApiError(error: unknown, fallback: string) {
  const code = prismaCode(error);
  let message = error instanceof Error && error.message ? error.message : fallback;
  if (TEMPORARILY_UNAVAILABLE_PRISMA_CODES.has(code)) {
    message =
      "Content pipeline scheduling could not connect to the configured database. Check DATABASE_URL and the running app database.";
  }
  if (MISSING_SCHEMA_PRISMA_CODES.has(code)) {
    message =
      "Content pipeline scheduling tables are missing. The app will try to create them automatically; refresh and try again.";
  }

  return NextResponse.json(message, { status: 500 });
}
