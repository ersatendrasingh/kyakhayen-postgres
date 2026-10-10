import { RecipeWithCategory } from "@/types/recipe";
import MealPlanCard from "@/components/meal-plan/meal-plan-card";
import { MealTimes } from "@prisma/client";
import { useEffect, useState } from "react";

import { getMealPlanFromS3 } from "@/actions/get-meal-plan-from-s3";
import { formatDate } from "@/lib/formatDate";
import {
  buildFallbackRoutineSlots,
  type MealPlanRoutineSlot,
} from "@/lib/meal-plan-routine";
import { format, formatISO } from "date-fns";
import { getUserLatestPlanDates } from "@/actions/get-user-meal-plan-dates";
import {
  ArrowRight,
  CalendarRange,
  Loader,
  RefreshCcw,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface DailyViewProps {
  date: Date;
  onSelectDate: (date: Date) => void;
}

const mealPlanLoadRetryDelays = [450, 1200];
const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const DailyView = ({ date, onSelectDate }: DailyViewProps) => {
  const [mealsByTime, setMealsByTime] = useState<{
    [key: string]: RecipeWithCategory[];
  }>({});
  const [mealTimes, setMealTimes] = useState<MealTimes[]>([]);
  const [routineSlots, setRoutineSlots] = useState<MealPlanRoutineSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [planStartWarning, setPlanStartWarning] = useState<boolean>(false);
  const [planEndWarning, setPlanEndWarning] = useState<boolean>(false);
  const [mealPlanStartDate, setMealPlanStartDate] = useState<Date>(new Date());
  const [mealPlanEndDate, setMealPlanEndDate] = useState<Date>(new Date());
  const [planUnavailable, setPlanUnavailable] = useState(false);
  const [planLoadError, setPlanLoadError] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);

  const normalizeDate = (date: Date): Date => {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    return normalizedDate;
  };

  useEffect(() => {
    let active = true;
    const fetchMealPlan = async () => {
      setLoading(true);
      setPlanStartWarning(false);
      setPlanEndWarning(false);
      setPlanUnavailable(false);
      setPlanLoadError(false);
      setMealsByTime({});
      setMealTimes([]);
      setRoutineSlots([]);

      try {
        let planDates: Awaited<ReturnType<typeof getUserLatestPlanDates>> | null = null;
        let planDatesError: unknown = null;

        for (let attempt = 0; attempt <= mealPlanLoadRetryDelays.length; attempt += 1) {
          try {
            planDates = await getUserLatestPlanDates();
            planDatesError = null;
            break;
          } catch (error) {
            planDatesError = error;
            const retryDelay = mealPlanLoadRetryDelays[attempt];
            if (typeof retryDelay === "number") {
              await wait(retryDelay);
            }
          }
        }

        if (planDatesError || !planDates) {
          throw planDatesError ?? new Error("Meal plan dates could not be loaded.");
        }

        const { startDate, endDate } = planDates;
        const userPlanStartDate = normalizeDate(new Date(startDate));
        const userPlanEndDate = normalizeDate(new Date(endDate));
        const selectedDate = normalizeDate(new Date(date));

        if (!active) return;
        setMealPlanStartDate(userPlanStartDate);
        setMealPlanEndDate(userPlanEndDate);

        if (selectedDate < userPlanStartDate) {
          setPlanStartWarning(true);
          setLoading(false);
          return;
        }

        if (selectedDate > userPlanEndDate) {
          setPlanEndWarning(true);
          setLoading(false);
          return;
        }

        const formattedDate = formatISO(date, { representation: "date" });
        let mealPlanResult: Awaited<ReturnType<typeof getMealPlanFromS3>> = null;
        let mealPlanError: unknown = null;

        for (let attempt = 0; attempt <= mealPlanLoadRetryDelays.length; attempt += 1) {
          try {
            mealPlanResult = await getMealPlanFromS3({ date: formattedDate });
            mealPlanError = null;
            break;
          } catch (error) {
            mealPlanError = error;
            const retryDelay = mealPlanLoadRetryDelays[attempt];
            if (typeof retryDelay === "number") {
              await wait(retryDelay);
            }
          }
        }

        if (mealPlanError) {
          throw mealPlanError;
        }

        if (!active) return;
        if (mealPlanResult && mealPlanResult.mealTimes.length > 0) {
          const { mealTimes, mealsByTime, routineSlots } = mealPlanResult;
          setMealsByTime(mealsByTime || {});
          setMealTimes(mealTimes);
          setRoutineSlots(routineSlots || []);
        } else {
          setPlanUnavailable(true);
          setRoutineSlots([]);
        }
      } catch (error) {
        if (!active) return;
        console.error("Error fetching meal plan:", error);
        setPlanLoadError(true);
        setRoutineSlots([]);
      }

      if (active) {
        setLoading(false);
      }
    };

    if (date) {
      const timer = window.setTimeout(() => {
        void fetchMealPlan();
      }, 0);

      return () => {
        active = false;
        window.clearTimeout(timer);
      };
    }

    return () => {
      active = false;
    };
  }, [date, refreshCount]);

  const areAllMealsEmpty = () => {
    return Object.values(mealsByTime).every(
      (mealArray) => mealArray.length === 0,
    );
  };

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-[1.5rem] border border-[#eadcc8] bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#10241e] dark:text-[#eef2ec] dark:shadow-none">
        <Loader className="size-6 animate-spin" />
        <h2 className="mt-4 text-sm font-medium text-[#695b4e] dark:text-[#b5c1bb]">
          Loading your meals for {format(date, "EEEE")}
        </h2>
      </div>
    );
  }

  if (planStartWarning) {
    return (
      <div className="overflow-hidden rounded-2xl border border-[#eadcc8] bg-white shadow-sm dark:border-white/10 dark:bg-[#10241e] dark:shadow-none">
        <div className="border-b border-[#f0e5d6] bg-[#fff8ef] px-5 py-4 dark:border-white/10 dark:bg-[#142b23] sm:px-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9a6b42] dark:text-[#d7a45d]">
            Outside your plan range
          </p>
        </div>
        <div className="flex flex-col gap-5 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-7">
          <div className="flex gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#fff2ec] text-primary dark:bg-white/10 dark:text-[#e1b366]">
              <CalendarRange className="size-6" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-[#2c2118] dark:text-[#f5f1e8]">
                Your plan begins on {formatDate(mealPlanStartDate)}
              </h2>
              <p className="mt-1 max-w-md text-sm leading-6 text-[#695b4e] dark:text-[#b5c1bb]">
                Open your first planned day to see the meals made for your
                choices.
              </p>
            </div>
          </div>
          <Button
            type="button"
            className="w-full rounded-full px-5 sm:w-auto"
            onClick={() => onSelectDate(mealPlanStartDate)}
          >
            Go to first day <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (planEndWarning) {
    return (
      <div className="overflow-hidden rounded-2xl border border-[#eadcc8] bg-white shadow-sm dark:border-white/10 dark:bg-[#10241e] dark:shadow-none">
        <div className="border-b border-[#f0e5d6] bg-[#fff8ef] px-5 py-4 dark:border-white/10 dark:bg-[#142b23] sm:px-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9a6b42] dark:text-[#d7a45d]">
            Outside your plan range
          </p>
        </div>
        <div className="flex flex-col gap-5 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-7">
          <div className="flex gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#fff2ec] text-primary dark:bg-white/10 dark:text-[#e1b366]">
              <CalendarRange className="size-6" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-[#2c2118] dark:text-[#f5f1e8]">
                This plan ends on {formatDate(mealPlanEndDate)}
              </h2>
              <p className="mt-1 max-w-md text-sm leading-6 text-[#695b4e] dark:text-[#b5c1bb]">
                Return to the final planned day, or create fresh choices for
                your next plan period.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              className="rounded-full px-5"
              onClick={() => onSelectDate(mealPlanEndDate)}
            >
              Last planned day <ArrowRight className="size-4" />
            </Button>
            <Button asChild variant="outline" className="rounded-full px-5">
              <Link href="/meal-plan/create">New plan</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (planUnavailable) {
    return (
      <div className="rounded-[1.5rem] border border-[#eadcc8] bg-white px-6 py-12 text-center text-[#2c2118] shadow-sm dark:border-white/10 dark:bg-[#10241e] dark:text-[#eef2ec] dark:shadow-none">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#fff2ec] text-primary dark:bg-white/10 dark:text-[#e1b366]">
          <Sparkles className="size-6" />
        </span>
        <h2 className="mt-5 text-xl font-semibold">
          Your plan is being prepared
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#695b4e] dark:text-[#b5c1bb]">
          A newly created or refreshed plan can take a short moment to appear.
          Refresh here, or adjust your food choices whenever you need to.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button
            type="button"
            className="rounded-full px-6"
            onClick={() => setRefreshCount((count) => count + 1)}
          >
            <RefreshCcw className="size-4" /> Check again
          </Button>
          <Button asChild variant="outline" className="rounded-full px-6">
            <Link href="/meal-plan/create">Edit preferences</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (planLoadError) {
    return (
      <div className="rounded-[1.5rem] border border-[#eadcc8] bg-white px-6 py-12 text-center text-[#2c2118] shadow-sm dark:border-white/10 dark:bg-[#10241e] dark:text-[#eef2ec] dark:shadow-none">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#fff2ec] text-primary dark:bg-white/10 dark:text-[#e1b366]">
          <RefreshCcw className="size-6" />
        </span>
        <h2 className="mt-5 text-xl font-semibold">
          We could not open your saved plan
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#695b4e] dark:text-[#b5c1bb]">
          Your plan may already be saved, but storage could not be accessed
          right now. Please retry in a moment.
        </p>
        <Button
          type="button"
          className="mt-7 rounded-full px-6"
          onClick={() => setRefreshCount((count) => count + 1)}
        >
          <RefreshCcw className="size-4" /> Retry opening plan
        </Button>
      </div>
    );
  }

  if (areAllMealsEmpty()) {
    return (
      <div className="rounded-2xl border border-[#eadcc8] bg-white px-5 py-7 shadow-sm dark:border-white/10 dark:bg-[#10241e] dark:shadow-none sm:px-8">
        <div className="mx-auto flex max-w-xl flex-col items-center text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-[#fff2ec] text-primary dark:bg-white/10 dark:text-[#e1b366]">
            <UtensilsCrossed className="size-6" />
          </span>
          <h2 className="mt-4 text-lg font-semibold text-[#2c2118] dark:text-[#f5f1e8]">
            No meals were saved for this day
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#695b4e] dark:text-[#b5c1bb]">
            Generate your plan again to fill every time slot with your latest
            food choices.
          </p>
          <Button asChild className="mt-5 rounded-full px-6">
            <Link href="/meal-plan/create">Update and generate</Link>
          </Button>
        </div>
      </div>
    );
  }

  const mealCount = Object.values(mealsByTime).reduce(
    (count, recipes) => count + recipes.length,
    0,
  );
  const displaySlots =
    routineSlots.length > 0
      ? routineSlots
      : buildFallbackRoutineSlots({ mealTimes, mealsByTime });

  return (
    <section className="-mx-4 border-y border-[#eadcc8] bg-[#fffaf2] p-4 dark:border-white/10 dark:bg-[#10241e] sm:mx-0 sm:rounded-2xl sm:border sm:bg-white sm:p-5 sm:shadow-sm sm:dark:bg-[#10241e] sm:dark:shadow-none">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-[#f0e5d6] pb-4 dark:border-white/10">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
            {format(date, "EEEE")}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-[#2c2118] dark:text-[#f5f1e8]">
            {format(date, "d MMM yyyy")}
          </h2>
        </div>
        <p className="rounded-full bg-[#fff2ec] px-3 py-1.5 text-xs font-medium text-[#78461f] dark:bg-white/10 dark:text-[#e1b366]">
          {mealCount} {mealCount === 1 ? "dish" : "dishes"}
        </p>
      </div>
      <div className="hidden border-b border-[#f0e5d6] px-4 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9a6b42] dark:border-white/10 dark:text-[#d7a45d] lg:grid lg:grid-cols-[8rem_9rem_minmax(16rem,1fr)_minmax(22rem,1.25fr)] lg:gap-4">
        <span>Schedule</span>
        <span>Meal</span>
        <span>Plan Focus</span>
        <span>Selected Recipes</span>
      </div>
      <div className="divide-y divide-[#f0e5d6] dark:divide-white/10">
        {displaySlots.map((slot) => {
          const recipes = mealsByTime[slot.slug] || [];
          return (
            <div
              key={`${slot.slug}-${slot.key}`}
              className="py-5 first:pt-3 last:pb-1"
            >
              <div className="grid gap-4 lg:grid-cols-[8rem_9rem_minmax(16rem,1fr)_minmax(22rem,1.25fr)] lg:items-start">
                <div className="flex items-center justify-between gap-3 lg:block">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9a6b42] dark:text-[#d7a45d] lg:hidden">
                    Schedule
                  </p>
                  <p className="rounded-full bg-[#fff7eb] px-3 py-1.5 text-sm font-semibold text-[#2c2118] dark:bg-[#142b23] dark:text-[#f5f1e8] lg:inline-block">
                    {slot.timeRange || "-"}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 lg:block">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9a6b42] dark:text-[#d7a45d] lg:hidden">
                    Meal
                  </p>
                  <h3 className="text-base font-semibold text-[#2c2118] dark:text-[#f5f1e8] lg:text-sm">
                    {slot.title}
                    {slot.optional ? (
                      <span className="ml-1 font-medium text-[#8b7a69] dark:text-[#9eaea6]">
                        (Optional)
                      </span>
                    ) : null}
                  </h3>
                </div>
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9a6b42] dark:text-[#d7a45d] lg:hidden">
                    Plan Focus
                  </p>
                  <p className="max-w-2xl text-sm leading-6 text-[#4b4037] dark:text-[#c2ccc6]">
                    {slot.guidance}
                  </p>
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9a6b42] dark:text-[#d7a45d] lg:hidden">
                    Selected Recipes
                  </p>
                  <div className="grid gap-2">
                    {recipes.length > 0 ? (
                      recipes.map((recipe) => (
                        <MealPlanCard key={recipe.id} recipe={recipe} />
                      ))
                    ) : slot.optional ? (
                      <p className="rounded-xl border border-dashed border-[#eadcc8] px-3 py-4 text-xs text-[#8b7a69] dark:border-white/10 dark:text-[#9eaea6]">
                        Optional slot. Skip it when you are not hungry.
                      </p>
                    ) : (
                      <p className="rounded-xl border border-dashed border-[#eadcc8] px-3 py-4 text-xs text-[#8b7a69] dark:border-white/10 dark:text-[#9eaea6]">
                        Regenerate your plan to fill this slot.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default DailyView;
