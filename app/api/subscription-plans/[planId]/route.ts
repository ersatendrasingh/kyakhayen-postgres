import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { slugify } from "@/lib/slugify";

export async function DELETE(req: Request, props: { params: Promise<{ planId: string }> }) {
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
      include: {
        _count: { select: { UserPlan: true } },
      },
    });

    if (!plan) {
      return NextResponse.json("Plan not found", { status: 404 });
    }
    if (plan._count.UserPlan > 0) {
      return NextResponse.json(
        "This plan has member assignments and must be retained for access history",
        { status: 409 }
      );
    }

    const deletedPlan = await db.plan.delete({
      where: {
        id: planId,
      },
    });
    return NextResponse.json(deletedPlan, { status: 200 });
  } catch (error) {
    console.log("[PLAN_ID_DELETE]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
export async function PATCH(req: Request, props: { params: Promise<{ planId: string }> }) {
  const params = await props.params;
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const { planId } = params;
    const { name, ...values } = await req.json();
    let slug: string | undefined;
    const normalizedName = typeof name === "string" ? name.trim() : undefined;
    if (normalizedName) {
      slug = slugify(normalizedName);
      const duplicate = await db.plan.findFirst({
        where: { slug, NOT: { id: planId } },
      });
      if (duplicate) {
        return NextResponse.json("A plan with this name already exists", {
          status: 409,
        });
      }
    }

    const plan = await db.plan.update({
      where: {
        id: planId,
      },
      data: {
        ...(normalizedName && { name: normalizedName }),
        ...(slug && { slug }),
        ...values,
      },
    });
    return NextResponse.json(plan, { status: 200 });
  } catch (error) {
    console.log("[PLAN_ID]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
