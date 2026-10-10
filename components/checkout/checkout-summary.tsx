"use client";

import { ShieldCheck, X } from "lucide-react";

import ProductItemInCart from "@/components/checkout/product-item-in-cart";
import { useCart } from "@/context/cart-context";
import { useUserCountry } from "@/context/user-country-context";
import { formatCurrency } from "@/lib/formatCurrency";

interface CartSummaryProps {
  totalAmount: number;
  payableAmount: number;
  appliedCoupon?: { code: string; calculatedDiscount: number } | null;
  onRemoveCoupon?: () => void;
}

export default function CheckoutSummary({
  totalAmount,
  payableAmount,
  appliedCoupon,
  onRemoveCoupon,
}: CartSummaryProps) {
  const { cartItems } = useCart();
  const { userCurrency, userCountry } = useUserCountry();
  const plan = cartItems[0];
  const price =
    userCountry === "IN" ? plan?.priceInr || 0 : plan?.priceUsd || 0;

  return (
    <section className="rounded-[1.7rem] border border-[#eadbc6] bg-[#fffdf9] p-5 sm:p-7 dark:border-white/8 dark:bg-[#10241e]">
      <h2 className="text-lg font-semibold text-[#30251e] dark:text-[#eef2ec]">
        Order summary
      </h2>
      <p className="mt-1 text-sm text-[#78685b] dark:text-[#aab8b0]">
        Your selected paid access.
      </p>
      {plan && (
        <div className="mt-6">
          <ProductItemInCart title={plan.name} price={price} currency={userCurrency} />
        </div>
      )}
      <div className="mt-6 space-y-4 border-t border-[#ece0cf] pt-5 text-sm dark:border-white/8">
        <SummaryRow label="Plan price" value={formatCurrency(totalAmount, userCurrency)} />
        {appliedCoupon && (
          <div className="flex items-center justify-between gap-3 text-[#327049] dark:text-[#a4d7b1]">
            <span className="flex items-center gap-2">
              Coupon `{appliedCoupon.code}`
              <button
                type="button"
                onClick={onRemoveCoupon}
                aria-label="Remove coupon"
                className="cursor-pointer rounded-full p-1 transition hover:bg-[#e1eee3] dark:hover:bg-white/8"
              >
                <X className="size-3.5" />
              </button>
            </span>
            <span>- {formatCurrency(appliedCoupon.calculatedDiscount, userCurrency)}</span>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-[#ece0cf] pt-4 text-base font-semibold text-[#30251e] dark:border-white/8 dark:text-[#eef2ec]">
          <span>Payable now</span>
          <span>{formatCurrency(payableAmount, userCurrency)}</span>
        </div>
      </div>
      <div className="mt-5 flex items-start gap-2 border-t border-[#ece0cf] pt-4 dark:border-white/8">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#b83c2e] dark:text-[#dfb36c]" />
        <p className="text-xs leading-5 text-[#6d5d51] dark:text-[#aab8b0]">
          Secure Razorpay payment. Recipe-planning tools only, not medical
          advice.
        </p>
      </div>
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[#706053] dark:text-[#aab8b0]">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
