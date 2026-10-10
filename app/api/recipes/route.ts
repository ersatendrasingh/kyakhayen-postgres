import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { normalizeRecipeTitle } from "@/lib/recipe-seo";
import { slugify } from "@/lib/slugify";
import { currentUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await currentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const values = (await req.json()) as {
      title?: string;
      recipeCategoriesId?: string | null;
    };
    const title = values.title ? normalizeRecipeTitle(values.title) : "";

    if (!title) {
      return NextResponse.json("Recipe title is required", { status: 400 });
    }

    const slug = slugify(title) || "recipe";
    if (await db.recipes.findUnique({ where: { slug }, select: { id: true } })) {
      return NextResponse.json(
        "A recipe with this title already exists. Use a descriptive variation such as cuisine or style.",
        { status: 409 }
      );
    }

    const recipe = await db.recipes.create({
      data: {
        title,
        slug,
        recipeCategoriesId: values.recipeCategoriesId || null,
      },
    });
    return NextResponse.json(recipe, { status: 201 });
  } catch (error) {
    console.log("[RECIPES]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
