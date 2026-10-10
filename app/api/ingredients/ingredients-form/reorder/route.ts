import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

type FormPosition = {
  id: string;
  position: number;
};

export async function PUT(req: Request) {
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const values = (await req.json()) as { list?: FormPosition[] };
    const list = values.list;
    if (
      !Array.isArray(list) ||
      !list.every(
        (item) =>
          typeof item.id === "string" &&
          Number.isInteger(item.position) &&
          item.position > 0
      )
    ) {
      return NextResponse.json("Invalid preparation form position list", { status: 400 });
    }

    await db.$transaction(
      list.map((item) =>
        db.ingredientsForm.update({
          where: { id: item.id },
          data: { position: item.position },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.log("[INGREDIENT_FORMS_REORDER]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
