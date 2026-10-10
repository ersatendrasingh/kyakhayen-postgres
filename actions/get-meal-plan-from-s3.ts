"use server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { RecipeWithCategory } from "@/types/recipe";
import { MealTimes } from "@prisma/client";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { hydrateMealPlanRecipes } from "@/lib/hydrate-meal-plan-recipes";
import {
  buildFallbackRoutineSlots,
  mealRoutineKeyFromMealTime,
  sortByMealRoutine,
  type MealPlanRoutineSlot,
} from "@/lib/meal-plan-routine";

type GetMealPlanParams = {
  date: string; // Corrected to lowercase 'string'
};

type MealPlanResult = {
  mealTimes: MealTimes[];
  mealsByTime: { [key: string]: RecipeWithCategory[] };
  routineSlots: MealPlanRoutineSlot[];
};

type StoredMealPlanRecipe = RecipeWithCategory | { recipeId: string };

type S3LookupError = Error & {
  $metadata?: { httpStatusCode?: number };
};

const legacyEarlyMorningRejectPattern =
  /\b(juice|shake|smoothie|milkshake|frappe|lassi|sherbet|sharbat)\b/i;
const legacyBreakfastRejectPattern =
  /\b(juice|shake|smoothie|milkshake|frappe|lassi|sherbet|sharbat|water)\b/i;

const getS3Client = () => {
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const bucket = process.env.AWS_PRIVATE_BUCKET_NAME;

  if (!region || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error("AWS private meal-plan storage is not configured.");
  }

  return new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });
};

function deterministicIndex(value: string, length: number) {
  const total = value
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return total % length;
}

async function fallbackMorningHydrationRecipe(date: string) {
  const recipes = await db.recipes.findMany({
    where: {
      isPublished: true,
      recipeMealTime: {
        some: {
          mealTime: {
            slug: "early-morning",
          },
        },
      },
      recipeRecipeType: {
        some: {
          recipeType: {
            slug: "morning-hydration",
          },
        },
      },
    },
    orderBy: { title: "asc" },
    select: {
      id: true,
      title: true,
      slug: true,
      metaSlug: true,
      imageUrl: true,
      RecipeCategories: true,
      recipeCookingTime: true,
      recipeRecipeType: {
        take: 1,
        include: { recipeType: true },
      },
      recipeNutrient: {
        take: 1,
        include: { nutrient: true },
      },
    },
  });

  if (recipes.length === 0) return null;
  return recipes[deterministicIndex(date, recipes.length)] as unknown as RecipeWithCategory;
}

async function sanitizeEarlyMorningMeals(params: {
  date: string;
  mealTimes: MealTimes[];
  mealsByTime: Record<string, RecipeWithCategory[]>;
}) {
  const earlyMorningSlugs = params.mealTimes
    .filter((mealTime) => mealRoutineKeyFromMealTime(mealTime) === "early-morning")
    .map((mealTime) => mealTime.slug);

  if (earlyMorningSlugs.length === 0) return params.mealsByTime;

  let fallbackRecipe: RecipeWithCategory | null = null;
  const sanitizedMealsByTime = { ...params.mealsByTime };

  for (const slug of earlyMorningSlugs) {
    const recipes = sanitizedMealsByTime[slug] ?? [];
    const hasLegacyDrink = recipes.some((recipe) =>
      legacyEarlyMorningRejectPattern.test(recipe.title || ""),
    );

    if (recipes.length > 0 && !hasLegacyDrink) continue;

    fallbackRecipe ||= await fallbackMorningHydrationRecipe(params.date);
    sanitizedMealsByTime[slug] = fallbackRecipe ? [fallbackRecipe] : [];
  }

  return sanitizedMealsByTime;
}

function sanitizeLegacyBreakfastMeals(params: {
  mealTimes: MealTimes[];
  mealsByTime: Record<string, RecipeWithCategory[]>;
}) {
  const breakfastSlugs = params.mealTimes
    .filter((mealTime) => mealRoutineKeyFromMealTime(mealTime) === "breakfast")
    .map((mealTime) => mealTime.slug);

  if (breakfastSlugs.length === 0) return params.mealsByTime;

  const sanitizedMealsByTime = { ...params.mealsByTime };

  for (const slug of breakfastSlugs) {
    sanitizedMealsByTime[slug] = (sanitizedMealsByTime[slug] ?? []).filter(
      (recipe) => !legacyBreakfastRejectPattern.test(recipe.title || ""),
    );
  }

  return sanitizedMealsByTime;
}

export const getMealPlanFromS3 = async ({
  date,
}: GetMealPlanParams): Promise<MealPlanResult | null> => {
  const user = await currentUser();

  try {
    // Get all meal times
    const mealTimes = await db.mealTimes.findMany({
      where: { isPublished: true },
    });
    const sortedMealTimes = sortByMealRoutine(mealTimes);

    // Construct the S3 key based on the date
    const dateFromClient = new Date(date);

    const formattedDate = dateFromClient.toISOString().split("T")[0];
    const s3Key = `usersMealPlans/${user?.id}/${formattedDate}/diet.json`;

    // Retrieve meal plan from S3
    const params = {
      Bucket: process.env.AWS_PRIVATE_BUCKET_NAME as string,
      Key: s3Key,
    };
    const command = new GetObjectCommand(params);
    const response = await getS3Client().send(command);

    // Read the content of the object from S3
    const stream = response.Body as Readable;

    // Convert the stream to a buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks).toString("utf-8");

    // Parse the JSON content
    const {
      version = 1,
      mealsByTime = {},
      routineSlots,
    } = JSON.parse(body) as {
      version?: number;
      mealsByTime?: Record<string, StoredMealPlanRecipe[]>;
      routineSlots?: MealPlanRoutineSlot[];
    };
    const hydratedMealsByTime = sanitizeLegacyBreakfastMeals({
      mealTimes: sortedMealTimes,
      mealsByTime: await sanitizeEarlyMorningMeals({
        date: formattedDate,
        mealTimes: sortedMealTimes,
        mealsByTime: await hydrateMealPlanRecipes(mealsByTime),
      }),
    });

    // Preserve the saved selections, but render current recipe titles, media and URLs.
    return {
      mealTimes: sortedMealTimes,
      mealsByTime: hydratedMealsByTime,
      routineSlots:
        version >= 3 && routineSlots?.length
          ? routineSlots
          : buildFallbackRoutineSlots({
              mealTimes: sortedMealTimes,
              mealsByTime: hydratedMealsByTime,
            }),
    };
  } catch (error) {
    const s3Error = error as S3LookupError;
    if (
      s3Error.name === "NoSuchKey" ||
      s3Error.$metadata?.httpStatusCode === 404
    ) {
      return null;
    }

    console.error("[GET_MEAL_PLAN_FROM_S3]", error);
    throw new Error("Your saved meal plan could not be opened right now.");
  }
};
