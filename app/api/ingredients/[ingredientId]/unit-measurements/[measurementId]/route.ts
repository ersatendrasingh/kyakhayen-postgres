import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE(
  _req: Request,
  props: { params: Promise<{ ingredientId: string; measurementId: string }> }
) {
  const params = await props.params;
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const { ingredientId, measurementId } = params;
    const measurement = await db.ingredientUnitMeasurements.delete({
      where: {
        id: measurementId,
        ingredientId: ingredientId,
      },
    });
    return NextResponse.json(measurement, { status: 200 });
  } catch (error) {
    console.log("MEASUREMENT_DELETE", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
