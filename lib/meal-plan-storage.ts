import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { hydrateMealPlanRecipes } from "@/lib/hydrate-meal-plan-recipes";
import type { MealPlanRoutineSlot } from "@/lib/meal-plan-routine";
import type { RecipeWithCategory } from "@/types/recipe";

type StoredMealPlanRecipe = RecipeWithCategory | { recipeId: string };

type StoredMealPlanDocument = {
  version?: number;
  mealsByTime?: Record<string, StoredMealPlanRecipe[]>;
  routineSlots?: MealPlanRoutineSlot[];
};

type S3LookupError = Error & {
  $metadata?: { httpStatusCode?: number };
};

function getPrivateMealPlanStorage() {
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const bucket = process.env.AWS_PRIVATE_BUCKET_NAME;

  if (!region || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error("Private meal-plan storage is not configured.");
  }

  return {
    bucket,
    client: new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    }),
  };
}

export async function getStoredMealPlanDocument(
  userId: string,
  date: string,
): Promise<StoredMealPlanDocument | null> {
  try {
    const storage = getPrivateMealPlanStorage();
    const object = await storage.client.send(
      new GetObjectCommand({
        Bucket: storage.bucket,
        Key: `usersMealPlans/${userId}/${date}/diet.json`,
      }),
    );
    const json = await object.Body?.transformToString();
    if (!json) return null;
    return JSON.parse(json) as StoredMealPlanDocument;
  } catch (error) {
    const s3Error = error as S3LookupError;
    if (
      s3Error.name === "NoSuchKey" ||
      s3Error.$metadata?.httpStatusCode === 404
    ) {
      return null;
    }
    throw error;
  }
}

export async function loadStoredMealPlanDay(userId: string, date: string) {
  const document = await getStoredMealPlanDocument(userId, date);
  if (!document) return null;

  return {
    mealsByTime: await hydrateMealPlanRecipes(document.mealsByTime ?? {}),
    routineSlots: document.routineSlots,
  };
}
