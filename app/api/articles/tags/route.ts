import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getVerifiedPublicMediaKey } from "@/lib/s3utils";
import { slugify } from "@/lib/slugify";

async function uniqueSlug(title: string) {
  const base = slugify(title) || "tag";
  let slug = base;
  let suffix = 2;
  while (await db.articleTag.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") return NextResponse.json("Unauthorized", { status: 401 });
    const body = (await req.json()) as { title?: string; imageUrl?: string | null };
    const title = body.title?.trim();
    const imageUrl = body.imageUrl?.trim() || null;
    if (!title) return NextResponse.json("Tag title is required", { status: 400 });
    if (imageUrl) {
      try { getVerifiedPublicMediaKey(imageUrl); } catch { return NextResponse.json("Choose an image from the media library", { status: 400 }); }
    }
    const position = (await db.articleTag.aggregate({ _max: { position: true } }))._max.position ?? 0;
    const tag = await db.articleTag.create({ data: { title, slug: await uniqueSlug(title), imageUrl, position: position + 1, isPublished: true } });
    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.log("[ARTICLE_TAGS_CREATE]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
