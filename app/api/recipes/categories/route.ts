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
    const { name, imageUrl } = (await req.json()) as {
      name: string;
      imageUrl?: string;
    };

    const normalizedName = name?.trim();
    if (!normalizedName) {
      return NextResponse.json("Category name is required", { status: 400 });
    }

    const slug = slugify(normalizedName);
    const lastCategory = await db.recipeCategories.aggregate({
      _max: {
        position: true,
      },
    });

    const normalizedImageUrl = imageUrl?.trim() || null;
    if (normalizedImageUrl) {
      try {
        getVerifiedPublicMediaKey(normalizedImageUrl);
      } catch {
        return NextResponse.json("Invalid category image URL", { status: 400 });
      }
    }

    const category = await db.recipeCategories.create({
      data: {
        name: normalizedName,
        slug,
        imageUrl: normalizedImageUrl,
        position: (lastCategory._max.position ?? 0) + 1,
      },
    });
    return NextResponse.json(category, { status: 200 });
  } catch (error) {
    console.log("[RECIPES_CATEGORIES]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
