import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _req: Request,
  props: { params: Promise<{ orderId: string }> },
) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const { orderId } = await props.params;
    const order = await db.order.findFirst({
      where: { orderId, userId: user.id },
      include: { items: { include: { plan: true } } },
    });

    if (!order) {
      return NextResponse.json("Order not found", { status: 404 });
    }

    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    console.error("[ORDER_ID]", error);
    return NextResponse.json("Unable to retrieve order.", { status: 500 });
  }
}
