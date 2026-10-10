"use client";

import { Check, ChefHat, Loader2, Sparkles, Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type MealPlanProgressModalProps = {
  open: boolean;
  percentage: number;
  message: string;
  failed: boolean;
  progressLabel: string;
  onRetry: () => void;
};

const milestones = [
  { limit: 16, text: "Reading your choices" },
  { limit: 50, text: "Curating your meals" },
  { limit: 90, text: "Balancing your week" },
  { limit: 100, text: "Finishing your plan" },
];

export default function MealPlanProgressModal({
  open,
  percentage,
  message,
  failed,
  progressLabel,
  onRetry,
}: MealPlanProgressModalProps) {
  if (!open) return null;

  const activeMilestoneIndex = milestones.findIndex(
    (milestone) => percentage < milestone.limit,
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#160f0a]/70 px-4 backdrop-blur-md">
      <section className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/15 bg-[#fffaf2] p-6 text-[#2c2118] shadow-2xl dark:border-white/10 dark:bg-[#10241e] dark:text-[#eef2ec] sm:p-9">
        <div className="absolute -right-16 -top-20 size-52 rounded-full bg-[#e4a448]/25 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 size-52 rounded-full bg-primary/16 blur-3xl" />
        <div className="relative">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-[#211912] text-[#f8d18a] shadow-lg">
            {failed ? (
              <ChefHat className="size-8" />
            ) : percentage === 100 ? (
              <Check className="size-8" />
            ) : (
              <Wand2 className="size-8 animate-pulse" />
            )}
          </div>
          <p className="mt-6 text-center text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            {failed ? "Could not complete plan" : "AI meal planning studio"}
          </p>
          <h2 className="mt-3 text-center text-2xl font-semibold">
            {failed
              ? "Something interrupted the preparation"
              : percentage === 100
                ? "Your weekly plan is ready"
                : "Crafting meals just for your table"}
          </h2>
          <p className="mx-auto mt-3 max-w-sm text-center text-sm leading-6 text-[#695b4e] dark:text-[#aab8b0]">
            {message}
          </p>

          {!failed && (
            <>
              <div className="mt-8 flex items-end justify-between">
                <span className="flex items-center gap-2 text-sm font-medium text-[#695b4e] dark:text-[#c2ccc6]">
                  <Sparkles className="size-4 text-primary" />
                  {progressLabel}
                </span>
                <span className="text-3xl font-semibold text-primary">
                  {percentage}%
                </span>
              </div>
              <Progress
                value={percentage}
                className="mt-4 h-3 bg-[#eddfcc] dark:bg-white/10"
              />
              <div className="mt-7 grid grid-cols-4 gap-2">
                {milestones.map((milestone, index) => {
                  const done = percentage >= milestone.limit;
                  const active =
                    !done &&
                    (activeMilestoneIndex === index ||
                      (activeMilestoneIndex === -1 &&
                        index === milestones.length - 1));

                  return (
                    <div key={milestone.text} className="text-center">
                      <span
                        className={`mx-auto flex size-7 items-center justify-center rounded-full text-xs ${
                          done
                            ? "bg-primary text-white"
                            : active
                              ? "bg-[#fff2ec] text-primary ring-1 ring-primary/30 dark:bg-white/15 dark:text-[#f3c77c] dark:ring-[#d9a556]/40"
                              : "bg-[#eddfcc] text-[#8b7a69] dark:bg-white/10 dark:text-[#aab8b0]"
                        }`}
                      >
                        {done ? (
                          <Check className="size-3.5" />
                        ) : active ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <span className="size-2 rounded-full bg-current/45" />
                        )}
                      </span>
                      <p className="mt-2 text-[10px] leading-4 text-[#695b4e] dark:text-[#aab8b0]">
                        {milestone.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {failed && (
            <Button
              type="button"
              size="lg"
              className="mx-auto mt-8 flex rounded-full px-8"
              onClick={onRetry}
            >
              Try generation again
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
