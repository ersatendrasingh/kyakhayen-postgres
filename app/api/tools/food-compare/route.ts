import { NextResponse } from "next/server";

import { buildFoodComparison } from "@/lib/food-compare";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const result = await buildFoodComparison({
      leftId: searchParams.get("leftId"),
      rightId: searchParams.get("rightId"),
      leftValue: searchParams.get("left"),
      rightValue: searchParams.get("right"),
      goal: searchParams.get("goal"),
      grams: searchParams.get("grams"),
    });

    if (!result) {
      return NextResponse.json(
        { result: null, message: "Choose two different foods with nutrition data." },
        { status: 404, headers: { "Cache-Control": "no-store, max-age=0" } },
      );
    }

    return NextResponse.json(
      { result },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("[FOOD_COMPARE]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
