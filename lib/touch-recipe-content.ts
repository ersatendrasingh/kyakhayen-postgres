import { db } from "@/lib/db";

export async function touchRecipeContentUpdatedAt(recipeId: string, at = new Date()) {
  await db.recipes.updateMany({
    where: { id: recipeId },
    data: { contentUpdatedAt: at },
  });
}
