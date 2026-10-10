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
      return NextResponse.json("Diet type title is required", { status: 400 });
    }

    const normalizedImageUrl = imageUrl?.trim() || null;
    if (normalizedImageUrl) {
      try {
        getVerifiedPublicMediaKey(normalizedImageUrl);
      } catch {
        return NextResponse.json("Invalid diet type image URL", { status: 400 });
      }
    }

    const lastDietType = await db.dietTypes.aggregate({
      _max: {
        position: true,
      },
    });

    const dietType = await db.dietTypes.create({
      data: {
        title: normalizedTitle,
        slug: slugify(normalizedTitle),
        imageUrl: normalizedImageUrl,
        position: (lastDietType._max.position ?? 0) + 1,
      },
    });
    return NextResponse.json(dietType, { status: 200 });
  } catch (error) {
    console.log("[DIET_TYPES]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
