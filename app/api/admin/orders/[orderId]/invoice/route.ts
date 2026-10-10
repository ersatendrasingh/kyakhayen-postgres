import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateInvoicePdf } from "@/lib/generate-invoice-pdf";

export async function GET(
  _request: Request,
  props: { params: Promise<{ orderId: string }> },
) {
  const user = await currentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json("Unauthorized", { status: 401 });
  }

  const { orderId } = await props.params;
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { user: true, items: { include: { plan: true } } },
  });

  if (!order) {
    return NextResponse.json("Order not found", { status: 404 });
  }
  if (order.paymentStatus !== "Paid" && order.paymentStatus !== "Success") {
    return NextResponse.json("Invoice is available only after confirmed payment", {
      status: 409,
    });
  }

  const item = order.items[0];
  if (!item) {
    return NextResponse.json("Order does not contain a membership item", {
      status: 409,
    });
  }

  const attachment = generateInvoicePdf({
    orderReference: order.orderId || order.id,
    issuedAt: order.createdAt,
    customerName: order.user.name || "Kya Khayen member",
    customerEmail: order.user.email || "",
    paymentMethod: order.paymentMethod || "Razorpay",
    currency: order.currency || "INR",
    planName: item.plan?.name || item.itemName,
    durationDays: item.plan?.durationDays,
    subTotal: order.subTotal || 0,
    discount: order.discount,
    taxTotal: order.taxTotal,
    totalAmount: order.totalAmount || 0,
  });

  return new NextResponse(Buffer.from(attachment.content, "base64"), {
    headers: {
      "Content-Disposition": `attachment; filename="${attachment.filename}"`,
      "Content-Type": attachment.contentType,
      "Cache-Control": "private, no-store",
    },
  });
}
