import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getVerifiedPublicMediaKey } from "@/lib/s3utils";
import { slugify } from "@/lib/slugify";

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
      return NextResponse.json("Body type title is required", { status: 400 });
    }

    const normalizedImageUrl = imageUrl?.trim() || null;
    if (normalizedImageUrl) {
      try {
        getVerifiedPublicMediaKey(normalizedImageUrl);
      } catch {
        return NextResponse.json("Invalid body type image URL", { status: 400 });
      }
    }

    const lastBodyType = await db.bodyTypes.aggregate({
      _max: { position: true },
    });
    const bodyType = await db.bodyTypes.create({
      data: {
        title: normalizedTitle,
        slug: slugify(normalizedTitle),
        imageUrl: normalizedImageUrl,
        position: (lastBodyType._max.position ?? 0) + 1,
      },
    });

    return NextResponse.json(bodyType, { status: 200 });
  } catch (error) {
    console.log("[BODY_TYPES]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
