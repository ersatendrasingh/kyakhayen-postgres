"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookHeart,
  CalendarDays,
  ChefHat,
  Coffee,
  History,
  MessageSquareMore,
  SlidersHorizontal,
  Sparkles,
  Sun,
  UtensilsCrossed,
} from "lucide-react";
import { getUserFavoriteRecipes } from "@/actions/get-user-favorite-recipes";
import { getUserReviewedRecipes } from "@/actions/get-user-reviewed-recipes";
import { getUserViewedRecipes } from "@/actions/get-user-viewed-recipes";
import { getPopularRecipes } from "@/actions/get-popular-recipes";
import RecipeCard from "@/components/recipes/recipe-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/use-current-user";
import { capitalizeName } from "@/lib/formateName";
import { recipeCollectionHref } from "@/lib/recipe-collection-url";
import { cn } from "@/lib/utils";
import { RecipeWithCategory } from "@/types/recipe";
import AccountPageHeading from "../_components/account-page-heading";

type ActivityKey = "saved" | "recent" | "reviewed";

const UserDashboard = () => {
  const user = useCurrentUser();
  const [activity, setActivity] = useState<Record<ActivityKey, RecipeWithCategory[]>>({
    saved: [],
    recent: [],
    reviewed: [],
  });
  const [activeActivity, setActiveActivity] = useState<ActivityKey>("saved");
  const [popularRecipes, setPopularRecipes] = useState<RecipeWithCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getUserFavoriteRecipes(),
      getUserViewedRecipes(),
      getUserReviewedRecipes(),
      getPopularRecipes({ pageSize: 4 }),
    ])
      .then(([saved, recent, reviewed, popular]) => {
        setActivity({ saved, recent, reviewed });
        setPopularRecipes(popular.recipes);
      })
      .catch(() => setActivity({ saved: [], recent: [], reviewed: [] }))
      .finally(() => setLoading(false));
  }, []);

  const firstName = user?.name ? capitalizeName(user.name).split(" ")[0] : "there";
  const currentPlanIndex =
    user?.userPlanEndDate?.reduce(
      (latestIndex, date, index, dates) =>
        new Date(date).getTime() > new Date(dates[latestIndex]).getTime()
          ? index
          : latestIndex,
      0,
    ) ?? -1;
  const currentPlan =
    currentPlanIndex >= 0 ? user?.userPlan?.[currentPlanIndex] : undefined;
  const currentPlanEndDate =
    currentPlanIndex >= 0
      ? user?.userPlanEndDate?.[currentPlanIndex]
      : undefined;
  const planDestination = user?.isPersonalised ? "/meal-plan" : "/meal-plan/create";
  const activeRecipes = activity[activeActivity].slice(0, 3);
  const activityTabs = [
    { key: "saved" as const, label: "Saved", icon: BookHeart, count: activity.saved.length },
    { key: "recent" as const, label: "Recently viewed", icon: History, count: activity.recent.length },
    { key: "reviewed" as const, label: "Reviewed", icon: MessageSquareMore, count: activity.reviewed.length },
  ];
  const discoveryLinks = [
    { label: "Breakfast", helper: "Start fresh", href: recipeCollectionHref("breakfast"), icon: Coffee },
    { label: "Lunch", helper: "Midday ideas", href: recipeCollectionHref("lunch"), icon: Sun },
    { label: "Dinner", helper: "Tonight's table", href: recipeCollectionHref("dinner"), icon: UtensilsCrossed },
  ];

  return (
    <div>
      <AccountPageHeading
        eyebrow="Kitchen dashboard"
        title={`Hello, ${firstName}`}
        description="Your meal planning space, saved dishes and food choices together in one calm place."
      />

      <section className="relative mb-5 overflow-hidden rounded-[1.8rem] border border-[#e6d5be] bg-[#3c241a] p-6 text-white shadow-[0_24px_52px_-36px_rgba(47,27,16,0.62)] dark:border-white/10 dark:bg-[#142820] sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_84%_18%,rgba(234,184,105,0.33),transparent_32%),linear-gradient(115deg,rgba(192,54,40,0.34),transparent_48%)]" />
        <div className="relative grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-[#f7e6ca]">
              <ChefHat className="size-3.5" />
              {currentPlan && currentPlan !== "Freemium"
                ? `${currentPlan} membership active`
                : user?.isPersonalised
                  ? "Your choices are ready"
                  : "Set your everyday choices"}
            </div>
            <h2 className="max-w-lg text-2xl font-semibold leading-tight sm:text-3xl">
              {currentPlan && currentPlan !== "Freemium"
                ? "Keep your planned meals shaped around your table."
                : "Plan seven days of meals made for your table."}
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-white/70">
              Food style, cuisines, exclusions and cooking comfort only. No medical profiling.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
            <Link
              href={planDestination}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#c33b2d] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#ae3023]"
            >
              <CalendarDays className="size-4" />
              {user?.isPersonalised ? "View meal plan" : "Create meal plan"}
            </Link>
            <Link
              href="/meal-plan/create"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/22 bg-white/8 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/14"
            >
              <SlidersHorizontal className="size-4" />
              {user?.isPersonalised ? "Edit choices" : "Create choices"}
            </Link>
          </div>
        </div>
      </section>

      <div className="mb-5 grid gap-5 xl:grid-cols-[1fr_1.35fr]">
        <section className="rounded-[1.7rem] border border-[#eadcc9] bg-[#fffdf8] p-5 dark:border-white/10 dark:bg-[#10231c] sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a67853] dark:text-[#d0ae76]">Your table</p>
              <h2 className="mt-1 text-lg font-semibold text-[#33251d] dark:text-[#f1ede6]">Choice snapshot</h2>
            </div>
            <Sparkles className="size-5 text-[#bd382a] dark:text-[#dcb270]" />
          </div>
          <div className="space-y-3">
            <TasteRow label="Food style" value={user?.foodPreference || "Set your style"} />
            <TasteRow label="Cooking comfort" value={user?.cookingSkill || "Set your comfort"} />
            <TasteRow
              label="Access"
              value={
                currentPlan
                  ? `${currentPlan}${currentPlanEndDate ? ` through ${new Date(currentPlanEndDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : ""}`
                  : "No active plan"
              }
            />
          </div>
          <Link href="/user/preferences" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#b53527] dark:text-[#e3bb73]">
            See all choices <ArrowRight className="size-4" />
          </Link>
        </section>

        <section className="rounded-[1.7rem] border border-[#eadcc9] bg-[#fffdf8] p-5 dark:border-white/10 dark:bg-[#10231c] sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a67853] dark:text-[#d0ae76]">Browse by moment</p>
          <h2 className="mb-5 mt-1 text-lg font-semibold text-[#33251d] dark:text-[#f1ede6]">What are you cooking next?</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {discoveryLinks.map(({ label, helper, href, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                className="group rounded-2xl border border-[#efe1d0] bg-[#fcf7ee] p-4 transition hover:border-[#e2c499] hover:bg-[#faf0e2] dark:border-white/[0.08] dark:bg-[#172d25] dark:hover:border-[#345347]"
              >
                <Icon className="mb-4 size-5 text-[#bd382a] dark:text-[#dfb371]" />
                <p className="font-semibold text-[#35271f] dark:text-[#f1ece5]">{label}</p>
                <p className="mt-1 text-xs text-[#817063] dark:text-[#a9b9af]">{helper}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <section className="mb-5 grid gap-3 sm:grid-cols-3">
        {activityTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveActivity(tab.key)}
              className={cn(
                "flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-4 text-left transition",
                activeActivity === tab.key
                  ? "border-[#c43a2a] bg-[#fff2ec] text-[#3a291f] dark:border-[#b94a39] dark:bg-[#1b342c] dark:text-[#f5f0e7]"
                  : "border-[#eadcc9] bg-[#fffdf8] text-[#655448] hover:border-[#dec8ac] dark:border-white/10 dark:bg-[#10231c] dark:text-[#c2cec8]",
              )}
            >
              <span className="flex items-center gap-3">
                <Icon className="size-4 text-[#bd382a] dark:text-[#dab16e]" />
                <span className="text-sm font-medium">{tab.label}</span>
              </span>
              {loading ? <Skeleton className="h-5 w-7 rounded-full" /> : <span className="text-sm font-semibold">{tab.count}</span>}
            </button>
          );
        })}
      </section>

      <section className="mb-5 rounded-[1.8rem] border border-[#eadcc9] bg-[#fffdf8] p-4 dark:border-white/10 dark:bg-[#10231c] sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a67853] dark:text-[#d0ae76]">Recipe activity</p>
            <h2 className="mt-1 text-xl font-semibold text-[#33251d] dark:text-[#f1ede6]">
              {activityTabs.find((tab) => tab.key === activeActivity)?.label}
            </h2>
          </div>
          <Link href="/recipes" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#b53527] dark:text-[#e4bb74]">
            Explore recipes <ArrowRight className="size-4" />
          </Link>
        </div>
        {loading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((item) => <Skeleton key={item} className="h-[286px] rounded-[1.4rem]" />)}
          </div>
        ) : activeRecipes.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-3">
            {activeRecipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} />)}
          </div>
        ) : (
          <div className="flex flex-col items-center rounded-[1.4rem] bg-[#faf3e9] px-5 py-11 text-center dark:bg-[#152a23]">
            <BookHeart className="mb-4 size-8 text-[#c14a37] dark:text-[#d7ae70]" />
            <p className="font-semibold text-[#36271e] dark:text-[#f1ede7]">Nothing here yet</p>
            <p className="mt-1 max-w-sm text-sm text-[#78685d] dark:text-[#a9b9af]">
              Discover dishes and save the ones you would enjoy seeing again.
            </p>
          </div>
        )}
      </section>

      <section className="rounded-[1.8rem] border border-[#eadcc9] bg-[#fffdf8] p-4 dark:border-white/10 dark:bg-[#10231c] sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a67853] dark:text-[#d0ae76]">Discover</p>
            <h2 className="mt-1 text-xl font-semibold text-[#33251d] dark:text-[#f1ede6]">Trending in the kitchen</h2>
          </div>
          <Link href="/recipes" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#b53527] dark:text-[#e4bb74]">
            View all <ArrowRight className="size-4" />
          </Link>
        </div>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-[280px] rounded-[1.4rem]" />)}
          </div>
        ) : popularRecipes.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {popularRecipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} />)}
          </div>
        ) : (
          <p className="rounded-2xl bg-[#faf3e9] p-5 text-sm text-[#78685d] dark:bg-[#152a23] dark:text-[#a9b9af]">New recipe inspiration will appear here.</p>
        )}
      </section>
    </div>
  );
};

const TasteRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-3 rounded-xl bg-[#faf3e9] px-4 py-3 text-sm dark:bg-[#172d25]">
    <span className="text-[#7a695d] dark:text-[#aab9af]">{label}</span>
    <span className="max-w-[55%] truncate font-semibold text-[#392a20] dark:text-[#f0eae3]">{value}</span>
  </div>
);

export default UserDashboard;
