import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteFolderFromS3, getVerifiedPublicMediaKey } from "@/lib/s3utils";
import { slugify } from "@/lib/slugify";

async function uniqueSlug(id: string, title: string) {
  const base = slugify(title) || "tag";
  let slug = base;
  let suffix = 2;
  while (await db.articleTag.findFirst({ where: { slug, NOT: { id } }, select: { id: true } })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ tagId: string }> }) {
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") return NextResponse.json("Unauthorized", { status: 401 });
    const { tagId } = await params;
    const current = await db.articleTag.findUnique({ where: { id: tagId } });
    if (!current) return NextResponse.json("Tag not found", { status: 404 });
    const body = (await req.json()) as { title?: string; imageUrl?: string | null; isPublished?: boolean };
    const data: { title?: string; slug?: string; imageUrl?: string | null; isPublished?: boolean } = {};
    if (body.title !== undefined) {
      const title = body.title.trim();
      if (!title) return NextResponse.json("Tag title is required", { status: 400 });
      data.title = title; data.slug = await uniqueSlug(tagId, title);
    }
    if (body.imageUrl !== undefined) {
      const imageUrl = body.imageUrl?.trim() || null;
      if (imageUrl && imageUrl !== current.imageUrl) {
        try { getVerifiedPublicMediaKey(imageUrl); } catch { return NextResponse.json("Choose an image from the media library", { status: 400 }); }
      }
      data.imageUrl = imageUrl;
    }
    if (typeof body.isPublished === "boolean") data.isPublished = body.isPublished;
    return NextResponse.json(await db.articleTag.update({ where: { id: tagId }, data }));
  } catch (error) {
    console.log("[ARTICLE_TAG_PATCH]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ tagId: string }> }) {
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") return NextResponse.json("Unauthorized", { status: 401 });
    const { tagId } = await params;
    const tag = await db.articleTag.findUnique({ where: { id: tagId }, include: { _count: { select: { PostTag: true } } } });
    if (!tag) return NextResponse.json("Tag not found", { status: 404 });
    if (tag._count.PostTag) return NextResponse.json("This tag is linked to articles. Remove those links before deleting.", { status: 409 });
    const deleted = await db.articleTag.delete({ where: { id: tagId } });
    try { await deleteFolderFromS3(`articles/tags/${tagId}`); } catch (error) { console.log("[ARTICLE_TAG_MEDIA_CLEANUP]", error); }
    return NextResponse.json(deleted);
  } catch (error) {
    console.log("[ARTICLE_TAG_DELETE]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
