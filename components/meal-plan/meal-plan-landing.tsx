import {
  ArrowRight,
  CalendarDays,
  ChefHat,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import Container from "@/components/container";
import DevicePreview from "@/components/meal-plan/device-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type MealPlanLandingProps = {
  isSignedIn: boolean;
  activePlan?: string;
  hasPaidAccess: boolean;
};

const benefits = [
  {
    icon: ShieldCheck,
    title: "Your exclusions respected",
    description:
      "Tell us ingredients you leave out and we will keep them out of your planned recipes.",
  },
  {
    icon: ChefHat,
    title: "Built for your kitchen",
    description:
      "Choose the cuisines you enjoy and how comfortable you are with cooking.",
  },
  {
    icon: RefreshCcw,
    title: "A varied week",
    description:
      "A seven-day table designed to avoid boring repetition across your meals.",
  },
];

const steps = [
  "Choose your food style",
  "Pick cuisines you enjoy",
  "Leave out ingredients you do not want",
  "Tell us your cooking comfort",
];

export default function MealPlanLanding({
  isSignedIn,
  activePlan,
  hasPaidAccess,
}: MealPlanLandingProps) {
  const accessLabel = hasPaidAccess
    ? `${activePlan} membership active`
    : isSignedIn
      ? "7-day launch access active"
      : "Try your first 7-day plan";
  const variedPlanDescription = hasPaidAccess
    ? "A changing table designed to avoid boring repetition across your planned meals."
    : benefits[2].description;

  return (
    <main className="bg-[#fffaf2] text-[#2c2118] dark:bg-[#091712] dark:text-[#eef2ec]">
      <section className="relative overflow-hidden border-b border-[#eadcc8] py-12 dark:border-white/10 sm:py-16 lg:py-20">
        <div className="absolute -right-24 top-10 size-80 rounded-full bg-[#d8893d]/10 blur-3xl" />
        <div className="absolute -left-24 bottom-0 size-72 rounded-full bg-[#b83324]/10 blur-3xl" />
        <Container>
          <div className="relative grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <Badge className="mb-5 bg-[#f7e7c5] px-4 py-2 text-[#7d4d1c] hover:bg-[#f7e7c5] dark:bg-[#17362d] dark:text-[#e1b366] dark:hover:bg-[#17362d]">
                <Sparkles className="size-3.5" />
                {accessLabel}
              </Badge>
              <h1 className="max-w-xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                {hasPaidAccess
                  ? "Meals planned around your taste."
                  : "A 7-day meal plan made around your taste."}
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-[#625447] dark:text-[#b5c1bb] sm:text-lg">
                Pick what you like to cook and eat. We will create a practical
                weekly plan around your food style, cuisines, exclusions and
                kitchen comfort.
              </p>
              <p className="mt-4 text-sm font-medium text-[#8b5530] dark:text-[#e0b36c]">
                {hasPaidAccess
                  ? "Your membership is ready. Complete food choices to build your plan."
                  : "No medical questions. Everyday food choices only."}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="h-12 rounded-full px-7">
                  <Link href="/meal-plan/create">
                    {hasPaidAccess
                      ? "Set up my meal plan"
                      : "Create my 7-day plan"}{" "}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                {!isSignedIn && (
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="h-12 rounded-full border-[#d9c7b0] bg-white px-7 dark:border-white/10 dark:bg-[#142b23] dark:text-[#eef2ec] dark:hover:border-[#d9a556]"
                  >
                    <Link href="/auth/login?callbackUrl=%2Fmeal-plan%2Fcreate">
                      I already have an account
                    </Link>
                  </Button>
                )}
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-[620px]">
              <div className="overflow-hidden rounded-[2rem] border border-[#eadcc8] bg-[radial-gradient(circle_at_50%_14%,#fff0d5,transparent_44%),white] px-4 py-6 shadow-xl shadow-[#5c3618]/10 dark:border-white/10 dark:bg-[#10241e] dark:shadow-none sm:p-7">
                <DevicePreview />
              </div>
              <div className="absolute -bottom-5 left-5 rounded-2xl border border-[#eadcc8] bg-white px-4 py-3 shadow-lg dark:border-white/10 dark:bg-[#142b23] dark:shadow-none sm:left-10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a6b42] dark:text-[#d7a45d]">
                  {hasPaidAccess ? "Included in membership" : "Plan preview"}
                </p>
                <p className="mt-1 flex items-center gap-2 text-sm font-semibold">
                  <CalendarDays className="size-4 text-primary" /> Personalized
                  meal plan
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-14 sm:py-20">
        <Container>
          <div className="grid gap-5 md:grid-cols-3">
            {benefits.map(({ icon: Icon, title, description }, index) => (
              <div
                key={title}
                className="rounded-[1.5rem] border border-[#eadcc8] bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#10241e] dark:shadow-none"
              >
                <span className="mb-5 flex size-11 items-center justify-center rounded-full bg-[#f9edda] text-primary dark:bg-white/10 dark:text-[#e1b366]">
                  <Icon className="size-5" />
                </span>
                <h2 className="text-lg font-semibold">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-[#695b4e] dark:text-[#b5c1bb]">
                  {index === 2 ? variedPlanDescription : description}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-y border-[#eadcc8] bg-white py-14 dark:border-white/10 dark:bg-[#10241e] sm:py-20">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                How it works
              </p>
              <h2 className="mt-4 text-3xl font-semibold">
                Four choices. Your week is ready.
              </h2>
              <p className="mt-4 leading-7 text-[#695b4e] dark:text-[#b5c1bb]">
                Meal planning here is based on everyday food preferences only,
                so it stays simple, useful and transparent.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {steps.map((step, index) => (
                <div
                  key={step}
                  className="flex items-center gap-4 rounded-2xl bg-[#fffaf2] p-4 dark:bg-[#142b23]"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <p className="text-sm font-medium">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="py-14 sm:py-20">
        <Container>
          <div className="rounded-[2rem] bg-[#211912] px-6 py-12 text-center text-white sm:px-10">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#f8d18a]">
              Personalized planning is open
            </p>
            <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold">
              {hasPaidAccess
                ? "Complete your choices and open your table."
                : "Start your weekly table today."}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/70">
              {hasPaidAccess
                ? "Your active membership covers taste-based meal planning. Set your choices once and we will prepare your plan."
                : "Build a plan from your tastes and cooking comfort. You can choose continued membership later."}
            </p>
            <Button asChild size="lg" className="mt-8 h-12 rounded-full px-8">
              <Link href="/meal-plan/create">
                {hasPaidAccess ? "Complete my choices" : "Build my 7-day plan"}
              </Link>
            </Button>
          </div>
        </Container>
      </section>
    </main>
  );
}
