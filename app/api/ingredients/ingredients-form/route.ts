import { NextResponse } from "next/server";

import { db } from "@/lib/db";

import { currentUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await currentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const values = (await req.json()) as { name?: string };
    const name = values.name?.trim();
    if (!name) {
      return NextResponse.json("Preparation form name is required", { status: 400 });
    }

    const lastForm = await db.ingredientsForm.aggregate({
      _max: { position: true },
    });

    const form = await db.ingredientsForm.create({
      data: {
        name,
        position: (lastForm._max.position ?? 0) + 1,
      },
    });

    return NextResponse.json(form, { status: 201 });
  } catch (error) {
    console.log("[INGREDIENT_FORMS]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
