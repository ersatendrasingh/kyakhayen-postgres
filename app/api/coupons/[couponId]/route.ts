import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export async function DELETE(req: Request, props: { params: Promise<{ couponId: string }> }) {
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
      include: {
        _count: { select: { UserCoupon: true } },
      },
    });

    if (!coupon) {
      return NextResponse.json("Coupon not found", { status: 404 });
    }
    if (coupon._count.UserCoupon > 0) {
      return NextResponse.json(
        "This coupon has recorded redemptions and must be retained for order history",
        { status: 409 }
      );
    }

    const deletedCoupon = await db.coupon.delete({
      where: {
        id: couponId,
      },
    });
    return NextResponse.json(deletedCoupon, { status: 200 });
  } catch (error) {
    console.log("[COUPON_ID_DELETE]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(req: Request, props: { params: Promise<{ couponId: string }> }) {
  const params = await props.params;
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const { couponId } = params;
    const { products, code, description, discountType, discountValue, expiryDate } =
      await req.json();
    const productsArray = Array.isArray(products)
      ? [...new Set(products.filter((value): value is string => typeof value === "string"))]
      : undefined;
    const normalizedCode =
      typeof code === "string" ? code.trim().toUpperCase() : undefined;

    if (normalizedCode !== undefined && normalizedCode.length < 3) {
      return NextResponse.json("Coupon code needs at least 3 characters", {
        status: 400,
      });
    }
    if (normalizedCode) {
      const duplicate = await db.coupon.findFirst({
        where: {
          code: normalizedCode,
          NOT: { id: couponId },
        },
      });
      if (duplicate) {
        return NextResponse.json("This coupon code already exists", {
          status: 409,
        });
      }
    }

    const nextDiscountType =
      discountType === "CART_PERCENTAGE" || discountType === "FIXED_PRODUCT"
        ? discountType
        : undefined;
    const nextDiscountValue =
      discountValue === null
        ? null
        : typeof discountValue === "number" && Number.isFinite(discountValue)
          ? discountValue
          : undefined;
    if (nextDiscountValue !== undefined && nextDiscountValue !== null && nextDiscountValue <= 0) {
      return NextResponse.json("Discount value must be greater than zero", {
        status: 400,
      });
    }
    if (nextDiscountType === "CART_PERCENTAGE" && nextDiscountValue && nextDiscountValue > 100) {
      return NextResponse.json("Percentage discount cannot exceed 100%", {
        status: 400,
      });
    }
    const nextExpiryDate =
      expiryDate === null
        ? null
        : typeof expiryDate === "string" && !Number.isNaN(new Date(expiryDate).valueOf())
          ? new Date(expiryDate)
          : undefined;

    if (productsArray) {
      const planCount = await db.plan.count({ where: { id: { in: productsArray } } });
      if (planCount !== productsArray.length) {
        return NextResponse.json("One or more memberships no longer exist", {
          status: 400,
        });
      }
    }

    const updatedCoupon = await db.coupon.update({
      where: {
        id: couponId,
      },
      data: {
        ...(normalizedCode && { code: normalizedCode }),
        ...(description !== undefined && {
          description: typeof description === "string" ? description.trim() || null : null,
        }),
        ...(nextDiscountType && { discountType: nextDiscountType }),
        ...(nextDiscountValue !== undefined && { discountValue: nextDiscountValue }),
        ...(nextExpiryDate !== undefined && { expiryDate: nextExpiryDate }),
        ...(productsArray && {
          PlanOnCoupon: {
            deleteMany: {},
            create: productsArray.map((planId) => ({ planId })),
          },
        }),
      },
      include: {
        PlanOnCoupon: true,
      },
    });
    return NextResponse.json(updatedCoupon, { status: 200 });
  } catch (error) {
    console.log("[COUPON_ID]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
