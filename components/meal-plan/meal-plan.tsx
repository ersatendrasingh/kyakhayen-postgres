"use client";

import { useEffect, useRef, useState } from "react";
import { addDays, isAfter, isBefore, isSameDay, startOfDay, subDays } from "date-fns";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import CalendarHeader from "@/components/calendar/calendar-header";
import DailyView from "@/components/meal-plan/daily-view";

import { useSession } from "next-auth/react";
import MealPlanLanding from "./meal-plan-landing";

const MealPlan = () => {
  const { data: session, status, update } = useSession();
  const user = session?.user;
  const hasRunOnce = useRef(false);
  const hasAlignedPlanDate = useRef(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    if (!hasRunOnce.current) {
      update();
      hasRunOnce.current = true;
    }
  }, [update]);

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handlePrevDay = () => {
    setSelectedDate((prevDate) => subDays(prevDate, 1));
  };

  const handleNextDay = () => {
    setSelectedDate((prevDate) => addDays(prevDate, 1));
  };

  const currentPlanIndex =
    user?.userPlanEndDate?.reduce(
      (latestIndex, date, index, dates) =>
        new Date(date).getTime() > new Date(dates[latestIndex]).getTime()
          ? index
          : latestIndex,
      0,
    ) ?? -1;
  const activePlan =
    currentPlanIndex >= 0 ? user?.userPlan?.[currentPlanIndex] : undefined;
  const hasPaidAccess = Boolean(activePlan && activePlan !== "Freemium");

  useEffect(() => {
    if (hasAlignedPlanDate.current || !user?.isPersonalised || currentPlanIndex < 0) {
      return;
    }

    const planStartValue = user.userPlanStartDate?.[currentPlanIndex];
    const planEndValue = user.userPlanEndDate?.[currentPlanIndex];
    if (!planStartValue || !planEndValue) return;

    const planStartDate = startOfDay(new Date(planStartValue));
    const planEndDate = startOfDay(new Date(planEndValue));
    const today = startOfDay(new Date());
    const firstVisibleDate = isBefore(today, planStartDate)
      ? planStartDate
      : isAfter(today, planEndDate)
        ? planEndDate
        : today;

    const timer = window.setTimeout(() => {
      setSelectedDate((currentDate) => {
        const normalizedCurrentDate = startOfDay(currentDate);
        return isSameDay(normalizedCurrentDate, firstVisibleDate)
          ? currentDate
          : firstVisibleDate;
      });
      hasAlignedPlanDate.current = true;
    }, 0);

    return () => window.clearTimeout(timer);
  }, [
    currentPlanIndex,
    user?.isPersonalised,
    user?.userPlanEndDate,
    user?.userPlanStartDate,
  ]);

  if (status === "loading") {
    return (
      <main className="flex min-h-[calc(100svh-108px)] items-center justify-center bg-[#fffaf2] dark:bg-[#091712] lg:min-h-[calc(100svh-100px)]">
        <Loader2 className="size-7 animate-spin text-primary" />
      </main>
    );
  }

  if (!user || !user.isPersonalised) {
    return (
      <MealPlanLanding
        isSignedIn={Boolean(user)}
        activePlan={activePlan}
        hasPaidAccess={hasPaidAccess}
      />
    );
  }
  return (
    <main className="min-h-screen bg-[#fffaf2] pb-24 pt-4 text-[#2c2118] dark:bg-[#091712] dark:text-[#eef2ec] sm:py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <header className="mb-4 flex items-start justify-between gap-3 sm:mb-5 sm:items-end">
          <div>
            <p className="hidden items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary sm:flex">
              <Sparkles className="size-4" /> Made for your table
            </p>
            <h1 className="text-xl font-semibold tracking-tight text-[#2c2118] dark:text-[#f5f1e8] sm:mt-2 sm:text-3xl">
              {hasPaidAccess
                ? "Your planned meals"
                : "Your personalized meal plan"}
            </h1>
            <p className="mt-1 max-w-xl text-xs leading-5 text-[#695b4e] dark:text-[#b5c1bb] sm:mt-2 sm:text-sm">
              <span className="sm:hidden">
                {hasPaidAccess
                  ? "Your membership meal calendar"
                  : "Your seven-day food planner"}
              </span>
              <span className="hidden sm:inline">
                {hasPaidAccess
                  ? "Meals based on your food style, cuisines, exclusions and cooking comfort."
                  : "Seven days of meal ideas based on your food style, cuisines, exclusions and cooking comfort."}
              </span>
            </p>
          </div>
          <Link
            href="/meal-plan/create"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#d9c7b0] bg-white px-3 py-2 text-xs font-semibold text-[#4c3c2f] transition hover:border-primary hover:text-primary dark:border-white/10 dark:bg-[#142b23] dark:text-[#eef2ec] dark:hover:border-[#d9a556] dark:hover:text-[#e1b366] sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
          >
            <span className="sm:hidden">Edit</span>
            <span className="hidden sm:inline">Edit my choices</span>
            <ArrowRight className="size-3.5 sm:size-4" />
          </Link>
        </header>
        <CalendarHeader
          selectedDate={selectedDate}
          onDayClick={handleDayClick}
          onPrevDay={handlePrevDay}
          onNextDay={handleNextDay}
        />
        <div className="mt-3">
          {selectedDate && (
            <DailyView date={selectedDate} onSelectDate={handleDayClick} />
          )}
        </div>
      </div>
    </main>
  );
};

export default MealPlan;
