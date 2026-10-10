"use client";

import Link from "next/link";
import { ArrowRight, CreditCard } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";

export default function EmptyCart() {
  const user = useCurrentUser();
  const currentPlanIndex =
    user?.userPlanEndDate?.reduce(
      (latestIndex, date, index, dates) =>
        new Date(date).getTime() > new Date(dates[latestIndex]).getTime()
          ? index
          : latestIndex,
      0,
    ) ?? -1;
  const activePlanName =
    currentPlanIndex >= 0 ? user?.userPlan?.[currentPlanIndex] : undefined;
  const hasPaidAccess = Boolean(activePlanName && activePlanName !== "Freemium");

  return (
    <section className="flex min-h-[calc(100svh-108px)] items-center justify-center bg-[#fcf8f0] px-4 py-14 dark:bg-[#091712] lg:min-h-[calc(100svh-100px)]">
      <div className="max-w-xl rounded-[2rem] border border-[#eadbc6] bg-[#fffdf9] p-8 text-center shadow-[0_22px_65px_rgba(68,45,25,0.08)] sm:p-12 dark:border-white/8 dark:bg-[#10241e]">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#f5e8d5] text-[#b83c2e] dark:bg-[#17362e] dark:text-[#e5b367]">
          <CreditCard className="size-7" />
        </div>
        <h1 className="mt-7 text-3xl font-semibold text-[#30251e] dark:text-[#eef2ec]">
          Choose a membership first.
        </h1>
        <p className="mt-4 text-sm leading-7 text-[#736357] dark:text-[#aab8b0]">
          {hasPaidAccess
            ? "There is no new membership selected for checkout. Your current access remains active."
            : "There is no paid membership selected for checkout. You can begin with a seven-day meal plan."}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/subscription-plans#membership-options"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#b83c2e] px-6 py-3.5 text-sm font-semibold text-white"
          >
            View membership
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/meal-plan/create"
            className="inline-flex items-center justify-center rounded-full border border-[#ddcab0] px-6 py-3.5 text-sm font-semibold text-[#44362c] dark:border-white/12 dark:text-[#edf1eb]"
          >
            {hasPaidAccess ? "Set up meal plan" : "Create 7-day plan"}
          </Link>
        </div>
      </div>
    </section>
  );
}
