import { db } from "@/lib/db";

type Gender = {
  id: string;
  title: string;
  imageUrl: string | null;
  position: number | null;
};

type getGenderInput = {
  userId: string;
};

export const getGender = async ({
  userId,
}: getGenderInput): Promise<Gender[]> => {
  try {
    const allGenders = await db.gender.findMany();

    const userGender = await db.user.findFirst({
      where: {
        id: userId,
      },
      select: {
        genderId: true,
      },
    });

    const filteredGenders = allGenders.filter(
      (gender) => userGender?.genderId !== gender.id
    );

    return filteredGenders;
  } catch (error) {
    console.error("[GET_GENDER]", error);
    return [];
  }
};
