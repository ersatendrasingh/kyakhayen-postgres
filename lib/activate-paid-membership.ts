import { render } from "react-email";

import CustomerOrderAdminMail from "@/emails/customer-order-admin-mail";
import OrderConfirmationMail from "@/emails/customer-order-confirmation";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/formatDate";
import { generateInvoicePdf } from "@/lib/generate-invoice-pdf";
import { sendEmail } from "@/lib/mail";
import { getMealPlanQueue } from "@/lib/meal-plan-queue";
import { NotificationAutomationTrigger } from "@prisma/client";
import { scheduleMembershipExpiryNotifications } from "@/lib/meal-plan-queue";
import { runUserAutomationRules } from "@/lib/notification-automations";

type ActivationResult = {
  alreadyProcessed: boolean;
  accessEndDate?: Date;
  assignmentId?: string;
};

export async function activatePaidMembership(
  providerOrderId: string,
  paymentId: string,
): Promise<ActivationResult> {
  const order = await db.order.findUnique({
    where: { orderId: providerOrderId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          isPersonalised: true,
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
    throw new Error("Payment order not found.");
  }

  const plan = order.items[0]?.plan;
  if (!plan) {
    throw new Error("Purchased membership plan not found.");
  }

  const now = new Date();
  const activation = await db.$transaction(async (tx) => {
    const claimed = await tx.order.updateMany({
      where: {
        id: order.id,
        paymentStatus: { not: "Paid" },
      },
      data: {
        paymentStatus: "Paid",
      },
    });

    if (claimed.count === 0) {
      return { alreadyProcessed: true } as ActivationResult;
    }

    const furthestActivePlan = await tx.userPlan.findFirst({
      where: {
        userId: order.userId,
        endDate: { gt: now },
      },
      orderBy: { endDate: "desc" },
      select: { endDate: true },
    });

    // Paid access starts immediately, while its expiry is extended after any
    // existing launch or paid access so the member never loses remaining days.
    const accessEndDate = new Date(furthestActivePlan?.endDate || now);
    accessEndDate.setDate(
      accessEndDate.getDate() + Math.max(plan.durationDays || 0, 1),
    );

    // Carry remaining access into the purchased membership and retire any
    // overlapping entitlement so the account has one visible active plan.
    await tx.userPlan.updateMany({
      where: {
        userId: order.userId,
        planId: { not: plan.id },
        endDate: { gt: now },
      },
      data: { endDate: now },
    });

    const assignment = await tx.userPlan.upsert({
      where: {
        userId_planId: {
          userId: order.userId,
          planId: plan.id,
        },
      },
      update: {
        endDate: accessEndDate,
      },
      create: {
        userId: order.userId,
        planId: plan.id,
        startDate: now,
        endDate: accessEndDate,
      },
    });

    return { alreadyProcessed: false, accessEndDate, assignmentId: assignment.id };
  });

  if (activation.alreadyProcessed) {
    return activation;
  }

  if (order.user.isPersonalised) {
    try {
      const mealPlanQueue = getMealPlanQueue();
      await mealPlanQueue.add("generateMealPlan", { userId: order.user.id });
      await mealPlanQueue.close();
    } catch (error) {
      console.error("[PAID_MEMBERSHIP_MEAL_PLAN_QUEUE]", error);
    }
  }

  try {
    await runUserAutomationRules({
      trigger: NotificationAutomationTrigger.PAYMENT_SUCCESS,
      userId: order.user.id,
      tokens: { planName: plan.name },
      dedupeScope: `payment-success-${order.id}`,
    });
    if (activation.assignmentId) {
      await scheduleMembershipExpiryNotifications(order.user.id, activation.assignmentId, activation.accessEndDate || null);
    }
  } catch (error) {
    console.error("[PAID_MEMBERSHIP_PUSH]", error);
  }

  const invoiceAttachment = generateInvoicePdf({
    orderReference: order.orderId || order.id,
    issuedAt: order.createdAt,
    customerName: order.user.name || "Kya Khayen member",
    customerEmail: order.user.email || "",
    paymentMethod: "Razorpay",
    paymentReference: paymentId,
    currency: order.currency || "INR",
    planName: plan.name,
    durationDays: plan.durationDays,
    subTotal: order.subTotal || 0,
    discount: order.discount,
    taxTotal: order.taxTotal,
    totalAmount: order.totalAmount || 0,
  });

  const orderDetails = {
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
  };

  if (order.user.email) {
    try {
      await sendEmail({
        to: order.user.email,
        subject: "Your Kya Khayen membership is active",
        html: await render(
          OrderConfirmationMail({
            subjectLine: "Your membership payment has been confirmed.",
            name: order.user.name || "Member",
            currency: order.currency || "INR",
            paymentMethod: "Razorpay",
            paymentStatus: "Paid",
            orderDetails,
          }),
        ),
        attachments: [invoiceAttachment],
      });
    } catch (error) {
      console.error("[PAID_MEMBERSHIP_CUSTOMER_EMAIL]", error);
    }
  }

  if (process.env.ADMIN_EMAIL) {
    try {
      await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: "New Kya Khayen membership payment confirmed",
        html: await render(
          CustomerOrderAdminMail({
            subjectLine: "A new Kya Khayen membership payment was confirmed.",
            name: order.user.name || "Member",
            currency: order.currency || "INR",
            email: order.user.email || "",
            phoneNumber: order.user.phoneNumber || "",
            paymentMethod: "Razorpay",
            paymentStatus: "Paid",
            orderDetails,
          }),
        ),
      });
    } catch (error) {
      console.error("[PAID_MEMBERSHIP_ADMIN_EMAIL]", error);
    }
  }

  return activation;
}
