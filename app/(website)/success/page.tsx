"use client";

import { Suspense, useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Loader2,
  ReceiptText,
  XCircle,
} from "lucide-react";

import Container from "@/components/container";
import { useCart } from "@/context/cart-context";
import { useUserCountry } from "@/context/user-country-context";
import { formatCurrency } from "@/lib/formatCurrency";

type Order = {
  orderId: string;
  subTotal: number;
  discount?: number | null;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: "Processing" | "Paid" | "Failed" | "Cancelled";
  currency: string;
  items: { id: string; itemName: string }[];
};

function SuccessPageContent() {
  const providerOrderId = useSearchParams().get("orderId");
  const { emptyCart } = useCart();
  const { userCurrency } = useUserCountry();
  const { data: session, update } = useSession();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(() => Boolean(providerOrderId));
  const [unavailable, setUnavailable] = useState(() => !providerOrderId);

  useEffect(() => {
    if (!providerOrderId) {
      return;
    }
    let active = true;
    let attempts = 0;
    const loadOrder = async () => {
      try {
        const response = await axios.get(`/api/order/${providerOrderId}`);
        if (!active) return;
        const result = response.data as Order;
        setOrder(result);
        setLoading(false);
        if (result.paymentStatus === "Paid") {
          emptyCart();
          await update();
        } else if (result.paymentStatus === "Processing" && attempts < 12) {
          attempts += 1;
          window.setTimeout(loadOrder, 900);
        }
      } catch {
        if (active) {
          setUnavailable(true);
          setLoading(false);
        }
      }
    };
    loadOrder();
    return () => {
      active = false;
    };
  }, [emptyCart, providerOrderId, update]);

  const status = order?.paymentStatus || "Processing";
  const statusCopy = {
    Paid: {
      icon: CheckCircle2,
      title: "Membership activated",
      text: "Your payment is confirmed and your membership access is ready.",
      tone: "text-[#2f7448] bg-[#e8f3e9] dark:bg-[#17372b] dark:text-[#a8dcb5]",
    },
    Processing: {
      icon: Clock3,
      title: "Confirming your payment",
      text: "Payment was submitted. This page will unlock your meal plan as soon as Razorpay confirms it.",
      tone: "text-[#9a6725] bg-[#f7eddc] dark:bg-[#332a1d] dark:text-[#e4bd7b]",
    },
    Failed: {
      icon: XCircle,
      title: "Payment was not completed",
      text: "Your membership was not activated. You may return to plans and try again.",
      tone: "text-[#aa392d] bg-[#fae9e5] dark:bg-[#37221e] dark:text-[#efaca1]",
    },
    Cancelled: {
      icon: XCircle,
      title: "Payment cancelled",
      text: "No membership was activated. You can choose a plan again whenever ready.",
      tone: "text-[#aa392d] bg-[#fae9e5] dark:bg-[#37221e] dark:text-[#efaca1]",
    },
  };
  const display = statusCopy[status];
  const Icon = display.icon;
  const mealPlanHref = session?.user?.isPersonalised
    ? "/meal-plan"
    : "/meal-plan/create";
  const mealPlanAction = session?.user?.isPersonalised
    ? "Open meal plan"
    : "Set up meal plan";

  return (
    <div className="min-h-[calc(100svh-108px)] bg-[#fcf8f0] py-12 dark:bg-[#091712] lg:min-h-[calc(100svh-100px)]">
      <Container>
        <div className="mx-auto max-w-2xl rounded-[2rem] border border-[#eadbc6] bg-[#fffdf9] p-6 shadow-[0_24px_70px_rgba(62,43,24,0.08)] sm:p-10 dark:border-white/8 dark:bg-[#10241e]">
          {loading ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center text-[#716358] dark:text-[#aab8b0]">
              <Loader2 className="size-8 animate-spin text-[#b83c2e] dark:text-[#dfb36c]" />
              <p className="mt-5 text-sm">Retrieving your payment status...</p>
            </div>
          ) : unavailable ? (
            <div className="py-8 text-center">
              <XCircle className="mx-auto size-12 text-[#b83c2e]" />
              <h1 className="mt-5 text-2xl font-semibold text-[#30251e] dark:text-[#eef2ec]">
                Payment details are unavailable.
              </h1>
              <p className="mt-3 text-sm leading-7 text-[#716358] dark:text-[#aab8b0]">
                Please open your account subscriptions page or contact support
                if you completed payment.
              </p>
            </div>
          ) : (
            <>
              <div className={`rounded-[1.45rem] p-5 ${display.tone}`}>
                <div className="flex items-start gap-3">
                  <Icon className="mt-0.5 size-6 shrink-0" />
                  <div>
                    <h1 className="text-xl font-semibold">{display.title}</h1>
                    <p className="mt-2 text-sm leading-6">{display.text}</p>
                  </div>
                </div>
              </div>
              <div className="mt-7 rounded-[1.4rem] border border-[#ece0cf] p-5 dark:border-white/8">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#30251e] dark:text-[#eef2ec]">
                  <ReceiptText className="size-4 text-[#b83c2e] dark:text-[#dfb36c]" />
                  Payment summary
                </div>
                <div className="mt-5 space-y-4 text-sm">
                  <Row label="Membership" value={order?.items[0]?.itemName || "-"} />
                  <Row label="Order ID" value={order?.orderId || "-"} />
                  <Row
                    label="Plan price"
                    value={formatCurrency(order?.subTotal || 0, order?.currency || userCurrency)}
                  />
                  {!!order?.discount && (
                    <Row
                      label="Discount"
                      value={`- ${formatCurrency(order.discount, order.currency || userCurrency)}`}
                    />
                  )}
                  <Row
                    strong
                    label="Amount paid"
                    value={formatCurrency(order?.totalAmount || 0, order?.currency || userCurrency)}
                  />
                </div>
              </div>
            </>
          )}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {status === "Paid" && !unavailable ? (
              <Link
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#b83c2e] px-5 py-3.5 text-sm font-semibold text-white"
                href={mealPlanHref}
              >
                {mealPlanAction} <ArrowRight className="size-4" />
              </Link>
            ) : status === "Processing" && !unavailable ? (
              <span className="inline-flex flex-1 cursor-wait items-center justify-center gap-2 rounded-full bg-[#eee2d1] px-5 py-3.5 text-sm font-semibold text-[#907b68] dark:bg-white/8 dark:text-[#bbc6bf]">
                <Loader2 className="size-4 animate-spin" /> Preparing meal plan
              </span>
            ) : (
              <Link
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#b83c2e] px-5 py-3.5 text-sm font-semibold text-white"
                href="/subscription-plans"
              >
                Try payment again <ArrowRight className="size-4" />
              </Link>
            )}
            <Link
              href="/user/subscriptions"
              className="inline-flex flex-1 items-center justify-center rounded-full border border-[#ddcab0] px-5 py-3.5 text-sm font-semibold text-[#44362c] dark:border-white/12 dark:text-[#edf1eb]"
            >
              {status === "Paid" ? "Membership details" : "Check payment status"}
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<PaymentStatusFallback />}>
      <SuccessPageContent />
    </Suspense>
  );
}

function PaymentStatusFallback() {
  return (
    <div className="min-h-[calc(100svh-108px)] bg-[#fcf8f0] py-12 dark:bg-[#091712] lg:min-h-[calc(100svh-100px)]">
      <Container>
        <div className="mx-auto flex min-h-[360px] max-w-2xl flex-col items-center justify-center rounded-[2rem] border border-[#eadbc6] bg-[#fffdf9] p-6 text-[#716358] shadow-[0_24px_70px_rgba(62,43,24,0.08)] sm:p-10 dark:border-white/8 dark:bg-[#10241e] dark:text-[#aab8b0]">
          <Loader2 className="size-8 animate-spin text-[#b83c2e] dark:text-[#dfb36c]" />
          <p className="mt-5 text-sm">Opening payment status...</p>
        </div>
      </Container>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex justify-between gap-4 border-b border-[#eee3d4] pb-3 last:border-0 last:pb-0 dark:border-white/8 ${
        strong
          ? "font-semibold text-[#30251e] dark:text-[#eef2ec]"
          : "text-[#716358] dark:text-[#aab8b0]"
      }`}
    >
      <span>{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
