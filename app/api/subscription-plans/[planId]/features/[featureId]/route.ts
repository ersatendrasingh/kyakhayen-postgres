import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  props: { params: Promise<{ planId: string; featureId: string }> }
) {
  const params = await props.params;
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const { planId, featureId } = params;
    const feature = await db.feature.findUnique({
      where: {
        id: featureId,
        planId: planId,
      },
    });
    if (!feature) {
      return NextResponse.json("Feature not found", { status: 404 });
    }

    // delete feature
    const deletedFeature = await db.feature.delete({
      where: {
        id: featureId,
        planId,
      },
    });
    return NextResponse.json(deletedFeature, {
      status: 200,
    });
  } catch (error) {
    console.log("[FEATURE_ID]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
export async function PATCH(
  req: Request,
  props: { params: Promise<{ planId: string; featureId: string }> }
) {
  const params = await props.params;
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const values = await req.json();
    const feature = await db.feature.findUnique({
      where: {
        id: params.featureId,
        planId: params.planId,
      },
    });
    if (!feature) {
      return NextResponse.json("Feature not found", { status: 404 });
    }
    const name = typeof values?.name === "string" ? values.name.trim() : "";
    if (!name) {
      return NextResponse.json("Benefit name is required", { status: 400 });
    }
    if (values) {
      const updatedFeature = await db.feature.update({
        where: {
          id: params.featureId,
          planId: params.planId,
        },
        data: {
          name,
        },
      });
      return NextResponse.json(updatedFeature, { status: 200 });
    }
  } catch (error) {
    console.log("[FEATURE_ID]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
