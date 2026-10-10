import { db } from "@/lib/db";

interface UserPlan {
  id: string;
  userId: string;
  planId: string;
  startDate: Date;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function assignPlanToUser(
  userId: string,
  planId: string,
  startDate: Date,
  endDate: Date | null
): Promise<UserPlan> {
  try {
    const userPlan = await db.userPlan.create({
      data: {
        userId,
        planId,
        startDate,
        endDate,
      },
    });

    console.log(`Assigned plan ${planId} to user ${userId}:`, userPlan);
    return userPlan;
  } catch (error) {
    console.error("Error assigning plan to user:", error);
    throw error;
  }
}
