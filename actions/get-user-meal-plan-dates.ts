"use server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

interface UserPlanDates {
  startDate: Date;
  endDate: Date;
}

export const getUserLatestPlanDates = async (): Promise<UserPlanDates> => {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error("User not found.");
    }

    const userId = user.id;

    // Fetch user's latest meal plan dates
    const latestUserMealPlan = await db.userMealPlan.findFirst({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc", // Fetch the latest plan by end date descending
      },
    });

    if (!latestUserMealPlan) {
      throw new Error(`Meal plan not found for user with ID ${userId}.`);
    }

    // Extract startDate and endDate as single Date objects
    const startDate = latestUserMealPlan.planStartDate;
    const endDate = latestUserMealPlan.planEndDate;

    return {
      startDate,
      endDate,
    };
  } catch (error) {
    console.error("Error fetching user's latest meal plan:", error);
    throw error;
  }
};
