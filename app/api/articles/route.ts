import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { slugify } from "@/lib/slugify";

async function createUniqueSlug(title: string) {
  const baseSlug = slugify(title) || "article";
  let slug = baseSlug;
  let suffix = 2;

  while (await db.post.findUnique({ where: { slug }, select: { id: true } })) {
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

    const body = (await req.json()) as { title?: string; categoryId?: string | null };
    const title = body.title?.trim();

    if (!title) {
      return NextResponse.json("Article title is required", { status: 400 });
    }

    if (body.categoryId) {
      const category = await db.category.findUnique({
        where: { id: body.categoryId },
        select: { id: true },
      });
      if (!category) {
        return NextResponse.json("Selected category does not exist", { status: 400 });
      }
    }

    const post = await db.post.create({
      data: {
        title,
        slug: await createUniqueSlug(title),
        authorId: user.id,
        ...(body.categoryId
          ? { PostCategory: { create: { categoryId: body.categoryId } } }
          : {}),
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.log("[ARTICLE]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
