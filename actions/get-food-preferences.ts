import { db } from "@/lib/db";

type FoodPreference = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  position: number | null;
};

type getFoodPreferencesInput = {
  userId: string;
};

export const getFoodPreferences = async ({
  userId,
}: getFoodPreferencesInput): Promise<FoodPreference[]> => {
  try {
    const allFoodPreferences = await db.recipeCategories.findMany({
      where: { isPublished: true, slug: { not: "desserts" } },
      orderBy: [{ position: "asc" }, { name: "asc" }],
    });

    const userFoodPreference = await db.user.findFirst({
      where: {
        id: userId,
      },
      select: {
        foodPreferenceId: true,
      },
    });

    const filteredFoodPreferences = allFoodPreferences.filter(
      (foodPreference) =>
        userFoodPreference?.foodPreferenceId !== foodPreference.id
    );

    return filteredFoodPreferences;
  } catch (error) {
    console.error("[GET_FOOD_PREFERENCES]", error);
    return [];
  }
};
