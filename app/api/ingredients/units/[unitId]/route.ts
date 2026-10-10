import { NextResponse } from "next/server";

import { db } from "@/lib/db";

import { currentUser } from "@/lib/auth";

export async function DELETE(req: Request, props: { params: Promise<{ unitId: string }> }) {
  const params = await props.params;
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const { unitId } = params;

    const unit = await db.units.findUnique({
      where: {
        id: unitId,
      },
      include: {
        _count: {
          select: {
            RecipeIngredients: true,
            IngredientUnitMeasurements: true,
          },
        },
      },
    });

    if (!unit) {
      return NextResponse.json("Unit not found", { status: 404 });
    }

    if (unit._count.RecipeIngredients || unit._count.IngredientUnitMeasurements) {
      return NextResponse.json("Units used by recipes or conversions cannot be deleted", {
        status: 409,
      });
    }

    const deletedUnit = await db.units.delete({
      where: {
        id: unitId,
      },
    });
    return NextResponse.json(deletedUnit, { status: 200 });
  } catch (error) {
    console.log("[UNIT_ID_DELETE]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
export async function PATCH(req: Request, props: { params: Promise<{ unitId: string }> }) {
  const params = await props.params;
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const { unitId } = params;
    const values = (await req.json()) as {
      title?: string;
      shortName?: string;
    };
    const title = values.title?.trim();
    const shortName = values.shortName?.trim();

    if (!title || !shortName) {
      return NextResponse.json("Unit name and symbol are required", { status: 400 });
    }

    const unit = await db.units.update({
      where: {
        id: unitId,
      },
      data: {
        title,
        shortName,
      },
    });
    return NextResponse.json(unit, { status: 200 });
  } catch (error) {
    console.log("[UNITID]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
