import type { Prisma } from "@prisma/client";

export type ManagedUser = Prisma.UserGetPayload<{
  include: {
    foodPreference: true;
    cookingSkill: true;
    userCuisines: { include: { cuisine: true } };
    UserAllrgies: { include: { allergy: true } };
    UserPlan: { include: { plan: true } };
    UserMealPlan: true;
    Order: true;
    _count: {
      select: {
        Favorite: true;
        Review: true;
        Comment: true;
        RecipeReaction: true;
      };
    };
  };
}>;

export type UserAdminOptions = {
  plans: Array<{
    id: string;
    name: string;
    durationDays: number | null;
    isPublished: boolean;
  }>;
  foodPreferences: Array<{
    id: string;
    name: string;
  }>;
  cookingSkills: Array<{
    id: string;
    title: string;
  }>;
  cuisines: Array<{
    id: string;
    title: string;
    imageUrl: string | null;
  }>;
  allergies: Array<{
    id: string;
    title: string;
    imageUrl: string | null;
  }>;
};
