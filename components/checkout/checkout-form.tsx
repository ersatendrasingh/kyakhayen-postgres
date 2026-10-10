"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { ArrowRight, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import BillingForm from "@/components/checkout/billing-form";
import CheckoutSummary from "@/components/checkout/checkout-summary";
import CouponCodeForm from "@/components/checkout/coupon-code-form";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/context/cart-context";
import { useUserCountry } from "@/context/user-country-context";

type AppliedCouponValue = {
  code: string;
  calculatedDiscount: number;
  discountValue: number;
  discountType: "FIXED_PRODUCT" | "CART_PERCENTAGE";
  applicableProducts?: {
    id: string;
    name: string;
    priceInr: number;
    priceUsd: number;
  }[];
};

type PaymentContact = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
};

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export default function CheckoutForm() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user;
  const { cartItems, emptyCart } = useCart();
  const { userCurrency, userCountry } = useUserCountry();
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCouponValue | null>(null);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);

  const plan = cartItems[0];
  const totalAmount =
    userCountry === "IN" ? plan?.priceInr || 0 : plan?.priceUsd || 0;
  const payableAmount = Math.max(
    0,
    totalAmount - (appliedCoupon?.calculatedDiscount || 0),
  );

  const paymentContact = useMemo<PaymentContact | null>(() => {
    if (!user?.name || !user.email || !user.phoneNumber) return null;
    const name = user.name.trim().split(/\s+/);
    return {
      firstName: name[0] || "",
      lastName: name.slice(1).join(" ") || name[0] || "",
      email: user.email,
      phoneNumber: user.phoneNumber,
    };
  }, [user]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedCoupon = localStorage.getItem("appliedCoupon");
      if (savedCoupon) {
        setAppliedCoupon(JSON.parse(savedCoupon) as AppliedCouponValue);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const checkoutItems = useMemo(
    () =>
      plan
        ? [
            {
              planId: plan.id,
              title: plan.name,
              quantity: 1,
            },
          ]
        : [],
    [plan],
  );

  const submitPayment = async () => {
    if (!paymentContact) {
      toast.error(
        user
          ? "Please complete your profile details before payment."
          : "Please create an account or sign in before payment.",
      );
      return;
    }
    const values = paymentContact;
    setIsPaymentProcessing(true);
    try {
      const checkoutResponse = await axios.post("/api/checkout", {
        ...values,
        items: checkoutItems,
        couponCode: appliedCoupon?.code,
        currency: userCurrency,
      });
      const order = checkoutResponse.data;
      const sdkReady = await initializeRazorpay();
      if (!sdkReady) {
        throw new Error("Payment window could not be loaded.");
      }

      const gatewayResponse = await axios.post("/api/razorpay", {
        orderId: order.id,
        name: `${values.firstName} ${values.lastName}`.trim(),
        email: values.email,
        contact: values.phoneNumber,
      });
      const payment = gatewayResponse.data;

      const options = {
        key: payment.key,
        name: "Kya Khayen",
        currency: payment.currency,
        amount: payment.amount,
        order_id: payment.id,
        description: `${plan?.name || "Membership"} access`,
        image: `${window.location.origin}/assets/images/kyakhayen-logo.png`,
        prefill: {
          name: `${values.firstName} ${values.lastName}`.trim(),
          email: values.email,
          contact: values.phoneNumber,
        },
        theme: { color: "#b83c2e" },
        handler: async (response: {
          razorpay_order_id?: string;
          razorpay_payment_id?: string;
          razorpay_signature?: string;
        }) => {
          if (
            !response.razorpay_order_id ||
            !response.razorpay_payment_id ||
            !response.razorpay_signature
          ) {
            toast.error("Payment verification could not be started.");
            return;
          }
          try {
            await axios.post("/api/razorpay/verify", response);
            localStorage.removeItem("appliedCoupon");
            emptyCart();
            router.push(`/success?orderId=${response.razorpay_order_id}`);
          } catch {
            toast.error("Payment could not be verified. Please contact support.");
          }
        },
        modal: {
          ondismiss: () => {
            markPaymentUnsuccessful(
              order.id,
              "Cancelled",
              values,
            );
            toast.info("Payment window closed. Your membership was not activated.");
          },
        },
      };

      new window.Razorpay(options).open();
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data || "Unable to start secure payment."
        : error instanceof Error
          ? error.message
          : "Unable to start secure payment.";
      toast.error(message);
    } finally {
      setIsPaymentProcessing(false);
    }
  };

  const applyCoupon = (
    code: string,
    calculatedDiscount: number,
    discountValue: number,
    discountType: "FIXED_PRODUCT" | "CART_PERCENTAGE",
    applicableProducts?: AppliedCouponValue["applicableProducts"],
  ) => {
    const value = {
      code,
      calculatedDiscount,
      discountValue,
      discountType,
      applicableProducts,
    };
    localStorage.setItem("appliedCoupon", JSON.stringify(value));
    setAppliedCoupon(value);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    localStorage.removeItem("appliedCoupon");
  };

  return (
    <div className="mx-auto mt-9 grid max-w-5xl gap-6 lg:grid-cols-[1fr_370px]">
      {status === "loading" ? <IdentityLoadingCard /> : <BillingForm user={user} />}
      <div className="space-y-5 lg:sticky lg:top-32 lg:h-fit">
        <CheckoutSummary
          totalAmount={totalAmount}
          payableAmount={payableAmount}
          appliedCoupon={appliedCoupon}
          onRemoveCoupon={removeCoupon}
        />
        {status !== "loading" && user && !appliedCoupon && (
          <CouponCodeForm onApplyCoupon={applyCoupon} cartItems={cartItems} />
        )}
        <button
          type="button"
          onClick={submitPayment}
          disabled={
            isPaymentProcessing || !paymentContact || payableAmount <= 0
          }
          className="inline-flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#b83c2e] px-6 text-sm font-semibold text-white transition hover:bg-[#9c3125] disabled:cursor-not-allowed disabled:bg-[#d1bca0]"
        >
          {isPaymentProcessing ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Preparing payment
            </>
          ) : (
            <>
              Proceed to payment
              <ArrowRight className="size-4" />
            </>
          )}
        </button>
        {status !== "loading" && !user && (
          <p className="rounded-2xl bg-[#f8eee1] px-4 py-3 text-center text-xs leading-6 text-[#706054] dark:bg-[#162e27] dark:text-[#aab8b0]">
            Payment unlocks after you create an account or sign in above.
          </p>
        )}
        <p className="px-3 text-center text-xs leading-6 text-[#817064] dark:text-[#9eada6]">
          By proceeding, you agree to our terms and privacy policy.
        </p>
      </div>
    </div>
  );
}

function IdentityLoadingCard() {
  return (
    <section className="rounded-[1.7rem] border border-[#eadbc6] bg-[#fffdf9] p-5 sm:p-7 dark:border-white/8 dark:bg-[#10241e]">
      <Skeleton className="h-7 w-48 bg-[#eee2d2] dark:bg-white/8" />
      <Skeleton className="mt-3 h-4 w-72 max-w-full bg-[#eee2d2] dark:bg-white/8" />
      <div className="mt-8 space-y-3">
        {[1, 2, 3].map((key) => (
          <Skeleton key={key} className="h-16 w-full rounded-2xl bg-[#eee2d2] dark:bg-white/8" />
        ))}
      </div>
    </section>
  );
}

function initializeRazorpay() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

async function markPaymentUnsuccessful(
  orderId: string,
  paymentStatus: "Cancelled" | "Failed",
  values: PaymentContact,
) {
  try {
    await axios.post("/api/razorpay/sendFailedEmail", {
      orderId,
      paymentStatus,
      name: `${values.firstName} ${values.lastName}`.trim(),
      email: values.email,
      phoneNumber: values.phoneNumber,
    });
  } catch (error) {
    console.error("Unable to record incomplete payment:", error);
  }
}
