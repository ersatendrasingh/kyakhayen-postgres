import { RecipeReactionType } from "@prisma/client";
import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

const reactionTypes = [
  "YUMMY",
  "LOVE",
  "WOW",
  "MADE_IT",
  "COMFORT",
] as const;

type ReactionType = (typeof reactionTypes)[number];

const isReactionType = (value: unknown): value is ReactionType =>
  typeof value === "string" &&
  reactionTypes.includes(value as ReactionType);

const getPayload = async (recipeId: string, userId?: string) => {
  const [grouped, selected] = await Promise.all([
    db.recipeReaction.groupBy({
      by: ["type"],
      where: { recipeId },
      _count: { _all: true },
    }),
    userId
      ? db.recipeReaction.findUnique({
          where: { userId_recipeId: { userId, recipeId } },
          select: { type: true },
        })
      : null,
  ]);

  const counts = Object.fromEntries(
    reactionTypes.map((type) => [type, 0]),
  ) as Record<ReactionType, number>;

  grouped.forEach((reaction) => {
    counts[reaction.type as ReactionType] = reaction._count._all;
  });

  return {
    counts,
    selectedReaction: (selected?.type as ReactionType | undefined) ?? null,
  };
};

export async function GET(
  _request: Request,
  props: { params: Promise<{ recipeId: string }> },
) {
  try {
    const { recipeId } = await props.params;
    const user = await currentUser();

    return NextResponse.json(await getPayload(recipeId, user?.id));
  } catch (error) {
    console.error("[GET_RECIPE_REACTIONS]", error);
    return NextResponse.json(
      { error: "Unable to load reactions." },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  props: { params: Promise<{ recipeId: string }> },
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { recipeId } = await props.params;
    const { type } = (await request.json()) as { type?: unknown };
    if (!isReactionType(type)) {
      return NextResponse.json({ error: "Invalid reaction." }, { status: 400 });
    }

    const recipeExists = await db.recipes.findUnique({
      where: { id: recipeId },
      select: { id: true },
    });
    if (!recipeExists) {
      return NextResponse.json({ error: "Recipe not found." }, { status: 404 });
    }

    const existing = await db.recipeReaction.findUnique({
      where: { userId_recipeId: { userId: user.id, recipeId } },
    });

    if (existing?.type === type) {
      await db.recipeReaction.delete({ where: { id: existing.id } });
    } else {
      await db.recipeReaction.upsert({
        where: { userId_recipeId: { userId: user.id, recipeId } },
        update: { type: type as RecipeReactionType },
        create: {
          recipeId,
          userId: user.id,
          type: type as RecipeReactionType,
        },
      });
    }

    return NextResponse.json(await getPayload(recipeId, user.id));
  } catch (error) {
    console.error("[POST_RECIPE_REACTION]", error);
    return NextResponse.json(
      { error: "Unable to update your reaction." },
      { status: 500 },
    );
  }
}
