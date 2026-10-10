import type { PaymentStatus, Prisma } from "@prisma/client";
import {
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  Mail,
  ReceiptIndianRupee,
  TicketPercent,
  UserRound,
  XCircle,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type OrderDetails = Prisma.OrderGetPayload<{
  include: {
    user: {
      include: {
        UserPlan: { include: { plan: true } };
      };
    };
    items: { include: { plan: true } };
  };
}>;

function money(amount: number | null, currency: string | null) {
  if (typeof amount !== "number") return "-";
  return new Intl.NumberFormat(currency === "USD" ? "en-US" : "en-IN", {
    style: "currency",
    currency: currency === "USD" ? "USD" : "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function date(value: Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "long", timeStyle: "short" }).format(new Date(value));
}

function isPaid(status: PaymentStatus) {
  return status === "Paid" || status === "Success";
}

function statusDetails(status: PaymentStatus) {
  if (isPaid(status)) {
    return {
      label: "Payment confirmed",
      copy: "Membership access was activated after verified payment confirmation.",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
      icon: CheckCircle2,
    };
  }
  if (status === "Processing") {
    return {
      label: "Awaiting confirmation",
      copy: "The payment gateway order exists or checkout started, but paid access has not been verified.",
      className: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
      icon: Clock3,
    };
  }
  return {
    label: "Payment unsuccessful",
    copy: "No paid membership activation was made from this payment attempt.",
    className: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300",
    icon: XCircle,
  };
}

export function OrderDetail({ order }: { order: OrderDetails }) {
  const purchasedPlan = order.items[0]?.plan;
  const relatedAccess = purchasedPlan
    ? order.user.UserPlan.find((assignment) => assignment.planId === purchasedPlan.id)
    : null;
  const status = statusDetails(order.paymentStatus);
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6">
      <section className="admin-taxonomy-hero rounded-[32px] p-5 sm:p-7 lg:p-9">
        <div className="relative z-[1]">
          <Button variant="outline" className="admin-taxonomy-hero-action rounded-2xl" asChild>
            <Link href="/admin/orders">Orders catalogue</Link>
          </Button>
          <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Badge variant="outline" className={status.className}>
                <StatusIcon className="mr-1.5 size-3.5" />
                {status.label}
              </Badge>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                {order.orderId || `Checkout ${order.id.slice(-8).toUpperCase()}`}
              </h1>
              <p className="admin-taxonomy-hero-copy mt-2 text-sm sm:text-base">
                {status.copy}
              </p>
            </div>
            {isPaid(order.paymentStatus) && (
              <Button className="rounded-2xl" asChild>
                <a href={`/api/admin/orders/${order.id}/invoice`}>
                  <Download className="size-4" />
                  Download Invoice
                </a>
              </Button>
            )}
          </div>
        </div>
        <div className="relative z-[1] mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DetailStat icon={Banknote} label="Total Paid" value={money(order.totalAmount, order.currency)} />
          <DetailStat icon={CalendarDays} label="Ordered At" value={date(order.createdAt)} />
          <DetailStat icon={ReceiptIndianRupee} label="Payment Method" value={order.paymentMethod || "-"} />
          <DetailStat icon={TicketPercent} label="Coupon Used" value={order.coupon || "No coupon"} />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="overflow-hidden rounded-[28px] border bg-card shadow-sm">
          <div className="border-b px-5 py-5 sm:px-7">
            <h2 className="text-xl font-semibold">Purchase summary</h2>
            <p className="mt-1 text-sm text-muted-foreground">Membership item and charged amount for this order.</p>
          </div>
          <div className="space-y-5 p-5 sm:p-7">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-4 rounded-2xl border bg-muted/20 p-4">
                <div>
                  <p className="font-semibold">{item.plan?.name || item.itemName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.plan?.durationDays ? `${item.plan.durationDays} days of access` : "Membership access"} · Quantity {item.quantity}
                  </p>
                </div>
                <p className="font-semibold">
                  {money(order.currency === "USD" ? item.priceUsd : item.priceInr, order.currency)}
                </p>
              </div>
            ))}
            <div className="space-y-3 rounded-2xl border p-4 text-sm">
              <AmountRow label="Subtotal" value={money(order.subTotal, order.currency)} />
              <AmountRow label="Discount" value={order.discount ? `- ${money(order.discount, order.currency)}` : "-"} />
              <AmountRow label="Tax" value={order.taxTotal ? money(order.taxTotal, order.currency) : "Not charged"} />
              <div className="border-t pt-3">
                <AmountRow label="Total" value={money(order.totalAmount, order.currency)} strong />
              </div>
            </div>
          </div>
        </section>

        <div className="space-y-6">
          <section className="overflow-hidden rounded-[28px] border bg-card shadow-sm">
            <div className="border-b px-5 py-5 sm:px-7">
              <h2 className="text-xl font-semibold">Customer and access</h2>
            </div>
            <div className="space-y-4 p-5 sm:p-7">
              <InfoRow icon={UserRound} label="Customer" value={order.user.name || "Member"} />
              <InfoRow icon={Mail} label="Email" value={order.user.email || "Not available"} />
              <InfoRow
                icon={CalendarDays}
                label="Membership access"
                value={
                  relatedAccess?.endDate
                    ? `Available until ${date(relatedAccess.endDate)}`
                    : isPaid(order.paymentStatus)
                      ? "Activation record unavailable"
                      : "Not activated"
                }
              />
            </div>
          </section>

          <section className="overflow-hidden rounded-[28px] border bg-card shadow-sm">
            <div className="border-b px-5 py-5 sm:px-7">
              <h2 className="text-xl font-semibold">Payment trail</h2>
              <p className="mt-1 text-sm text-muted-foreground">Payment status is controlled by verified gateway events.</p>
            </div>
            <div className="space-y-5 p-5 sm:p-7">
              <TimelineItem
                title="Checkout created"
                copy={date(order.createdAt)}
                completed
              />
              <TimelineItem
                title="Razorpay order opened"
                copy={order.orderId || "Payment window was not opened"}
                completed={Boolean(order.orderId)}
              />
              <TimelineItem
                title={status.label}
                copy={`Last updated ${date(order.updateAt)}`}
                completed={isPaid(order.paymentStatus)}
                failed={order.paymentStatus === "Failed" || order.paymentStatus === "Cancelled"}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function DetailStat({ icon: Icon, label, value }: { icon: typeof Banknote; label: string; value: string }) {
  return (
    <div className="admin-taxonomy-stat min-w-0 rounded-3xl px-5 py-5 backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <p className="admin-taxonomy-stat-label text-sm font-medium">{label}</p>
        <Icon className="admin-taxonomy-stat-icon size-5 shrink-0" />
      </div>
      <p className="admin-taxonomy-stat-value mt-3 truncate text-xl font-semibold">{value}</p>
    </div>
  );
}

function AmountRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-4 ${strong ? "text-base font-semibold" : "text-muted-foreground"}`}>
      <span>{label}</span>
      <span className={strong ? "" : "text-foreground"}>{value}</span>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof UserRound; label: string; value: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border bg-muted/20 p-4">
      <Icon className="mt-0.5 size-5 shrink-0 text-webprimary" />
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
        <p className="mt-1 break-words font-medium">{value}</p>
      </div>
    </div>
  );
}

function TimelineItem({
  title,
  copy,
  completed,
  failed = false,
}: {
  title: string;
  copy: string;
  completed: boolean;
  failed?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <span
        className={`mt-1 size-3 shrink-0 rounded-full ${
          failed ? "bg-rose-500" : completed ? "bg-webprimary" : "bg-muted-foreground/30"
        }`}
      />
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{copy}</p>
      </div>
    </div>
  );
}
