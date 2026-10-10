import { Season } from "@/types/season";
import { db } from "@/lib/db";
import { seasonMonthRange } from "@/lib/season-utils";

export const getSeasonById = async (
  seasonId: string
): Promise<Season | null> => {
  try {
    const season = await db.recipeSeasons.findUnique({
      where: { id: seasonId },
    });
    if (!season) return null;

    const { startMonth, endMonth } = seasonMonthRange(season.title);

    return {
      id: season.id,
      title: season.title,
      startMonth,
      endMonth,
    };
  } catch (error) {
    console.error(
      `[getSeasonById] Error fetching season with ID ${seasonId}:`,
      error
    );
    throw error;
  }
};
