import { NextResponse } from "next/server";
import { z } from "zod";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

const preferencesSchema = z.object({
  foodPreferenceId: z.string().nullable(),
  cookingSkillId: z.string().nullable(),
  cuisineIds: z.array(z.string()),
  allergyIds: z.array(z.string()),
});

export async function PATCH(
  request: Request,
  props: { params: Promise<{ userId: string }> },
) {
  const admin = await currentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json("Unauthorized", { status: 401 });
  }

  try {
    const { userId } = await props.params;
    const parsed = preferencesSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json("Invalid customer preference selection.", { status: 400 });
    }

    const input = parsed.data;
    await db.$transaction(async (transaction) => {
      await transaction.userCuisines.deleteMany({ where: { userId } });
      await transaction.userAllrgies.deleteMany({ where: { userId } });

      if (input.cuisineIds.length) {
        await transaction.userCuisines.createMany({
          data: [...new Set(input.cuisineIds)].map((cuisineId) => ({ userId, cuisineId })),
        });
      }
      if (input.allergyIds.length) {
        await transaction.userAllrgies.createMany({
          data: [...new Set(input.allergyIds)].map((allergyId) => ({ userId, allergyId })),
        });
      }

      await transaction.user.update({
        where: { id: userId },
        data: {
          foodPreferenceId: input.foodPreferenceId,
          cookingSkillId: input.cookingSkillId,
          isPersonalised: Boolean(
            input.foodPreferenceId && input.cookingSkillId && input.cuisineIds.length,
          ),
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.log("[ADMIN_USER_PREFERENCES_UPDATE]", error);
    return NextResponse.json("Unable to update customer choices.", { status: 500 });
  }
}
