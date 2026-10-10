import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

import { render } from "react-email";
import { sendEmail } from "@/lib/mail";
import OrderConfirmationMail from "@/emails/customer-order-confirmation";
import CustomerOrderAdminMail from "@/emails/customer-order-admin-mail";
import { formatDate } from "@/lib/formatDate";

type FailedOrderItem = Prisma.ItemGetPayload<{ include: { plan: true } }>;

function orderItemPayload(item: FailedOrderItem) {
  return {
    name: item.plan?.name || item.itemName,
    quantity: item.quantity,
    priceInr: item.plan?.priceInr ?? item.priceInr ?? 0,
    priceUsd: item.plan?.priceUsd ?? item.priceUsd ?? 0,
    durationDays: item.plan?.durationDays ?? 0,
  };
}

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const { orderId, paymentStatus } = await req.json();
    if (paymentStatus !== "Cancelled" && paymentStatus !== "Failed") {
      return NextResponse.json("Invalid payment status", { status: 400 });
    }

    const order = await db.order.findFirst({
      where: {
        id: orderId,
        userId: user.id,
        paymentStatus: "Processing",
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phoneNumber: true,
          },
        },
        items: {
          include: {
            plan: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json("Order not found", { status: 404 });
    }

    await db.order.update({
      where: {
        id: order.id,
      },
      data: {
        paymentStatus,
      },
    });

    const customerName = order.user.name || "Kya Khayen member";
    const customerEmail = order.user.email;
    const customerPhone = order.user.phoneNumber || "";

    await sendEmail({
      to: customerEmail as string,
      subject:
        paymentStatus === "Cancelled"
          ? "Your Kya Khayen checkout was cancelled"
          : "Your Kya Khayen payment was unsuccessful",
      html: await render(
        OrderConfirmationMail({
          subjectLine:
            "Your membership payment was not completed.",
          name: customerName,
          currency: order.currency as string,
          paymentMethod: "Razorpay",
          paymentStatus: paymentStatus,
          orderDetails: {
            orderId: order.orderId as string,
            orderDate: formatDate(order.createdAt),
            subTotal: order.subTotal as number,
            totalTax: order.taxTotal as number,
            totalAmount: order.totalAmount as number,
            coupon: order.coupon || "",
            discount: order.discount || 0,
            items: order.items.map(orderItemPayload),
          },
        })
      ),
    });

    await sendEmail({
      to: process.env.ADMIN_EMAIL as string,
      subject: `Kya Khayen membership payment ${paymentStatus.toLowerCase()}`,
      html: await render(
        CustomerOrderAdminMail({
          subjectLine:
            "A Kya Khayen membership payment attempt was not completed.",
          name: customerName,
          currency: order.currency as string,
          email: customerEmail as string,
          phoneNumber: customerPhone,
          paymentMethod: "Razorpay",
          paymentStatus: paymentStatus,
          orderDetails: {
            orderId: order.orderId as string,
            orderDate: formatDate(order.createdAt),
            subTotal: order.subTotal as number,
            totalTax: order.taxTotal as number,
            totalAmount: order.totalAmount as number,
            coupon: order.coupon || "",
            discount: order.discount || 0,
            items: order.items.map(orderItemPayload),
          },
        })
      ),
    });

    return NextResponse.json("Email sent successfully", { status: 200 });
  } catch (error) {
    console.error("[FAILED_EMAIL_SENT]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
