import Link from "next/link";
import { ArrowRight, Gift, Mail, Sparkles } from "lucide-react";
import { currentUser } from "@/lib/auth";
import SubscriptionCard from "../_components/subscription-card";
import AccountPageHeading from "../_components/account-page-heading";

const UserSubscriptionPage = async () => {
  const user = await currentUser();
  if (!user) return null;
  const currentPlanIndex =
    user.userPlanEndDate?.reduce(
      (latestIndex, date, index, dates) =>
        new Date(date).getTime() > new Date(dates[latestIndex]).getTime()
          ? index
          : latestIndex,
      0,
    ) ?? -1;
  const currentPlan =
    currentPlanIndex >= 0 ? user.userPlan?.[currentPlanIndex] : undefined;
  const hasPlan = Boolean(currentPlan);
  const isPaidMembership = currentPlan && currentPlan !== "Freemium";
  const planDestination = user.isPersonalised ? "/meal-plan" : "/meal-plan/create";

  return (
    <div>
      <AccountPageHeading
        eyebrow="My access"
        title="Your meal-planning membership"
        description="View your active access period, continue your weekly meal plan, or extend your membership without losing unused days."
      />

      <section className="relative mb-5 overflow-hidden rounded-[1.8rem] bg-[#32241b] p-6 text-white dark:bg-[#142820] sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_88%_12%,rgba(221,173,91,0.33),transparent_34%),linear-gradient(100deg,rgba(190,52,39,0.32),transparent_46%)]" />
        <div className="relative flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-[#f1d5a2]">
              <Gift className="size-3.5" /> {isPaidMembership ? "Paid membership active" : "Launch access active"}
            </span>
            <h2 className="text-2xl font-semibold sm:text-3xl">
              {isPaidMembership
                ? "Your meal-planning membership is ready."
                : "Your first weekly table starts free."}
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/72">
              {isPaidMembership
                ? "Buying another membership extends your current access period, so remaining days are kept."
                : "Generate a meal plan during launch, then extend access later without losing remaining free days."}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link href={planDestination} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#bf3a2b] px-5 py-3 text-sm font-semibold text-white">
              {user.isPersonalised ? "Open meal plan" : "Set up meal plan"} <ArrowRight className="size-4" />
            </Link>
            <Link href="/subscription-plans" className="inline-flex items-center justify-center rounded-full border border-white/18 px-5 py-3 text-sm font-semibold text-white">
              Extend access
            </Link>
          </div>
        </div>
      </section>

      {hasPlan ? (
        <SubscriptionCard
          subscription={currentPlan!}
          planStartDate={user.userPlanStartDate[currentPlanIndex]}
          planEndDate={user.userPlanEndDate[currentPlanIndex]}
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          <AccessItem icon={Sparkles} title="Personalized weekly plan" text="Food style, cuisines, exclusions and cooking comfort shape your week." />
          <AccessItem icon={Mail} title="Premium tools ahead" text="PDF delivery, fresh weekly planning and convenient sharing can be offered through membership." />
        </div>
      )}
    </div>
  );
};

const AccessItem = ({ icon: Icon, title, text }: { icon: React.ElementType; title: string; text: string }) => (
  <div className="rounded-[1.6rem] border border-[#eadcc9] bg-[#fffdf8] p-6 dark:border-white/10 dark:bg-[#10231c]">
    <Icon className="mb-5 size-6 text-[#bd382a] dark:text-[#dfb472]" />
    <h2 className="font-semibold text-[#33251d] dark:text-[#f1ece5]">{title}</h2>
    <p className="mt-2 text-sm leading-6 text-[#78675c] dark:text-[#a9b9b0]">{text}</p>
  </div>
);

export default UserSubscriptionPage;
