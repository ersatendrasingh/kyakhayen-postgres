import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, props: { params: Promise<{ couponId: string }> }) {
  const params = await props.params;
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const { couponId } = params;

    const coupon = await db.coupon.findUnique({
      where: {
        id: couponId,
      },
    });

    if (!coupon) {
      return NextResponse.json("Coupon not found", { status: 404 });
    }

    const unPublishedCoupon = await db.coupon.update({
      where: {
        id: couponId,
      },
      data: {
        isActive: false,
      },
    });
    return NextResponse.json(unPublishedCoupon, { status: 200 });
  } catch (error) {
    console.log("[COUPON_ID_UNPUBLISH]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
