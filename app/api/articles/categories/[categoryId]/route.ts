import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteFolderFromS3, getVerifiedPublicMediaKey } from "@/lib/s3utils";
import { slugify } from "@/lib/slugify";

async function updateUniqueSlug(categoryId: string, title: string) {
  const baseSlug = slugify(title) || "category";
  let slug = baseSlug;
  let suffix = 2;

  while (
    await db.category.findFirst({
      where: { slug, NOT: { id: categoryId } },
      select: { id: true },
    })
  ) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ categoryId: string }> }
) {
  const { categoryId } = await props.params;
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const category = await db.category.findUnique({
      where: { id: categoryId },
      include: { _count: { select: { PostCategory: true } } },
    });
    if (!category) {
      return NextResponse.json("Category not found", { status: 404 });
    }
    if (category._count.PostCategory) {
      return NextResponse.json(
        "This category is linked to articles. Remove those links before deleting.",
        { status: 409 }
      );
    }

    const deletedCategory = await db.category.delete({ where: { id: categoryId } });
    try {
      await deleteFolderFromS3(`articles/categories/${categoryId}`);
    } catch (storageError) {
      console.log("[ARTICLE_CATEGORY_MEDIA_CLEANUP]", storageError);
    }

    return NextResponse.json(deletedCategory);
  } catch (error) {
    console.log("[CATEGORY_ID_DELETE]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  props: { params: Promise<{ categoryId: string }> }
) {
  const { categoryId } = await props.params;
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const current = await db.category.findUnique({ where: { id: categoryId } });
    if (!current) {
      return NextResponse.json("Category not found", { status: 404 });
    }

    const body = (await req.json()) as { title?: string; imageUrl?: string | null; isPublished?: boolean };
    const data: { title?: string; slug?: string; imageUrl?: string | null; isPublished?: boolean } = {};

    if (body.title !== undefined) {
      const title = body.title.trim();
      if (!title) {
        return NextResponse.json("Category title is required", { status: 400 });
      }
      data.title = title;
      data.slug = await updateUniqueSlug(categoryId, title);
    }

    if (body.imageUrl !== undefined) {
      const imageUrl = body.imageUrl?.trim() || null;
      if (imageUrl && imageUrl !== current.imageUrl) {
        try {
          getVerifiedPublicMediaKey(imageUrl);
        } catch {
          return NextResponse.json("Choose an image from the media library", { status: 400 });
        }
      }
      data.imageUrl = imageUrl;
    }

    if (typeof body.isPublished === "boolean") {
      data.isPublished = body.isPublished;
    }

    const category = await db.category.update({ where: { id: categoryId }, data });
    return NextResponse.json(category);
  } catch (error) {
    console.log("[CATEGORYID]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
