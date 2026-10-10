import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

type RecordRecipeViewInput = {
  recipeId: string;
  userId?: string;
  ipAddress?: string;
};

export type RecordRecipeViewResult =
  | "counted"
  | "duplicate"
  | "missing-viewer"
  | "missing-recipe";

function isPrismaError(error: unknown, code: string) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === code
  );
}

export function getClientIp(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const forwardedIp = forwardedFor?.split(",")[0]?.trim();

  return (
    req.headers.get("cf-connecting-ip")?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    forwardedIp ||
    undefined
  );
}

export function hasSessionCookie(req: Request) {
  const cookie = req.headers.get("cookie") || "";

  return (
    cookie.includes("authjs.session-token") ||
    cookie.includes("__Secure-authjs.session-token") ||
    cookie.includes("next-auth.session-token") ||
    cookie.includes("__Secure-next-auth.session-token")
  );
}

async function recordUserRecipeView(recipeId: string, userId: string) {
  try {
    await db.$transaction([
      db.userRecipeViews.create({ data: { userId, recipeId } }),
      db.recipes.update({
        where: { id: recipeId },
        data: { views: { increment: 1 } },
      }),
    ]);

    return "counted" satisfies RecordRecipeViewResult;
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      await db.userRecipeViews.update({
        where: { userId_recipeId: { userId, recipeId } },
        data: { updatedAt: new Date() },
      });

      return "duplicate" satisfies RecordRecipeViewResult;
    }

    if (isPrismaError(error, "P2003") || isPrismaError(error, "P2025")) {
      return "missing-recipe" satisfies RecordRecipeViewResult;
    }

    throw error;
  }
}

async function recordAnonymousRecipeView(recipeId: string, ipAddress: string) {
  try {
    await db.$transaction([
      db.recipeViews.create({ data: { recipeId, ipAddress } }),
      db.recipes.update({
        where: { id: recipeId },
        data: { views: { increment: 1 } },
      }),
    ]);

    return "counted" satisfies RecordRecipeViewResult;
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      return "duplicate" satisfies RecordRecipeViewResult;
    }

    if (isPrismaError(error, "P2003") || isPrismaError(error, "P2025")) {
      return "missing-recipe" satisfies RecordRecipeViewResult;
    }

    throw error;
  }
}

export async function recordRecipeView({
  recipeId,
  userId,
  ipAddress,
}: RecordRecipeViewInput) {
  if (userId) {
    return recordUserRecipeView(recipeId, userId);
  }

  if (!ipAddress) {
    return "missing-viewer" satisfies RecordRecipeViewResult;
  }

  return recordAnonymousRecipeView(recipeId, ipAddress);
}
