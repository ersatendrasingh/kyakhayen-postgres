import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getMealPlanQueue } from "@/lib/meal-plan-queue";
import { isPersonalizationComplete } from "@/lib/personalization";

async function regenerateIfReady(userId: string) {
  const updatedUser = await db.user.findUnique({
    where: { id: userId },
    include: { userCuisines: true, UserAllrgies: true },
  });
  const isPersonalised = isPersonalizationComplete(updatedUser);
  await db.user.update({ where: { id: userId }, data: { isPersonalised } });
  if (isPersonalised) {
    const mealPlanQueue = getMealPlanQueue();
    await mealPlanQueue.add("generateMealPlan", { userId });
    await mealPlanQueue.close();
  }
}

export async function PUT(req: Request) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json("Unauthorized", { status: 401 });

    const { newCuisine } = await req.json();
    const cuisine = await db.cuisines.findFirst({
      where: { id: newCuisine?.id, isPublished: true },
    });
    if (!cuisine) return NextResponse.json("Cuisine not found", { status: 404 });

    await db.userCuisines.upsert({
      where: { userId_cuisineId: { userId: user.id, cuisineId: cuisine.id } },
      update: {},
      create: { userId: user.id, cuisineId: cuisine.id },
    });
    await regenerateIfReady(user.id);
    return NextResponse.json("Cuisine saved", { status: 200 });
  } catch (error) {
    console.error("[ADD_CUISINE]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json("Unauthorized", { status: 401 });

    const { cuisineId } = await req.json();
    await db.userCuisines.deleteMany({
      where: { userId: user.id, cuisineId },
    });
    await regenerateIfReady(user.id);
    return NextResponse.json("Cuisine removed", { status: 200 });
  } catch (error) {
    console.error("[DELETE_CUISINE]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
