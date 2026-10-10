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
      return NextResponse.json("Cooking method title is required", { status: 400 });
    }

    const slug = slugify(normalizedTitle);
    const lastCookingMethod = await db.cookingMethods.aggregate({
      _max: {
        position: true,
      },
    });

    const normalizedImageUrl = imageUrl?.trim() || null;
    if (normalizedImageUrl) {
      try {
        getVerifiedPublicMediaKey(normalizedImageUrl);
      } catch {
        return NextResponse.json("Invalid cooking method image URL", { status: 400 });
      }
    }

    const cookingMethod = await db.cookingMethods.create({
      data: {
        title: normalizedTitle,
        slug,
        imageUrl: normalizedImageUrl,
        position: (lastCookingMethod._max.position ?? 0) + 1,
      },
    });
    return NextResponse.json(cookingMethod, { status: 200 });
  } catch (error) {
    console.log("[COOKING_METHOD]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
