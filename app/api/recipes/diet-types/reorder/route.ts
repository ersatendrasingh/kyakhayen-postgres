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
      return NextResponse.json("Invalid diet type position list", { status: 400 });
    }

    await db.$transaction(
      list.map((item) =>
        db.dietTypes.update({
          where: { id: item.id },
          data: { position: item.position },
        })
      )
    );

    return NextResponse.json("Diet types reordered successfully", { status: 200 });
  } catch (error) {
    console.log("[DIET_TYPE_REORDER]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
