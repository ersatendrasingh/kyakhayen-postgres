import { db } from "@/lib/db";

export const getUserByEmail = async (email: string) => {
  try {
    const user = await db.user.findUnique({ where: { email } });

    return user;
  } catch {
    return null;
  }
};

export const getUserByPhone = async (phoneNumber: string) => {
  try {
    const user = await db.user.findUnique({ where: { phoneNumber } });

    return user;
  } catch {
    return null;
  }
};

export const getUserById = async (id: string) => {
  try {
    const user = await db.user.findUnique({
      where: { id },
      include: {
        gender: true,
        foodPreference: true,
        cookingSkill: true,
        UserPlan: {
          where: {
            endDate: {
              gte: new Date(), // Only include plans where the end date is greater than or equal to the current date
            },
          },
          orderBy: {
            endDate: "desc",
          },
          include: {
            plan: true,
          },
        },
      },
    });

    return user;
  } catch {
    return null;
  }
};
