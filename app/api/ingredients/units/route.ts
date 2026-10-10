import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const values = (await req.json()) as {
      title?: string;
      shortName?: string;
    };
    const title = values.title?.trim();
    const shortName = values.shortName?.trim();

    if (!title || !shortName) {
      return NextResponse.json("Unit name and symbol are required", { status: 400 });
    }

    const lastUnit = await db.units.aggregate({
      _max: { position: true },
    });

    const units = await db.units.create({
      data: {
        title,
        shortName,
        position: (lastUnit._max.position ?? 0) + 1,
      },
    });

    return NextResponse.json(units, { status: 201 });
  } catch (error) {
    console.log("[UNITS]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
