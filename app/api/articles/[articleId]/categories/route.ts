import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: Request,
  props: { params: Promise<{ articleId: string }> }
) {
  const { articleId } = await props.params;
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const body = (await req.json()) as { categoriesValues?: unknown };
    if (
      !Array.isArray(body.categoriesValues) ||
      !body.categoriesValues.every((categoryId) => typeof categoryId === "string")
    ) {
      return NextResponse.json("Invalid article categories", { status: 400 });
    }

    const categoriesValues = [...new Set(body.categoriesValues as string[])];
    const [article, categories] = await Promise.all([
      db.post.findUnique({ where: { id: articleId }, select: { id: true } }),
      db.category.findMany({
        where: { id: { in: categoriesValues } },
        select: { id: true },
      }),
    ]);

    if (!article) {
      return NextResponse.json("Article not found", { status: 404 });
    }
    if (categories.length !== categoriesValues.length) {
      return NextResponse.json("One or more categories no longer exist", { status: 400 });
    }

    await db.$transaction(async (transaction) => {
      await transaction.postCategory.deleteMany({ where: { postId: articleId } });
      if (categoriesValues.length) {
        await transaction.postCategory.createMany({
          data: categoriesValues.map((categoryId) => ({ postId: articleId, categoryId })),
        });
      }
    });

    return NextResponse.json("Article categories updated");
  } catch (error) {
    console.log("[ARTICLE_CATEGORIES]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
