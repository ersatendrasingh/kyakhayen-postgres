import type { Metadata } from "next";

import IntroSection from "@/components/subscription-plans/intro-section";
import PricingTable from "@/components/subscription-plans/pricing-table";
import { currentUser } from "@/lib/auth";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Meal Plan Membership | Kya Khayen",
  description:
    "Start with a free taste-based meal plan during launch, or choose membership access for continued meal-planning tools.",
  path: "/subscription-plans",
  image: "/meta-images/subscription-plans.png",
  imageAlt: "Kya Khayen membership plans",
  keywords: [
    "meal plan membership",
    "meal planning tools",
    "weekly meal planner",
    "personalized meal plans",
  ],
});

export default async function SubscriptionPlansPage() {
  const user = await currentUser();
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
  const activePlanEndDate =
    currentPlanIndex >= 0 ? user?.userPlanEndDate?.[currentPlanIndex] : undefined;
  const hasPaidAccess = Boolean(activePlanName && activePlanName !== "Freemium");

  return (
    <div className="bg-[#fcf8f0] pb-20 dark:bg-[#091712]">
      <IntroSection
        activePlanName={activePlanName}
        hasPaidAccess={hasPaidAccess}
        isPersonalised={Boolean(user?.isPersonalised)}
      />
      <PricingTable
        activePlanName={activePlanName}
        activePlanEndDate={activePlanEndDate}
        hasPaidAccess={hasPaidAccess}
        isPersonalised={Boolean(user?.isPersonalised)}
      />
    </div>
  );
}
