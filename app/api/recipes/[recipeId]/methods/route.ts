import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { touchRecipeContentUpdatedAt } from "@/lib/touch-recipe-content";
import { NextResponse } from "next/server";

export async function POST(req: Request, props: { params: Promise<{ recipeId: string }> }) {
  const params = await props.params;
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const values = await req.json();

    const { recipeId } = params;
    if (values) {
      const lastMethod = await db.recipeMethods.findFirst({
        where: {
          recipeId,
        },
        orderBy: {
          position: "desc",
        },
      });
      const newPosition = lastMethod ? lastMethod.position + 1 : 1;
      const method = await db.recipeMethods.create({
        data: {
          recipeId,
          position: newPosition,
          ...values,
        },
      });
      await touchRecipeContentUpdatedAt(recipeId);
      return NextResponse.json(method, { status: 200 });
    }
  } catch (error) {
    console.log("[RECIPEMETHODS]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
