import { NotificationAutomationTrigger } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { loadStoredMealPlanDay } from "@/lib/meal-plan-storage";
import { runUserAutomationRules } from "@/lib/notification-automations";
import { recipeHref } from "@/lib/seo";
import type { RecipeWithCategory } from "@/types/recipe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const requestSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("mealReminder"),
    userId: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    meal: z.string().min(1),
  }),
  z.object({
    kind: z.literal("membershipExpiryReminder"),
    userId: z.string().min(1),
    assignmentId: z.string().min(1),
    label: z.string().min(1),
  }),
]);

function normalizedMeal(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function recipePath(recipe: Pick<RecipeWithCategory, "slug" | "metaSlug">) {
  return recipeHref(recipe).replace(/^\//, "");
}

function fallbackRecipeTitle(meal: string) {
  const normalized = normalizedMeal(meal);
  if (normalized.includes("breakfast")) return "your breakfast recipe";
  if (normalized.includes("lunch")) return "your lunch recipe";
  if (normalized.includes("dinner")) return "your dinner recipe";
  return "your planned recipe";
}

function findMealRecipe(
  mealsByTime: Record<string, RecipeWithCategory[]>,
  meal: string,
) {
  const target = normalizedMeal(meal);
  const directRecipes = Object.entries(mealsByTime).flatMap(([mealTime, recipes]) => {
    const mealTimeKey = normalizedMeal(mealTime);
    return mealTimeKey.includes(target) || target.includes(mealTimeKey)
      ? recipes
      : [];
  });
  if (directRecipes.length > 0) return directRecipes[0];

  return null;
}

export async function POST(request: Request) {
  const workerSecret =
    process.env.MEAL_PLAN_WORKER_SECRET ||
    (process.env.NODE_ENV !== "production" ? "local-meal-plan-worker" : "");
  if (!workerSecret || request.headers.get("x-meal-plan-worker-secret") !== workerSecret) {
    return NextResponse.json("Unauthorized", { status: 401 });
  }
  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json("Invalid automation request.", { status: 400 });
  const input = parsed.data;

  if (input.kind === "mealReminder") {
    const planDate = new Date(`${input.date}T00:00:00.000Z`);
    const exists = await db.userMealPlan.findFirst({
      where: { userId: input.userId, planStartDate: { lte: planDate }, planEndDate: { gte: planDate } },
      select: { id: true },
    });
    if (!exists) return NextResponse.json({ skipped: true, reason: "Meal plan no longer active." });
    let recipe: RecipeWithCategory | null = null;
    try {
      const storedDay = await loadStoredMealPlanDay(input.userId, input.date);
      recipe = storedDay ? findMealRecipe(storedDay.mealsByTime, input.meal) : null;
    } catch (error) {
      console.error("[MEAL_REMINDER_RECIPE_LOOKUP]", error);
    }
    const executed = await runUserAutomationRules({
      trigger: NotificationAutomationTrigger.MEAL_REMINDER,
      userId: input.userId,
      tokens: {
        meal: input.meal,
        recipeTitle: recipe?.title || fallbackRecipeTitle(input.meal),
        recipePath: recipe ? recipePath(recipe) : "meal-plan",
      },
      imageUrl: recipe?.imageUrl,
      dedupeScope: `meal-reminder-${input.userId}-${input.date}-${input.meal.toLowerCase()}`,
    });
    return NextResponse.json({ sent: executed > 0, executed });
  }

  const assignment = await db.userPlan.findFirst({
    where: { id: input.assignmentId, userId: input.userId, endDate: { not: null } },
    include: { plan: { select: { name: true } } },
  });
  if (!assignment) return NextResponse.json({ skipped: true, reason: "Membership no longer exists." });
  const executed = await runUserAutomationRules({
    trigger: NotificationAutomationTrigger.MEMBERSHIP_EXPIRY,
    userId: input.userId,
    tokens: {
      planName: assignment.plan.name,
      expiryTiming: input.label,
      expiryAction: input.label === "today" ? "ends today" : "expires in 3 days",
    },
    dedupeScope: `membership-expiry-${assignment.id}-${input.label}`,
  });
  return NextResponse.json({ sent: executed > 0, executed });
}
