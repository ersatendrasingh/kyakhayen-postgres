import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import Razorpay from "razorpay";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json("Please sign in to continue.", { status: 401 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      return NextResponse.json("Payment gateway is not configured.", {
        status: 503,
      });
    }

    const { orderId, name, email, contact } = await req.json();
    const localOrder = await db.order.findFirst({
      where: { id: orderId, userId: user.id, paymentStatus: "Processing" },
      include: { items: true },
    });

    if (!localOrder || !localOrder.totalAmount || !localOrder.currency) {
      return NextResponse.json("Payment order could not be created.", {
        status: 400,
      });
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const paymentOrder = await razorpay.orders.create({
      amount: Math.round(localOrder.totalAmount * 100),
      currency: localOrder.currency,
      receipt: randomUUID(),
      notes: {
        localOrderId: localOrder.id,
        planId: localOrder.items[0]?.planId || "",
        name: name || user.name || "",
        email: email || user.email || "",
        contact: contact || user.phoneNumber || "",
      },
    });

    await db.order.update({
      where: { id: localOrder.id },
      data: { orderId: paymentOrder.id },
    });

    return NextResponse.json(
      {
        id: paymentOrder.id,
        key: keyId,
        currency: paymentOrder.currency,
        amount: paymentOrder.amount,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[RAZORPAY_ORDER]", error);
    return NextResponse.json("Unable to open the payment gateway.", {
      status: 500,
    });
  }
}
