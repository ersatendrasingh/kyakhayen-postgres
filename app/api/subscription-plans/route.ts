import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { slugify } from "@/lib/slugify";
import { currentUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await currentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const { name } = await req.json();
    const normalizedName = typeof name === "string" ? name.trim() : "";
    if (!normalizedName) {
      return NextResponse.json("Plan name is required", { status: 400 });
    }
    const slug = slugify(normalizedName);
    const existingPlan = await db.plan.findUnique({ where: { slug } });
    if (existingPlan) {
      return NextResponse.json("A plan with this name already exists", {
        status: 409,
      });
    }

    const plan = await db.plan.create({
      data: {
        name: normalizedName,
        slug,
      },
    });
    return NextResponse.json(plan, { status: 200 });
  } catch (error) {
    console.log("[SUBSCRIPTION_PLAN]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
