import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request, props: { params: Promise<{ userId: string }> }) {
  const params = await props.params;
  try {
    const favorites = await db.favorite.findMany({
      where: {
        userId: params.userId,
      },
      include: {
        recipe: true,
      },
    });

    return NextResponse.json(favorites, { status: 200 });
  } catch (error) {
    console.log("[USER_FAVORITE_RECIPE]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
