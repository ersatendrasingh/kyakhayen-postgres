"use client";

import CheckoutForm from "@/components/checkout/checkout-form";
import EmptyCart from "@/components/cart/empty-cart";
import Container from "@/components/container";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/context/cart-context";

export default function CheckoutPage() {
  const { cartItems, isHydrated } = useCart();
  if (!isHydrated) {
    return (
      <div className="min-h-[calc(100svh-108px)] bg-[#fcf8f0] px-4 py-12 dark:bg-[#091712] lg:min-h-[calc(100svh-100px)]">
        <div className="mx-auto max-w-6xl space-y-6">
          <Skeleton className="h-10 w-80 bg-[#eee2d2] dark:bg-white/8" />
          <Skeleton className="h-5 w-[520px] max-w-full bg-[#eee2d2] dark:bg-white/8" />
          <Skeleton className="h-[420px] w-full rounded-[1.7rem] bg-[#eee2d2] dark:bg-white/8" />
        </div>
      </div>
    );
  }
  if (cartItems.length === 0) {
    return <EmptyCart />;
  }

  return (
    <div className="min-h-[calc(100svh-108px)] bg-[#fcf8f0] pb-16 dark:bg-[#091712] lg:min-h-[calc(100svh-100px)]">
      <Container>
        <header className="mx-auto max-w-6xl pt-10 sm:pt-14">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#a77838] dark:text-[#d6aa60]">
            Secure membership checkout
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-[#30251e] sm:text-4xl dark:text-[#eef2ec]">
            Complete your membership purchase
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#736357] sm:text-base dark:text-[#aab8b0]">
            Confirm your account and finish payment securely through Razorpay.
            No address form is needed for digital access.
          </p>
        </header>
        <div className="mx-auto max-w-6xl">
          <CheckoutForm />
        </div>
      </Container>
    </div>
  );
}
