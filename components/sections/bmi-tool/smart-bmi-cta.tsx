import { ArrowRight, HeartPulse, Scale, Utensils } from "lucide-react";
import Link from "next/link";

import Container from "@/components/container";

type SmartBmiCtaVariant = "home" | "compact" | "sidebar";

type SmartBmiCtaProps = {
  className?: string;
  variant?: SmartBmiCtaVariant;
};

const bmiToolHref = "/tools/smart-bmi-food-guide";

const chips = ["Indian BMI range", "Roti/rice guide", "Meal ideas"];

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function CtaButton({ className }: { className?: string }) {
  return (
    <Link
      href={bmiToolHref}
      className={classNames(
        "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#c83a2d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#ad3025] sm:w-auto",
        className,
      )}
    >
      Open Smart BMI Guide
      <ArrowRight className="size-4" />
    </Link>
  );
}

function CtaContent({ compact = false }: { compact?: boolean }) {
  return (
    <>
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#f4cf83] text-[#17372b] shadow-sm">
          <HeartPulse className="size-5" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#a8732f] dark:text-[#f4cf83]">
            Smart BMI & Food Guide
          </p>
          <h2
            className={classNames(
              "mt-1 font-semibold leading-tight text-[#2e241c] dark:text-white",
              compact ? "text-2xl" : "text-3xl sm:text-4xl",
            )}
          >
            Turn BMI into practical Indian food choices.
          </h2>
        </div>
      </div>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-[#6f5d4c] dark:text-white/66">
        Check Indian/South Asian BMI range, healthy weight in kg,
        waist-to-height context, breakfast, roti/rice portions and recipe ideas
        from Kya Khayen.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {chips.map((chip) => (
          <span
            key={chip}
            className="rounded-full border border-[#ead9c3] bg-[#fffaf2] px-3 py-2 text-xs font-semibold text-[#6d4f2e] dark:border-white/10 dark:bg-white/[0.05] dark:text-white/72"
          >
            {chip}
          </span>
        ))}
      </div>
    </>
  );
}

export default function SmartBmiCta({
  className,
  variant = "compact",
}: SmartBmiCtaProps) {
  if (variant === "home") {
    return (
      <section className={classNames("home-surface py-10 sm:py-14", className)}>
        <Container>
          <div className="overflow-hidden rounded-[1.7rem] border border-[#ead9c3] bg-[#fffaf1] shadow-[0_28px_86px_-58px_rgba(63,38,21,0.72)] dark:border-white/10 dark:bg-white/[0.04]">
            <div className="grid gap-0 lg:grid-cols-[1fr_0.78fr]">
              <div className="p-6 sm:p-8 lg:p-10">
                <CtaContent />
                <div className="mt-7">
                  <CtaButton />
                </div>
              </div>
              <div className="grid gap-3 border-t border-[#ead9c3] bg-[#17372b] p-5 text-white dark:border-white/10 lg:border-l lg:border-t-0">
                {[
                  { icon: Scale, label: "BMI + healthy range" },
                  { icon: Utensils, label: "Breakfast, roti and rice" },
                  { icon: HeartPulse, label: "Recipe ideas by result" },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.label}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/8 p-4"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f4cf83] text-[#17372b]">
                        <Icon className="size-4" />
                      </span>
                      <span className="text-sm font-semibold leading-6">
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Container>
      </section>
    );
  }

  if (variant === "sidebar") {
    return (
      <Link
        href={bmiToolHref}
        className={classNames(
          "group block overflow-hidden rounded-[1.55rem] border border-[#ead9c3] bg-[#fffaf1] p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#c83a2d] hover:shadow-lg hover:shadow-[#5c3219]/10 dark:border-white/10 dark:bg-white/[0.05]",
          className,
        )}
      >
        <span className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#17372b] text-[#f4cf83]">
            <HeartPulse className="size-5" />
          </span>
          <span>
            <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#a8732f] dark:text-[#f4cf83]">
              Food guide
            </span>
            <span className="mt-1 block text-lg font-semibold leading-tight text-[#2e241c] dark:text-white">
              Build Your Plate with BMI Insights.
            </span>
          </span>
        </span>
        <span className="mt-3 block text-sm leading-6 text-[#6f5d4c] dark:text-white/64">
          Healthy weight, breakfast, roti/rice portions and recipes in one quick
          tool.
        </span>
        <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#c83a2d] dark:text-[#f4cf83]">
          Open BMI guide
          <ArrowRight className="size-4 transition group-hover:translate-x-1" />
        </span>
      </Link>
    );
  }

  return (
    <section
      className={classNames(
        "rounded-[1.5rem] border border-[#ead9c3] bg-[#fffaf1] p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:p-7",
        className,
      )}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <CtaContent compact />
        </div>
        <CtaButton className="lg:min-w-56" />
      </div>
    </section>
  );
}
