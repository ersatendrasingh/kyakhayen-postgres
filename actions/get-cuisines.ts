import { db } from "@/lib/db";

type Cuisine = {
  id: string;
  title: string;
  slug: string;
  imageUrl: string | null;
};

type getCuisinesInput = {
  userId: string;
};

export const getCuisines = async ({
  userId,
}: getCuisinesInput): Promise<Cuisine[]> => {
  try {
    // Fetch all cuisines from the database
    const allCuisines = await db.cuisines.findMany({
      where: { isPublished: true },
      orderBy: [{ position: "asc" }, { title: "asc" }],
    });

    // Fetch the user's cuisines
    const userCuisines = await db.userCuisines.findMany({
      where: {
        userId,
      },
      select: {
        cuisineId: true,
      },
    });

    // Extract cuisine IDs associated with the user
    const userCuisineIds = userCuisines.map(
      (userCuisine) => userCuisine.cuisineId
    );

    // Filter out cuisines that are already associated with the user
    const filteredCuisines = allCuisines.filter(
      (cuisine) => !userCuisineIds.includes(cuisine.id)
    );

    return filteredCuisines;
  } catch (error) {
    console.error("[GET_CUISINES]", error);
    return [];
  }
};
