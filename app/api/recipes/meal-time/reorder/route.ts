import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

type PositionUpdate = {
  id: string;
  position: number;
};

export async function PUT(req: Request) {
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const { list } = (await req.json()) as { list?: PositionUpdate[] };
    if (
      !Array.isArray(list) ||
      list.length === 0 ||
      !list.every(
        (item) =>
          typeof item.id === "string" &&
          Number.isInteger(item.position) &&
          item.position > 0
      )
    ) {
      return NextResponse.json("Invalid meal time position list", { status: 400 });
    }

    await db.$transaction(
      list.map((item) =>
        db.mealTimes.update({
          where: { id: item.id },
          data: { position: item.position },
        })
      )
    );

    return NextResponse.json("Meal times reordered successfully", { status: 200 });
  } catch (error) {
    console.log("[MEAL_TIME_REORDER]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
