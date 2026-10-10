"use client";

import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2, TicketPercent } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useUserCountry } from "@/context/user-country-context";
import { couponSchema } from "@/schemas";
import { CartItem } from "@/types/cart-item";

interface CouponCodeFormProps {
  onApplyCoupon: (
    code: string,
    calculatedDiscount: number,
    discountValue: number,
    discountType: "FIXED_PRODUCT" | "CART_PERCENTAGE",
    applicableProducts?: {
      id: string;
      name: string;
      priceInr: number;
      priceUsd: number;
    }[],
  ) => void;
  cartItems: CartItem[];
}

export default function CouponCodeForm({ onApplyCoupon, cartItems }: CouponCodeFormProps) {
  const { userCurrency } = useUserCountry();
  const form = useForm<z.infer<typeof couponSchema>>({
    resolver: zodResolver(couponSchema),
    defaultValues: { code: "" },
  });
  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof couponSchema>) => {
    try {
      const response = await axios.post("/api/coupons/apply", {
        ...values,
        cartItems,
        currency: userCurrency,
      });
      onApplyCoupon(
        response.data.code,
        response.data.calculatedDiscount,
        response.data.discountValue,
        response.data.discountType,
        response.data.applicableProducts,
      );
      toast.success("Offer applied");
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data || "Coupon could not be applied."
        : "Coupon could not be applied.";
      toast.error(message);
    }
  };

  return (
    <section className="rounded-[1.35rem] border border-[#eadbc6] bg-[#fffdf9] p-4 dark:border-white/8 dark:bg-[#10241e]">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#49392e] dark:text-[#ecf1eb]">
        <TicketPercent className="size-4 text-[#b83c2e] dark:text-[#dfb36c]" />
        Have a coupon?
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <div className="relative">
                  <FormControl>
                    <Input
                      disabled={isSubmitting}
                      placeholder="Coupon code"
                      {...field}
                      className="h-12 rounded-full border-[#dfcfb8] bg-white pl-5 pr-14 text-sm font-medium uppercase shadow-none focus-visible:ring-[#b83c2e]/15 dark:border-white/10 dark:bg-[#11251f]"
                    />
                  </FormControl>
                  <button
                    type="submit"
                    disabled={!isValid || isSubmitting}
                    aria-label="Apply coupon"
                    className="absolute right-1.5 top-1.5 flex size-9 cursor-pointer items-center justify-center rounded-full bg-[#b83c2e] text-white transition hover:bg-[#9d3126] disabled:cursor-not-allowed disabled:bg-[#d4c1a7]"
                  >
                    {isSubmitting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Check className="size-4" />
                    )}
                  </button>
                </div>
                <FormMessage className="mt-2 text-xs" />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </section>
  );
}
