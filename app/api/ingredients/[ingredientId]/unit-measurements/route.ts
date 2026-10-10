import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const measurementSchema = z.object({
  unitId: z.string().uuid(),
  values: z.number().finite().min(0),
});

export async function POST(req: Request, props: { params: Promise<{ ingredientId: string }> }) {
  const params = await props.params;
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const ingredient = await db.ingredients.findUnique({
      where: {
        id: params.ingredientId,
      },
    });

    if (!ingredient) {
      return NextResponse.json("Ingredient not found", { status: 404 });
    }

    const parsedMeasurement = measurementSchema.safeParse(await req.json());
    if (!parsedMeasurement.success) {
      return NextResponse.json("A valid unit and gram value are required", {
        status: 400,
      });
    }

    const { unitId, values } = parsedMeasurement.data;

    const unitMeasurements = await db.ingredientUnitMeasurements.findFirst({
      where: {
        ingredientId: params.ingredientId,
        unitId,
      },
    });

    let updatedUnitMeasurements;

    if (!unitMeasurements) {
      updatedUnitMeasurements = await db.ingredientUnitMeasurements.create({
        data: {
          ingredientId: params.ingredientId,
          unitId,
          values,
        },
      });
    } else {
      updatedUnitMeasurements = await db.ingredientUnitMeasurements.updateMany({
        where: {
          ingredientId: params.ingredientId,
          unitId: unitId as string,
        },
        data: {
          values,
        },
      });
    }
    return NextResponse.json(updatedUnitMeasurements, { status: 200 });
  } catch (error) {
    console.log("UNIT_MEASUREMENT", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
