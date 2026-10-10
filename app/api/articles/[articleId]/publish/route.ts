import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, props: { params: Promise<{ articleId: string }> }) {
  const params = await props.params;
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const { articleId } = params;

    const post = await db.post.findUnique({
      where: {
        id: articleId,
      },
    });

    if (!post) {
      return NextResponse.json("Article not found", { status: 404 });
    }

    if (!post.title || !post.content || !post.imageUrl) {
      return NextResponse.json("Missing required fields", { status: 400 });
    }

    const publishedArticle = await db.post.update({
      where: {
        id: articleId,
      },
      data: {
        isPublished: true,
      },
    });
    revalidatePath("/sitemap.xml");
    return NextResponse.json(publishedArticle, { status: 200 });
  } catch (error) {
    console.log("[ARTICLE_ID_PUBLISH]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
