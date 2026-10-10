"use server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { RecipeWithCategory } from "@/types/recipe";

export const getUserReviewedRecipes = async (): Promise<
  RecipeWithCategory[]
> => {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error("User not found.");
    }

    const userId = user.id;

    const reviews = await db.review.findMany({
      where: {
        userId,
      },
      include: {
        recipe: {
          include: {
            RecipeCategories: true,
            recipeIngredients: {
              include: {
                unit: true,
                ingredientForm: true,
                ingredient: {
                  include: {
                    IngredientUnitMeasurements: true,
                  },
                },
              },
              orderBy: {
                position: "asc",
              },
            },
            recipeMethods: {
              where: {
                isPublished: true,
              },
              orderBy: {
                position: "asc",
              },
            },
            recipeRecipeType: {
              where: {
                recipeType: {
                  isPublished: true,
                },
              },
              include: {
                recipeType: true,
              },
            },
            recipeDietType: {
              where: {
                dietType: {
                  isPublished: true,
                },
              },
              include: {
                dietType: true,
              },
            },
            recipeNutrient: {
              where: {
                nutrient: {
                  isPublished: true,
                },
              },
              include: {
                nutrient: true,
              },
            },
            recipeCookingMethods: {
              include: {
                cookingMethod: true,
              },
            },
            recipeCuisine: {
              include: {
                cuisine: true,
              },
            },
            recipeCookingTime: true,
            recipeMealTime: true,
            recipeDifficulty: true,
            recipeSeasons: true,
            recipeComments: {
              where: {
                OR: [{ isPublished: true }, { userId }],
              },
              include: {
                user: true,
                recipe: true,
              },
              orderBy: {
                createdAt: "desc",
              },
            },
            Review: {
              where: {
                OR: [{ isPublished: true }, { userId }],
              },
              include: {
                user: true,
                recipe: true,
              },
              orderBy: {
                createdAt: "desc",
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!reviews) {
      throw new Error(`Reviews not found for user with ID ${userId}.`);
    }

    const reviewedRecipes = reviews.map((review) => review.recipe);

    return reviewedRecipes;
  } catch (error) {
    console.error("Error fetching user's reviewed recipes:", error);
    throw error;
  }
};
