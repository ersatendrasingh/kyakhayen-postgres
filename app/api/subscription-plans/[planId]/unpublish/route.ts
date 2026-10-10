import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, props: { params: Promise<{ planId: string }> }) {
  const params = await props.params;
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const { planId } = params;

    const plan = await db.plan.findUnique({
      where: {
        id: planId,
      },
    });

    if (!plan) {
      return NextResponse.json("Plan not found", { status: 404 });
    }

    const unPublishedPlan = await db.plan.update({
      where: {
        id: planId,
      },
      data: {
        isPublished: false,
      },
    });
    return NextResponse.json(unPublishedPlan, { status: 200 });
  } catch (error) {
    console.log("[PLAN_ID_UNPUBLISH]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
