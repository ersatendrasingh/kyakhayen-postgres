import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(req: Request) {
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const body = (await req.json()) as { list?: Array<{ id?: string; position?: number }> };
    if (!Array.isArray(body.list) || body.list.some((entry) => !entry.id || !Number.isInteger(entry.position))) {
      return NextResponse.json("Valid category positions are required", { status: 400 });
    }
    await db.$transaction(
      body.list.map((entry) =>
        db.category.update({ where: { id: entry.id as string }, data: { position: entry.position as number } })
      )
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.log("[ARTICLE_CATEGORIES_REORDER]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
