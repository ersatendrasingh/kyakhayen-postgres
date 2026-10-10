import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const { code } = await req.json();
    const normalizedCode =
      typeof code === "string" ? code.trim().toUpperCase() : "";

    if (!normalizedCode) {
      return NextResponse.json("Coupon code is required", { status: 400 });
    }

    const existingCoupon = await db.coupon.findUnique({
      where: { code: normalizedCode },
    });

    if (existingCoupon) {
      return NextResponse.json("This coupon code already exists", {
        status: 409,
      });
    }

    const coupon = await db.coupon.create({
      data: {
        code: normalizedCode,
      },
    });
    return NextResponse.json(coupon, { status: 200 });
  } catch (error) {
    console.log("[COUPON]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
