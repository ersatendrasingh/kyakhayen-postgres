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

    const { newAllergy, removeAllOthers } = await req.json();
    const exclusion = await db.allergies.findFirst({
      where: { id: newAllergy?.id, isPublished: true },
    });
    if (!exclusion) {
      return NextResponse.json("Exclusion not found", { status: 404 });
    }

    if (removeAllOthers) {
      await db.userAllrgies.deleteMany({ where: { userId: user.id } });
    } else {
      const none = await db.allergies.findFirst({ where: { title: "None" } });
      if (none) {
        await db.userAllrgies.deleteMany({
          where: { userId: user.id, allergyId: none.id },
        });
      }
    }

    await db.userAllrgies.upsert({
      where: {
        userId_allergyId: { userId: user.id, allergyId: exclusion.id },
      },
      update: {},
      create: { userId: user.id, allergyId: exclusion.id },
    });
    await regenerateIfReady(user.id);
    return NextResponse.json("Exclusion saved", { status: 200 });
  } catch (error) {
    console.error("[ADD_EXCLUSION]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json("Unauthorized", { status: 401 });

    const { allergyId } = await req.json();
    await db.userAllrgies.deleteMany({
      where: { userId: user.id, allergyId },
    });
    await regenerateIfReady(user.id);
    return NextResponse.json("Exclusion removed", { status: 200 });
  } catch (error) {
    console.error("[DELETE_EXCLUSION]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
