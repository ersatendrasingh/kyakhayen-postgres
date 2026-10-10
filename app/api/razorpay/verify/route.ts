import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import Razorpay from "razorpay";

import { activatePaidMembership } from "@/lib/activate-paid-membership";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json("Please sign in to continue.", { status: 401 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !secret) {
      return NextResponse.json("Payment verification is not configured.", {
        status: 503,
      });
    }

    const {
      razorpay_order_id: providerOrderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    } = await req.json();

    if (!providerOrderId || !paymentId || !signature) {
      return NextResponse.json("Payment verification details are missing.", {
        status: 400,
      });
    }

    const order = await db.order.findFirst({
      where: { orderId: providerOrderId, userId: user.id },
      select: { id: true, paymentStatus: true },
    });
    if (!order) {
      return NextResponse.json("Payment order could not be found.", {
        status: 404,
      });
    }

    const expected = createHmac("sha256", secret)
      .update(`${providerOrderId}|${paymentId}`)
      .digest("hex");
    const expectedBuffer = Buffer.from(expected);
    const signatureBuffer = Buffer.from(signature);
    const valid =
      expectedBuffer.length === signatureBuffer.length &&
      timingSafeEqual(expectedBuffer, signatureBuffer);

    if (!valid) {
      return NextResponse.json("Payment verification failed.", { status: 400 });
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: secret });
    const payment = await razorpay.payments.fetch(paymentId);
    if (payment.order_id !== providerOrderId) {
      return NextResponse.json("Payment order did not match.", { status: 400 });
    }

    let paymentStatus = order.paymentStatus;
    if (payment.status === "captured") {
      await activatePaidMembership(providerOrderId, paymentId);
      paymentStatus = "Paid";
    }

    return NextResponse.json(
      {
        verified: true,
        orderId: providerOrderId,
        paymentStatus,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[RAZORPAY_VERIFY]", error);
    return NextResponse.json("Payment verification could not be completed.", {
      status: 500,
    });
  }
}
