import { db } from "@/lib/db";

type CookingSkill = {
  id: string;
  title: string;
  imageUrl: string | null;
  position: number | null;
};

type getCookingSkillsInput = {
  userId: string;
};

export const getCookingSkills = async ({
  userId,
}: getCookingSkillsInput): Promise<CookingSkill[]> => {
  try {
    const allCookingSkills = await db.recipeDifficulty.findMany();

    const userCookingSkill = await db.user.findFirst({
      where: {
        id: userId,
      },
      select: {
        cookingSkillId: true,
      },
    });

    const filteredCookingSkills = allCookingSkills.filter(
      (cookingSkill) => userCookingSkill?.cookingSkillId !== cookingSkill.id
    );

    return filteredCookingSkills;
  } catch (error) {
    console.error("[GET_FOOD_PREFERENCES]", error);
    return [];
  }
};
