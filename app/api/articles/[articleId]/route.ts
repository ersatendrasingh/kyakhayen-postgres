import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizePathSegment } from "@/lib/seo";
import { deleteFolderFromS3, getVerifiedPublicMediaKey } from "@/lib/s3utils";
import { slugify } from "@/lib/slugify";

type UpdateArticleBody = {
  title?: string;
  content?: string | null;
  imageUrl?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaSlug?: string | null;
};

async function updateUniqueSlug(articleId: string, title: string) {
  const baseSlug = slugify(title) || "article";
  let slug = baseSlug;
  let suffix = 2;

  while (
    await db.post.findFirst({
      where: { slug, NOT: { id: articleId } },
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
  props: { params: Promise<{ articleId: string }> }
) {
  const { articleId } = await props.params;
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const post = await db.post.findUnique({
      where: { id: articleId },
      select: { id: true, isPublished: true },
    });
    if (!post) {
      return NextResponse.json("Article not found", { status: 404 });
    }

    const deletedArticle = await db.post.delete({ where: { id: articleId } });
    if (post.isPublished) {
      revalidatePath("/sitemap.xml");
    }
    try {
      await deleteFolderFromS3(`articles/${articleId}`);
    } catch (storageError) {
      console.log("[ARTICLE_MEDIA_CLEANUP]", storageError);
    }

    return NextResponse.json(deletedArticle);
  } catch (error) {
    console.log("[ARTICLE_ID_DELETE]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  props: { params: Promise<{ articleId: string }> }
) {
  const { articleId } = await props.params;
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const current = await db.post.findUnique({ where: { id: articleId } });
    if (!current) {
      return NextResponse.json("Article not found", { status: 404 });
    }

    const body = (await req.json()) as UpdateArticleBody;
    const data: UpdateArticleBody & { slug?: string } = {};

    if (body.title !== undefined) {
      const title = body.title.trim();
      if (!title) {
        return NextResponse.json("Article title is required", { status: 400 });
      }
      data.title = title;
      data.slug = await updateUniqueSlug(articleId, title);
    }

    if (body.content !== undefined) data.content = body.content;
    if (body.metaTitle !== undefined) data.metaTitle = body.metaTitle;
    if (body.metaDescription !== undefined) data.metaDescription = body.metaDescription;
    if (body.metaSlug !== undefined) {
      data.metaSlug =
        typeof body.metaSlug === "string"
          ? normalizePathSegment(body.metaSlug) || null
          : null;
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

    const post = await db.post.update({ where: { id: articleId }, data });
    if (post.isPublished) {
      revalidatePath("/sitemap.xml");
    }
    return NextResponse.json(post);
  } catch (error) {
    console.log("[ARTICLE_ID]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
