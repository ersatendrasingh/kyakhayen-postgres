import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isPersonalizationComplete } from "@/lib/personalization";
import { getMealPlanQueue } from "@/lib/meal-plan-queue";

export async function PATCH(req: Request) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json("Unauthorized", { status: 401 });

    const body = await req.json();
    const foodPreferenceId =
      typeof body.foodPreferences === "string" ? body.foodPreferences : null;
    const cookingSkillId =
      typeof body.cookingSkill === "string" ? body.cookingSkill : null;
    const rawCuisineIds: unknown[] = Array.isArray(body.cuisines)
      ? body.cuisines
      : [];
    const rawAllergyIds: unknown[] = Array.isArray(body.allergies)
      ? body.allergies
      : [];
    const cuisineIds: string[] = [
      ...new Set(
        rawCuisineIds.filter((id): id is string => typeof id === "string"),
      ),
    ];
    const allergyIds: string[] = [
      ...new Set(
        rawAllergyIds.filter((id): id is string => typeof id === "string"),
      ),
    ];

    if (!foodPreferenceId || !cookingSkillId || cuisineIds.length === 0) {
      return NextResponse.json("Incomplete meal plan preferences", {
        status: 400,
      });
    }

    const [foodPreference, cookingSkill, validCuisines, validAllergies] =
      await Promise.all([
        db.recipeCategories.findFirst({
          where: { id: foodPreferenceId, isPublished: true, slug: { not: "desserts" } },
        }),
        db.recipeDifficulty.findUnique({ where: { id: cookingSkillId } }),
        db.cuisines.findMany({
          where: { id: { in: cuisineIds }, isPublished: true },
          select: { id: true },
        }),
        db.allergies.findMany({
          where: { id: { in: allergyIds }, isPublished: true },
          select: { id: true },
        }),
      ]);

    if (
      !foodPreference ||
      !cookingSkill ||
      validCuisines.length !== cuisineIds.length ||
      validAllergies.length !== allergyIds.length
    ) {
      return NextResponse.json("Invalid meal plan preferences", {
        status: 400,
      });
    }

    const updatedUser = await db.$transaction(async (transaction) => {
      await transaction.userCuisines.deleteMany({ where: { userId: user.id } });
      await transaction.userAllrgies.deleteMany({ where: { userId: user.id } });
      await transaction.userCuisines.createMany({
        data: cuisineIds.map((cuisineId) => ({ userId: user.id, cuisineId })),
      });
      if (allergyIds.length > 0) {
        await transaction.userAllrgies.createMany({
          data: allergyIds.map((allergyId) => ({ userId: user.id, allergyId })),
        });
      }
      return transaction.user.update({
        where: { id: user.id },
        data: { foodPreferenceId, cookingSkillId },
        include: {
          userCuisines: true,
          UserAllrgies: true,
        },
      });
    });

    const isPersonalised = isPersonalizationComplete(updatedUser);
    const savedUser = await db.user.update({
      where: { id: user.id },
      data: { isPersonalised },
    });

    let generationJobId: string | undefined;
    if (isPersonalised) {
      const mealPlanQueue = getMealPlanQueue();
      const generationJob = await mealPlanQueue.add(
        "generateMealPlan",
        { userId: user.id },
        { removeOnComplete: 50, removeOnFail: 50 },
      );
      generationJobId = generationJob.id;
      await mealPlanQueue.close();
    }

    return NextResponse.json({ ...savedUser, generationJobId }, { status: 200 });
  } catch (error) {
    console.log("[USER_PERSONALISATION]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
