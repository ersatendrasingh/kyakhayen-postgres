import Link from "next/link";
import { ArrowRight, Check, ShieldCheck, Sparkles } from "lucide-react";

import Container from "@/components/container";
import DevicePreview from "@/components/meal-plan/device-preview";

const launchBenefits = [
  "Create your first seven-day plan without payment",
  "Choices use taste, cuisine, exclusions and cooking comfort only",
  "Review the plan before deciding whether membership is useful",
];
const memberBenefits = [
  "Set or update your everyday food choices at any time",
  "Generate meal plans from cuisine and cooking preferences",
  "New purchases extend your existing access period",
];

type IntroSectionProps = {
  activePlanName?: string;
  hasPaidAccess: boolean;
  isPersonalised: boolean;
};

export default function IntroSection({
  activePlanName,
  hasPaidAccess,
  isPersonalised,
}: IntroSectionProps) {
  const planDestination = isPersonalised ? "/meal-plan" : "/meal-plan/create";
  const benefits = hasPaidAccess ? memberBenefits : launchBenefits;

  return (
    <section className="relative overflow-hidden border-b border-[#ecdfcc] dark:border-white/8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_10%,rgba(206,155,76,0.18),transparent_30%),radial-gradient(circle_at_86%_10%,rgba(187,54,41,0.10),transparent_28%)] dark:bg-[radial-gradient(circle_at_16%_10%,rgba(206,155,76,0.13),transparent_30%),radial-gradient(circle_at_86%_10%,rgba(187,54,41,0.14),transparent_28%)]" />
      <Container>
        <div className="relative grid gap-9 py-10 lg:grid-cols-[1.02fr_0.88fr] lg:items-center lg:py-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#f5e7cc] px-4 py-2 text-xs font-semibold text-[#8b5e23] dark:bg-[#17362d] dark:text-[#e1b366]">
              <Sparkles className="size-3.5" />
              {hasPaidAccess
                ? `${activePlanName} membership active`
                : "7-day launch access"}
            </span>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.12] text-[#30251e] sm:text-5xl lg:text-[3.55rem] dark:text-[#f0f3ed]">
              {hasPaidAccess
                ? "Your membership is active. Keep planning without losing days."
                : "Start your table. Upgrade when planning becomes a habit."}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[#736357] dark:text-[#aab8b0]">
              {hasPaidAccess
                ? "Set your everyday food preferences and use your paid access for continued meal planning. Future purchases extend the access you already have."
                : "Build an everyday meal plan from your food preferences. Membership provides continued planning tools, not medical advice."}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={planDestination}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#b83c2e] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#9c3125]"
              >
                {hasPaidAccess
                  ? isPersonalised
                    ? "Open my meal plan"
                    : "Set up my meal plan"
                  : "Create my 7-day plan"}
                <ArrowRight className="size-4" />
              </Link>
              {!hasPaidAccess && (
                <a
                  href="#membership-options"
                  className="inline-flex items-center justify-center rounded-full border border-[#dfccb0] px-6 py-3.5 text-sm font-semibold text-[#46372d] transition hover:bg-[#f6ebdb] dark:border-white/12 dark:text-[#ebf0ea] dark:hover:bg-white/[0.06]"
                >
                  Compare membership
                </a>
              )}
            </div>
            <div className="mt-9 space-y-3">
              {benefits.map((benefit) => (
                <p
                  key={benefit}
                  className="flex items-start gap-3 text-sm text-[#645448] dark:text-[#abb9b1]"
                >
                  <Check className="mt-0.5 size-4 shrink-0 text-[#b83c2e] dark:text-[#dfb36c]" />
                  {benefit}
                </p>
              ))}
            </div>
          </div>
          <div className="relative rounded-[2rem] border border-[#e8d9c3] bg-[radial-gradient(circle_at_55%_20%,#fff3db,transparent_48%),#fffaf2] p-5 shadow-[0_24px_70px_rgba(72,49,28,0.09)] dark:border-white/8 dark:bg-[radial-gradient(circle_at_52%_18%,rgba(213,164,83,.18),transparent_45%),#10241e] sm:p-7">
            <DevicePreview />
            <p className="mt-5 text-center text-sm font-medium text-[#6f5d50] dark:text-[#adbbb3]">
              {hasPaidAccess
                ? "Your planner, ready on desktop and mobile."
                : "One week, designed for desktop and mobile."}
            </p>
          </div>
        </div>
        <div className="relative mb-12 flex items-start gap-4 rounded-[1.4rem] border border-[#e9d9bf] bg-[#fffaf2] p-5 dark:border-white/8 dark:bg-[#10241e]">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#b83c2e] dark:text-[#dfb36c]" />
          <p className="text-sm leading-7 text-[#6c5c50] dark:text-[#adbbb3]">
            Kya Khayen provides recipe and meal-planning information for
            everyday use. Ingredient exclusions are your selected preferences,
            not an allergy-safety guarantee. Always verify ingredients where
            safety matters.
          </p>
        </div>
      </Container>
    </section>
  );
}
