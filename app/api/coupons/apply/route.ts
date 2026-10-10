import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json("Please sign in to use a coupon.", {
        status: 401,
      });
    }

    const { code, cartItems, currency } = await req.json();
    const normalizedCode =
      typeof code === "string" ? code.trim().toUpperCase() : "";
    const selectedId = Array.isArray(cartItems) ? cartItems[0]?.id : null;
    if (!selectedId) {
      return NextResponse.json("Select a membership first.", { status: 400 });
    }

    const [coupon, plan] = await Promise.all([
      db.coupon.findUnique({
        where: { code: normalizedCode },
        include: { PlanOnCoupon: true },
      }),
      db.plan.findFirst({
        where: { id: selectedId, isPublished: true },
      }),
    ]);

    if (!coupon || !plan) {
      return NextResponse.json("Invalid coupon code", { status: 404 });
    }
    if (!coupon.isActive) {
      return NextResponse.json("Coupon is not active", { status: 400 });
    }
    if (coupon.expiryDate && coupon.expiryDate < new Date()) {
      return NextResponse.json("Coupon has expired", { status: 400 });
    }
    if (
      coupon.PlanOnCoupon.length > 0 &&
      !coupon.PlanOnCoupon.some((item) => item.planId === plan.id)
    ) {
      return NextResponse.json("Coupon is not available for this membership.", {
        status: 400,
      });
    }

    const amount = currency === "INR" ? plan.priceInr : plan.priceUsd;
    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json("This membership cannot accept a coupon.", {
        status: 400,
      });
    }

    const value = coupon.discountValue ?? 0;
    const calculatedDiscount =
      coupon.discountType === "CART_PERCENTAGE"
        ? (amount * value) / 100
        : value;

    return NextResponse.json(
      {
        code: coupon.code,
        calculatedDiscount: Number(
          Math.min(amount, Math.max(0, calculatedDiscount)).toFixed(2),
        ),
        discountValue: value,
        discountType: coupon.discountType,
        applicableProducts: [
          {
            id: plan.id,
            name: plan.name,
            priceInr: plan.priceInr,
            priceUsd: plan.priceUsd,
          },
        ],
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[COUPON_APPLY]", error);
    return NextResponse.json("Unable to apply coupon right now.", {
      status: 500,
    });
  }
}
