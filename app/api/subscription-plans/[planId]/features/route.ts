import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request, props: { params: Promise<{ planId: string }> }) {
  const params = await props.params;
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const values = await req.json();

    const { planId } = params;
    const name = typeof values?.name === "string" ? values.name.trim() : "";
    if (!name) {
      return NextResponse.json("Benefit name is required", { status: 400 });
    }
    if (values) {
      const lastFeature = await db.feature.findFirst({
        where: {
          planId,
        },
        orderBy: {
          position: "desc",
        },
      });
      const newPosition = lastFeature ? lastFeature.position + 1 : 1;
      const method = await db.feature.create({
        data: {
          planId,
          position: newPosition,
          name,
        },
      });
      return NextResponse.json(method, { status: 200 });
    }
  } catch (error) {
    console.log("[PLAN_FEATURE]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
