import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { slugify } from "@/lib/slugify";
import { currentUser } from "@/lib/auth";
import { getVerifiedPublicMediaKey } from "@/lib/s3utils";

export async function POST(req: Request) {
  try {
    const user = await currentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const { title, imageUrl } = (await req.json()) as {
      title: string;
      imageUrl?: string;
    };

    const normalizedTitle = title?.trim();
    if (!normalizedTitle) {
      return NextResponse.json("Recipe type title is required", { status: 400 });
    }

    const normalizedImageUrl = imageUrl?.trim() || null;
    if (normalizedImageUrl) {
      try {
        getVerifiedPublicMediaKey(normalizedImageUrl);
      } catch {
        return NextResponse.json("Invalid recipe type image URL", { status: 400 });
      }
    }

    const lastRecipeType = await db.recipeTypes.aggregate({
      _max: {
        position: true,
      },
    });

    const recipeType = await db.recipeTypes.create({
      data: {
        title: normalizedTitle,
        slug: slugify(normalizedTitle),
        imageUrl: normalizedImageUrl,
        position: (lastRecipeType._max.position ?? 0) + 1,
      },
    });
    return NextResponse.json(recipeType, { status: 200 });
  } catch (error) {
    console.log("[RECIPE_TYPES]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
