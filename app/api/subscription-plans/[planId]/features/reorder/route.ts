import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PUT(req: Request, props: { params: Promise<{ planId: string }> }) {
  const params = await props.params;
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const { list } = (await req.json()) as {
      list: Array<{ id: string; position: number }>;
    };
    for (const item of list) {
      await db.feature.update({
        where: {
          id: item.id,
          planId: params.planId,
        },
        data: {
          position: item.position,
        },
      });
    }
    return NextResponse.json("Features reordered successfully", {
      status: 200,
    });
  } catch (error) {
    console.log("[FEATURE_REORDER]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
