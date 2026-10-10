import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getVerifiedPublicMediaKey } from "@/lib/s3utils";
import { slugify } from "@/lib/slugify";

async function createUniqueSlug(title: string) {
  const baseSlug = slugify(title) || "category";
  let slug = baseSlug;
  let suffix = 2;

  while (await db.category.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const body = (await req.json()) as { title?: string; imageUrl?: string | null };
    const title = body.title?.trim();
    const imageUrl = body.imageUrl?.trim() || null;

    if (!title) {
      return NextResponse.json("Category title is required", { status: 400 });
    }

    if (imageUrl) {
      try {
        getVerifiedPublicMediaKey(imageUrl);
      } catch {
        return NextResponse.json("Choose an image from the media library", { status: 400 });
      }
    }

    const lastPosition = await db.category.aggregate({ _max: { position: true } });
    const category = await db.category.create({
      data: {
        title,
        slug: await createUniqueSlug(title),
        imageUrl,
        position: (lastPosition._max.position ?? 0) + 1,
        isPublished: true,
      },
    });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.log("[ARTICLES_CATEGORIES]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
