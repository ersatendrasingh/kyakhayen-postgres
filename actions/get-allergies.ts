import { db } from "@/lib/db";

type Allergy = {
  id: string;
  title: string;
  slug: string;
  imageUrl: string | null;
};

type getAllergiesInput = {
  userId: string;
};

export const getAllergies = async ({
  userId,
}: getAllergiesInput): Promise<Allergy[]> => {
  try {
    const allAllergies = await db.allergies.findMany({
      where: {
        isPublished: true,
      },
      orderBy: {
        position: "asc",
      },
    });

    const userAllergies = await db.userAllrgies.findMany({
      where: {
        userId,
      },
      select: {
        allergyId: true,
      },
    });

    const userAllergyIds = userAllergies.map(
      (userAllergy) => userAllergy.allergyId
    );

    const filteredAllergies = allAllergies.filter(
      (allergy) => !userAllergyIds.includes(allergy.id)
    );

    return filteredAllergies;
  } catch (error) {
    console.error("[GET_ALLERGIES]", error);
    return [];
  }
};
