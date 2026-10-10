"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Feature, Plan } from "@prisma/client";
import { ArrowRight, Check, Crown, Sparkles } from "lucide-react";

import { getSubscriptionPlans } from "@/actions/get-subscription-plans";
import Container from "@/components/container";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/context/cart-context";
import { useUserCountry } from "@/context/user-country-context";
import { formatCurrency } from "@/lib/formatCurrency";

type SubscriptionPlan = Plan & { features: Feature[] };
type PricingTableProps = {
  activePlanName?: string;
  activePlanEndDate?: Date;
  hasPaidAccess: boolean;
  isPersonalised: boolean;
};

const freeFeatures = [
  "One personalized 7-day meal plan during launch",
  "Food-style, cuisine and cooking-comfort choices",
  "Ingredient exclusions for meals you prefer to avoid",
  "Desktop and mobile weekly planner view",
  "Recipe links from each planned meal",
];
const paidFallbackFeatures = [
  "Continued personalized meal-plan access",
  "Edit future meal choices while completed days stay saved",
  "Daily breakfast, lunch and dinner ideas",
  "Downloadable meal-plan PDF delivery",
  "Mobile-friendly weekly planning view",
];

export default function PricingTable({
  activePlanName,
  activePlanEndDate,
  hasPaidAccess,
  isPersonalised,
}: PricingTableProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { userCurrency, userCountry } = useUserCountry();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      getSubscriptionPlans(userCurrency).then((fetchedPlans) => {
        if (active) {
          setPlans(fetchedPlans);
          setLoading(false);
        }
      });
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [userCurrency]);

  const paidPlans = useMemo(
    () => plans.filter((plan) => !/free|freemium/i.test(plan.name)),
    [plans],
  );

  const choosePlan = (plan: SubscriptionPlan) => {
    addToCart({
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      quantity: 1,
      priceInr: plan.priceInr,
      priceUsd: plan.priceUsd,
    });

    router.push("/checkout");
  };

  const displayPrice = (plan: SubscriptionPlan) =>
    userCountry === "IN" ? plan.priceInr : plan.priceUsd;
  const displayRegularPrice = (plan: SubscriptionPlan) =>
    userCountry === "IN" ? plan.regularPriceInr : plan.regularPriceUsd;
  const planDestination = isPersonalised ? "/meal-plan" : "/meal-plan/create";
  const currentPlanPublished = paidPlans.some(
    (plan) => hasPaidAccess && plan.name === activePlanName,
  );
  const formattedAccessEndDate = activePlanEndDate
    ? new Date(activePlanEndDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <section id="membership-options" className="py-14 sm:py-20">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#a77838] dark:text-[#d6aa60]">
            Membership options
          </p>
          <h2 className="mt-4 text-3xl font-semibold text-[#30251e] sm:text-4xl dark:text-[#eef2ec]">
            {hasPaidAccess
              ? "Extend your membership whenever you need more."
              : "Try a plan, then choose continued access."}
          </h2>
          <p className="mt-4 text-sm leading-7 text-[#736357] sm:text-base dark:text-[#aab8b0]">
            {hasPaidAccess
              ? "Your active access remains intact. Any new membership adds its days after your current access period."
              : "Your first seven-day plan is available with launch access. Memberships can be purchased securely through Razorpay."}
          </p>
        </div>

        <div className="mx-auto mt-10 flex max-w-[920px] flex-wrap items-stretch justify-center gap-5">
          {!hasPaidAccess && (
            <article className="flex w-full max-w-[430px] flex-col rounded-[1.7rem] border border-[#eadbc5] bg-[#fffdf9] p-6 dark:border-white/8 dark:bg-[#10241e] sm:p-7">
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#f5e7d4] px-3 py-1.5 text-xs font-semibold text-[#8f6225] dark:bg-[#18352c] dark:text-[#dfb36c]">
                <Sparkles className="size-3.5" /> Launch access
              </span>
              <h3 className="mt-6 text-2xl font-semibold text-[#30251e] dark:text-[#eef2ec]">
                7-day plan
              </h3>
              <p className="mt-2 text-sm text-[#77675a] dark:text-[#a9b8b0]">
                See the value before paying.
              </p>
              <p className="mt-7 text-4xl font-semibold text-[#30251e] dark:text-[#eef2ec]">
                {formatCurrency(0, userCurrency)}
              </p>
              <p className="mt-2 text-xs text-[#857367] dark:text-[#9faea7]">
                Included at launch
              </p>
              <ul className="mt-7 flex-1 space-y-4">
                {freeFeatures.map((feature) => (
                  <li key={feature} className="flex gap-3 text-sm leading-6 text-[#66564a] dark:text-[#b1bdb7]">
                    <Check className="mt-1 size-4 shrink-0 text-[#b83c2e] dark:text-[#dfb36c]" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href={planDestination}
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-full border border-[#d9b982] px-5 py-3.5 text-sm font-semibold text-[#42342a] transition hover:bg-[#f7ebd9] dark:border-white/14 dark:text-[#edf1eb] dark:hover:bg-white/[0.05]"
              >
                Create 7-day plan <ArrowRight className="size-4" />
              </Link>
            </article>
          )}

          {loading
            ? [1, 2].slice(0, hasPaidAccess ? 1 : 2).map((key) => <PlanSkeleton key={key} />)
            : paidPlans.map((plan, index) => {
                const price = displayPrice(plan);
                const regularPrice = displayRegularPrice(plan);
                const isCurrent = hasPaidAccess && plan.name === activePlanName;
                const featured = isCurrent || (!hasPaidAccess && index === 0);
                const available = typeof price === "number" && price > 0;
                const visibleFeatures = plan.features.filter(
                  (feature) =>
                    !/nutrition|medical|health|disease|weight|body/i.test(
                      feature.name,
                    ),
                );
                const features = Array.from(
                  new Map(
                    [
                      ...visibleFeatures,
                      ...paidFallbackFeatures.map((name) => ({ id: name, name })),
                    ].map((feature) => [feature.name.toLowerCase(), feature])
                  ).values()
                );
                return (
                  <article
                    key={plan.id}
                    className={`relative flex w-full max-w-[430px] flex-col rounded-[1.7rem] border p-6 sm:p-7 ${
                      featured
                        ? "border-[#bb392b] bg-[#fffaf2] shadow-[0_20px_65px_rgba(184,60,46,0.10)] dark:border-[#d99c55]/50 dark:bg-[#12281f]"
                        : "border-[#eadbc5] bg-[#fffdf9] dark:border-white/8 dark:bg-[#10241e]"
                    }`}
                  >
                    {featured && (
                      <span className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-[#b83c2e] px-3 py-1.5 text-[11px] font-semibold text-white">
                        <Crown className="size-3" /> {isCurrent ? "Active now" : "Recommended"}
                      </span>
                    )}
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#a77838] dark:text-[#d6aa60]">
                      Membership
                    </p>
                    <h3 className="mt-5 text-2xl font-semibold text-[#30251e] dark:text-[#eef2ec]">
                      {plan.name}
                    </h3>
                    <p className="mt-2 text-sm text-[#77675a] dark:text-[#a9b8b0]">
                      {plan.durationDays
                        ? isCurrent && formattedAccessEndDate
                          ? `Active through ${formattedAccessEndDate}`
                          : `${plan.durationDays} days of access`
                        : "Membership access"}
                    </p>
                    <div className="mt-7 flex items-end gap-3">
                      <p className="text-4xl font-semibold text-[#30251e] dark:text-[#eef2ec]">
                        {available ? formatCurrency(price, userCurrency) : "TBA"}
                      </p>
                      {regularPrice && price && regularPrice > price && (
                        <p className="mb-1 text-sm text-[#937d6e] line-through dark:text-[#94a59d]">
                          {formatCurrency(regularPrice, userCurrency)}
                        </p>
                      )}
                    </div>
                    <ul className="mt-7 flex-1 space-y-4">
                      {features.map((feature) => (
                        <li key={feature.id} className="flex gap-3 text-sm leading-6 text-[#66564a] dark:text-[#b1bdb7]">
                          <Check className="mt-1 size-4 shrink-0 text-[#b83c2e] dark:text-[#dfb36c]" />
                          {feature.name}
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      disabled={!available}
                      onClick={() => choosePlan(plan)}
                      className="mt-8 inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-[#b83c2e] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#9c3125] disabled:cursor-not-allowed disabled:bg-[#d5c3ad]"
                    >
                      {available
                        ? isCurrent
                          ? "Extend my access"
                          : "Choose membership"
                        : "Coming soon"}
                      {available && <ArrowRight className="size-4" />}
                    </button>
                  </article>
                );
              })}
        </div>

        {!loading && hasPaidAccess && !currentPlanPublished && (
          <div className="mx-auto mt-10 w-full max-w-[430px] rounded-[1.7rem] border border-[#bb392b] bg-[#fffaf2] p-7 dark:border-[#d99c55]/50 dark:bg-[#12281f]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#a77838] dark:text-[#d6aa60]">
              Active membership
            </p>
            <h3 className="mt-5 text-2xl font-semibold text-[#30251e] dark:text-[#eef2ec]">
              {activePlanName}
            </h3>
            <p className="mt-3 text-sm leading-6 text-[#77675a] dark:text-[#a9b8b0]">
              {formattedAccessEndDate
                ? `Your access is active through ${formattedAccessEndDate}.`
                : "Your membership access is active."}
            </p>
            <Link
              href={planDestination}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#b83c2e] px-5 py-3.5 text-sm font-semibold text-white"
            >
              {isPersonalised ? "Open meal plan" : "Set up meal plan"}
              <ArrowRight className="size-4" />
            </Link>
          </div>
        )}

        {!loading && !hasPaidAccess && paidPlans.length === 0 && (
          <div className="mt-6 rounded-[1.4rem] border border-dashed border-[#dfcdb2] bg-[#fffaf2] p-6 text-center text-sm leading-7 text-[#736357] dark:border-white/12 dark:bg-[#10241e] dark:text-[#aab8b0]">
            Paid membership plans are being prepared. Your seven-day meal plan
            setup is available now.
          </div>
        )}
      </Container>
    </section>
  );
}

function PlanSkeleton() {
  return (
    <div className="w-full max-w-[430px] rounded-[1.7rem] border border-[#eadbc5] bg-[#fffdf9] p-7 dark:border-white/8 dark:bg-[#10241e]">
      <Skeleton className="h-4 w-28 bg-[#eadbc7] dark:bg-white/10" />
      <Skeleton className="mt-7 h-8 w-32 bg-[#eadbc7] dark:bg-white/10" />
      <Skeleton className="mt-7 h-12 w-44 bg-[#eadbc7] dark:bg-white/10" />
      <div className="mt-8 space-y-4">
        {[1, 2, 3].map((key) => (
          <Skeleton key={key} className="h-4 w-full bg-[#eee2d2] dark:bg-white/8" />
        ))}
      </div>
      <Skeleton className="mt-9 h-12 w-full rounded-full bg-[#eadbc7] dark:bg-white/10" />
    </div>
  );
}
