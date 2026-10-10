import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { touchRecipeContentUpdatedAt } from "@/lib/touch-recipe-content";

export async function POST(
  req: Request,
  props: { params: Promise<{ recipeId: string }> }
) {
  const params = await props.params;
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const { bodyTypeValues } = (await req.json()) as { bodyTypeValues?: string[] };
    const selectedIds = Array.isArray(bodyTypeValues)
      ? bodyTypeValues.filter((value): value is string => typeof value === "string")
      : [];

    await db.$transaction([
      db.recipeBodyType.deleteMany({
        where: {
          recipeId: params.recipeId,
          bodyTypeId: { notIn: selectedIds },
        },
      }),
      ...selectedIds.map((bodyTypeId) =>
        db.recipeBodyType.upsert({
          where: {
            recipeId_bodyTypeId: {
              recipeId: params.recipeId,
              bodyTypeId,
            },
          },
          update: {},
          create: {
            recipeId: params.recipeId,
            bodyTypeId,
          },
        })
      ),
    ]);

    await touchRecipeContentUpdatedAt(params.recipeId);
    return NextResponse.json("Recipe body types updated", { status: 200 });
  } catch (error) {
    console.log("[RECIPE_BODY_TYPES]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
