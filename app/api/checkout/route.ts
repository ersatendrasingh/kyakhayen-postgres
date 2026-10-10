import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkoutSchema } from "@/schemas";

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json("Please sign in to continue.", { status: 401 });
    }

    const body = await req.json();
    const billing = checkoutSchema.safeParse(body);
    if (!billing.success) {
      return NextResponse.json("Please confirm your payment contact details.", {
        status: 400,
      });
    }

    const requestedItems = Array.isArray(body.items) ? body.items : [];
    if (requestedItems.length !== 1 || !requestedItems[0]?.planId) {
      return NextResponse.json("Please select one membership plan.", {
        status: 400,
      });
    }

    const currency = body.currency === "INR" ? "INR" : "USD";
    const selectedPlan = await db.plan.findFirst({
      where: { id: requestedItems[0].planId, isPublished: true },
    });

    if (!selectedPlan || /free|freemium/i.test(selectedPlan.name)) {
      return NextResponse.json("This membership cannot be purchased.", {
        status: 400,
      });
    }

    const price =
      currency === "INR" ? selectedPlan.priceInr : selectedPlan.priceUsd;
    if (typeof price !== "number" || price <= 0) {
      return NextResponse.json("This membership is not available for payment.", {
        status: 400,
      });
    }

    const quantity = 1;
    const grossAmount = price * quantity;
    const discount = await getValidatedDiscount({
      code: body.couponCode,
      planId: selectedPlan.id,
      grossAmount,
    });
    const totalAmount = Math.max(0, grossAmount - discount);

    if (totalAmount <= 0) {
      return NextResponse.json(
        "Zero-value memberships are not available through payment checkout.",
        { status: 400 },
      );
    }

    const order = await db.order.create({
      data: {
        userId: user.id,
        totalAmount: roundCurrency(totalAmount),
        currency,
        subTotal: roundCurrency(grossAmount),
        taxTotal: 0,
        coupon: discount > 0 ? body.couponCode : null,
        discount: discount > 0 ? roundCurrency(discount) : null,
        paymentMethod: "Razorpay",
        items: {
          create: {
            itemName: selectedPlan.name,
            planId: selectedPlan.id,
            priceInr: selectedPlan.priceInr,
            priceUsd: selectedPlan.priceUsd,
            quantity,
          },
        },
      },
    });

    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    console.error("[CHECKOUT]", error);
    return NextResponse.json("Unable to start checkout right now.", {
      status: 500,
    });
  }
}

async function getValidatedDiscount({
  code,
  planId,
  grossAmount,
}: {
  code?: string;
  planId: string;
  grossAmount: number;
}) {
  if (!code) return 0;

  const normalizedCode = code.trim().toUpperCase();
  const coupon = await db.coupon.findUnique({
    where: { code: normalizedCode },
    include: { PlanOnCoupon: true },
  });
  if (
    !coupon ||
    !coupon.isActive ||
    (coupon.expiryDate && coupon.expiryDate < new Date()) ||
    (coupon.PlanOnCoupon.length > 0 &&
      !coupon.PlanOnCoupon.some((item) => item.planId === planId))
  ) {
    return 0;
  }

  const value = coupon.discountValue ?? 0;
  const discount =
    coupon.discountType === "CART_PERCENTAGE"
      ? (grossAmount * value) / 100
      : value;
  return Math.min(grossAmount, Math.max(0, discount));
}

function roundCurrency(value: number) {
  return Number(value.toFixed(2));
}
