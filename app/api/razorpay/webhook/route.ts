import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { validateWebhookSignature } from "razorpay/dist/utils/razorpay-utils";
import { render } from "react-email";
import { sendEmail } from "@/lib/mail";
import OrderConfirmationMail from "@/emails/customer-order-confirmation";
import CustomerOrderAdminMail from "@/emails/customer-order-admin-mail";
import { formatDate } from "@/lib/formatDate";
import { activatePaidMembership } from "@/lib/activate-paid-membership";
import { NotificationAutomationTrigger } from "@prisma/client";
import { runUserAutomationRules } from "@/lib/notification-automations";

type RazorpayPaymentPayload = {
  payment: {
    entity: {
      id: string;
      order_id: string;
    };
  };
};

export async function POST(req: Request) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json("Webhook is not configured", { status: 503 });
    }

    const rawBody = await req.text();
    const body = JSON.parse(rawBody) as { event?: string; payload?: RazorpayPaymentPayload };

    if (!body || !body.event) {
      return NextResponse.json("Invalid request body format", { status: 400 });
    }

    const { event, payload } = body;
    if (!payload) return NextResponse.json("Payment payload is missing", { status: 400 });
    const razorpaySignature = req.headers.get("x-razorpay-signature");

    const isValidSignature = validateWebhookSignature(
      rawBody,
      razorpaySignature as string,
      webhookSecret,
    );

    if (!isValidSignature) {
      return NextResponse.json("Invalid webhook signature", { status: 400 });
    }

    let response;

    switch (event) {
      case "payment.captured":
        response = await handlePaymentCaptured(payload);
        break;
      case "payment.failed":
        response = await handlePaymentFailed(payload);
        break;
      default:
        console.log("Unknown event type:", event);
        return NextResponse.json(
          { message: "Unknown event type" },
          { status: 400 }
        );
    }

    return response;
  } catch (error) {
    console.error("[RAZORPAY_WEBHOOK]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}

const handlePaymentCaptured = async (payload: RazorpayPaymentPayload) => {
  try {
    const paymentEntity = payload.payment.entity;
    const activation = await activatePaidMembership(
      paymentEntity.order_id,
      paymentEntity.id,
    );

    return NextResponse.json({ success: true, ...activation }, { status: 200 });
  } catch (error) {
    console.error("Error handling captured payment:", error);
    return NextResponse.json("Error handling captured payment", {
      status: 500,
    });
  }
};

const handlePaymentFailed = async (payload: RazorpayPaymentPayload) => {
  try {
    const paymentEntity = payload.payment.entity;

    const orderId = paymentEntity.order_id;

    const order = await db.order.findUnique({
      where: {
        orderId: orderId,
      },
      include: {
        user: {
          select: {
            id: true,
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
      console.log("Order not found");
      return NextResponse.json({ message: "Order not found" }, { status: 400 });
    }

    if (order.paymentStatus === "Paid") {
      return NextResponse.json({ success: true, alreadyProcessed: true }, { status: 200 });
    }

    await db.order.update({
      where: {
        id: order.id,
      },
      data: {
        paymentStatus: "Failed",
      },
    });
    try {
      await runUserAutomationRules({
        trigger: NotificationAutomationTrigger.PAYMENT_FAILED,
        userId: order.userId,
        dedupeScope: `payment-failed-${order.id}`,
      });
    } catch (notificationError) {
      console.error("[FAILED_PAYMENT_PUSH]", notificationError);
    }

    const customerEmail = order.user.email;
    const customerName = order.user.name;
    const customerPhoneNumber = order.user.phoneNumber;

    await sendEmail({
      to: order.user.email as string,
      subject: "Your Kya Khayen payment was unsuccessful",
      html: await render(
        OrderConfirmationMail({
          subjectLine:
            "Order Placement Unsuccessful, Please try again or contact support for assistance.",
          name: order.user.name as string,
          currency: order.currency as string,
          paymentMethod: "Razorpay",
          paymentStatus: "Failed",
          orderDetails: {
            orderId: order.orderId as string,
            orderDate: formatDate(order.createdAt),
            subTotal: order.subTotal as number,
            totalTax: order.taxTotal as number,
            totalAmount: order.totalAmount as number,
            coupon: order.coupon || "",
            discount: order.discount || 0,
            items: order.items.map((item) => ({
              name: item.plan?.name || item.itemName,
              quantity: item.quantity,
              priceInr: item.plan?.priceInr || item.priceInr || 0,
              priceUsd: item.plan?.priceUsd || item.priceUsd || 0,
              durationDays: item.plan?.durationDays || 0,
            })),
          },
        })
      ),
    });

    await sendEmail({
      to: process.env.ADMIN_EMAIL as string,
      subject: "An order has been failed on Kya Khayen using Razorpay",
      html: await render(
        CustomerOrderAdminMail({
          subjectLine:
            "A Kya Khayen membership payment attempt was unsuccessful.",
          name: customerName as string,
          currency: order.currency as string,
          email: customerEmail as string,
          phoneNumber: customerPhoneNumber as string,
          paymentMethod: "Razorpay",
          paymentStatus: "Failed",
          orderDetails: {
            orderId: order.orderId as string,
            orderDate: formatDate(order.createdAt),
            subTotal: order.subTotal as number,
            totalTax: order.taxTotal as number,
            totalAmount: order.totalAmount as number,
            coupon: order.coupon || "",
            discount: order.discount || 0,
            items: order.items.map((item) => ({
              name: item.plan?.name || item.itemName,
              quantity: item.quantity,
              priceInr: item.plan?.priceInr || item.priceInr || 0,
              priceUsd: item.plan?.priceUsd || item.priceUsd || 0,
              durationDays: item.plan?.durationDays || 0,
            })),
          },
        })
      ),
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error handling captured payment:", error);
    return NextResponse.json("Error handling captured payment", {
      status: 500,
    });
  }
};
