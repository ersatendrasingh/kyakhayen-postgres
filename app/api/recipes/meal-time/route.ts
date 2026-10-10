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
      return NextResponse.json("Meal time title is required", { status: 400 });
    }

    const normalizedImageUrl = imageUrl?.trim() || null;
    if (normalizedImageUrl) {
      try {
        getVerifiedPublicMediaKey(normalizedImageUrl);
      } catch {
        return NextResponse.json("Invalid meal time image URL", { status: 400 });
      }
    }

    const lastMealTime = await db.mealTimes.aggregate({
      _max: {
        position: true,
      },
    });

    const mealTime = await db.mealTimes.create({
      data: {
        title: normalizedTitle,
        slug: slugify(normalizedTitle),
        imageUrl: normalizedImageUrl,
        position: (lastMealTime._max.position ?? 0) + 1,
      },
    });
    return NextResponse.json(mealTime, { status: 200 });
  } catch (error) {
    console.log("[MEALTIMES]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
