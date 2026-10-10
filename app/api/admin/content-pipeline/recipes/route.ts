import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import { getPipelineRecipes } from "@/lib/content-pipeline/pipeline-recipes";

export async function GET(request: Request) {
  const admin = await currentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const limit = Number(searchParams.get("limit") ?? 20);
  const recipes = await getPipelineRecipes({
    query,
    limit: Number.isFinite(limit) ? limit : 20,
  });

  return NextResponse.json({ recipes });
}
