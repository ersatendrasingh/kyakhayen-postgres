import { notFound } from "next/navigation";

import { RecipeEditor } from "@/components/admin/recipes/editor/recipe-editor";
import type { RecipeEditorOptions } from "@/components/admin/recipes/editor/recipe-editor-types";
import { db } from "@/lib/db";

const RecipeIdPage = async (props: { params: Promise<{ recipeId: string }> }) => {
  const { recipeId } = await props.params;

  const [
    recipe,
    categories,
    ingredients,
    forms,
    units,
    difficulties,
    seasons,
    cuisines,
    cookingMethods,
    allergies,
    mealTimes,
    nutrients,
    dietTypes,
    recipeTypes,
    bodyTypes,
  ] = await Promise.all([
    db.recipes.findUnique({
      where: { id: recipeId },
      include: {
        recipeIngredients: {
          include: { ingredient: true, unit: true, ingredientForm: true },
          orderBy: { position: "asc" },
        },
        recipeMethods: { orderBy: { position: "asc" } },
        recipeCookingTime: true,
        recipeCuisine: { select: { cuisineId: true } },
        recipeCookingMethods: { select: { cookingMethodId: true } },
        recipeAllergies: { select: { allergyId: true } },
        recipeMealTime: { select: { mealTimeId: true } },
        recipeNutrient: { select: { nutrientId: true } },
        recipeDietType: { select: { dietTypeId: true } },
        recipeRecipeType: { select: { recipeTypeId: true } },
        recipeBodyTypes: { select: { bodyTypeId: true } },
        recipeSeasonTags: { select: { recipeSeasonsId: true } },
      },
    }),
    db.recipeCategories.findMany({ orderBy: [{ position: "asc" }, { name: "asc" }] }),
    db.ingredients.findMany({
      where: { isPublished: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.ingredientsForm.findMany({ orderBy: [{ position: "asc" }, { name: "asc" }] }),
    db.units.findMany({ orderBy: [{ position: "asc" }, { title: "asc" }] }),
    db.recipeDifficulty.findMany({ orderBy: [{ position: "asc" }, { title: "asc" }] }),
    db.recipeSeasons.findMany({ orderBy: { title: "asc" } }),
    db.cuisines.findMany({ orderBy: [{ position: "asc" }, { title: "asc" }] }),
    db.cookingMethods.findMany({ orderBy: [{ position: "asc" }, { title: "asc" }] }),
    db.allergies.findMany({ orderBy: [{ position: "asc" }, { title: "asc" }] }),
    db.mealTimes.findMany({ orderBy: [{ position: "asc" }, { title: "asc" }] }),
    db.nutrient.findMany({ orderBy: [{ position: "asc" }, { title: "asc" }] }),
    db.dietTypes.findMany({ orderBy: [{ position: "asc" }, { title: "asc" }] }),
    db.recipeTypes.findMany({ orderBy: [{ position: "asc" }, { title: "asc" }] }),
    db.bodyTypes.findMany({ orderBy: [{ position: "asc" }, { title: "asc" }] }),
  ]);

  if (!recipe) notFound();

  const options: RecipeEditorOptions = {
    categories: categories.map((category) => ({ id: category.id, label: category.name })),
    ingredients: ingredients.map((ingredient) => ({ id: ingredient.id, label: ingredient.name })),
    forms: forms.map((form) => ({ id: form.id, label: form.name })),
    units: units.map((unit) => ({ id: unit.id, label: `${unit.title} (${unit.shortName})` })),
    difficulties: difficulties.map((difficulty) => ({ id: difficulty.id, label: difficulty.title })),
    seasons: seasons.map((season) => ({ id: season.id, label: season.title })),
    cuisines: cuisines.map((cuisine) => ({ id: cuisine.id, label: cuisine.title })),
    cookingMethods: cookingMethods.map((method) => ({ id: method.id, label: method.title })),
    allergies: allergies.map((allergy) => ({ id: allergy.id, label: allergy.title })),
    mealTimes: mealTimes.map((mealTime) => ({ id: mealTime.id, label: mealTime.title })),
    nutrients: nutrients.map((nutrient) => ({ id: nutrient.id, label: nutrient.title })),
    dietTypes: dietTypes.map((dietType) => ({ id: dietType.id, label: dietType.title })),
    recipeTypes: recipeTypes.map((recipeType) => ({ id: recipeType.id, label: recipeType.title })),
    bodyTypes: bodyTypes.map((bodyType) => ({ id: bodyType.id, label: bodyType.title })),
  };

  return (
    <RecipeEditor
      options={options}
      recipe={{
        id: recipe.id,
        title: recipe.title,
        slug: recipe.slug,
        description: recipe.description,
        imageUrl: recipe.imageUrl,
        recipeCategoriesId: recipe.recipeCategoriesId,
        recipeDifficultyId: recipe.recipeDifficultyId,
        recipeSeasonsId: recipe.recipeSeasonsId,
        seasonality: recipe.seasonality,
        isPublished: recipe.isPublished,
        metaTitle: recipe.metaTitle,
        metaDescription: recipe.metaDescription,
        metaSlug: recipe.metaSlug,
        recipeCookingTime: recipe.recipeCookingTime,
        views: recipe.views,
        createdAt: recipe.createdAt.toISOString(),
        updatedAt: recipe.updatedAt.toISOString(),
        publishedAt: recipe.publishedAt?.toISOString() ?? null,
        contentUpdatedAt: recipe.contentUpdatedAt?.toISOString() ?? null,
        ingredients: recipe.recipeIngredients.map((ingredient) => ({
          id: ingredient.id,
          ingredientId: ingredient.ingredientId,
          quantity: ingredient.quantity,
          unitId: ingredient.unitId,
          formId: ingredient.formId,
          position: ingredient.position,
          ingredientName: ingredient.ingredient.name,
          unitName: ingredient.unit.shortName,
          formName: ingredient.ingredientForm.name,
        })),
        steps: recipe.recipeMethods.map((step) => ({
          id: step.id,
          title: step.title,
          description: step.description,
          imageUrl: step.imageUrl,
          videoUrl: step.videoUrl,
          position: step.position,
          isPublished: step.isPublished,
        })),
        cuisineIds: recipe.recipeCuisine.map((tag) => tag.cuisineId),
        cookingMethodIds: recipe.recipeCookingMethods.map((tag) => tag.cookingMethodId),
        allergyIds: recipe.recipeAllergies.map((tag) => tag.allergyId),
        mealTimeIds: recipe.recipeMealTime.map((tag) => tag.mealTimeId),
        nutrientIds: recipe.recipeNutrient.map((tag) => tag.nutrientId),
        dietTypeIds: recipe.recipeDietType.map((tag) => tag.dietTypeId),
        recipeTypeIds: recipe.recipeRecipeType.map((tag) => tag.recipeTypeId),
        bodyTypeIds: recipe.recipeBodyTypes.map((tag) => tag.bodyTypeId),
        seasonIds: recipe.recipeSeasonTags.length
          ? recipe.recipeSeasonTags.map((tag) => tag.recipeSeasonsId)
          : recipe.recipeSeasonsId
            ? [recipe.recipeSeasonsId]
            : [],
      }}
    />
  );
};

export default RecipeIdPage;
