import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request, { params }: { params: Promise<{ articleId: string }> }) {
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") return NextResponse.json("Unauthorized", { status: 401 });
    const { articleId } = await params;
    const body = (await req.json()) as { tagIds?: string[] };
    if (!Array.isArray(body.tagIds)) return NextResponse.json("Tags are required", { status: 400 });
    const tagIds = [...new Set(body.tagIds)];
    const count = await db.articleTag.count({ where: { id: { in: tagIds } } });
    if (count !== tagIds.length) return NextResponse.json("One or more tags are invalid", { status: 400 });
    await db.$transaction([
      db.postTag.deleteMany({ where: { postId: articleId } }),
      db.postTag.createMany({ data: tagIds.map((tagId) => ({ postId: articleId, tagId })) }),
    ]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.log("[ARTICLE_TAG_ASSIGNMENT]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
