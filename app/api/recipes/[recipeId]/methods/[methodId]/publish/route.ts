import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { touchRecipeContentUpdatedAt } from "@/lib/touch-recipe-content";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  props: { params: Promise<{ recipeId: string; methodId: string }> }
) {
  const params = await props.params;
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const { recipeId, methodId } = params;

    const method = await db.recipeMethods.findUnique({
      where: {
        id: methodId,
        recipeId,
      },
    });

    if (!method) {
      return NextResponse.json("Method not found", { status: 404 });
    }

    if (!method.title) {
      return NextResponse.json("Missing required fields", { status: 400 });
    }

    const publishedMethod = await db.recipeMethods.update({
      where: {
        id: methodId,
        recipeId,
      },
      data: {
        isPublished: true,
      },
    });
    await touchRecipeContentUpdatedAt(recipeId);
    return NextResponse.json(publishedMethod, { status: 200 });
  } catch (error) {
    console.log("[METHOD_ID_PUBLISH]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
