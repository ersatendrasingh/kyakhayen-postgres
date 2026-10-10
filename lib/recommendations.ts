import { RecipeWithCategory } from "@/types/recipe";

// Function to create TF-IDF vectors
const createTFIDFVectors = (recipes: RecipeWithCategory[]): number[][] => {
  const documents: string[] = recipes.map((recipe) => {
    const cookingTimes = [
      recipe.recipeCookingTime?.prepTime || "",
      recipe.recipeCookingTime?.cookTime || "",
      recipe.recipeCookingTime?.restTime || "",
    ].join(" ");

    const ingredients = recipe.recipeIngredients
      .map((ing) => ing.ingredient.name)
      .join(" ");
    const methods = recipe.recipeMethods
      .map((method) => method.title)
      .join(" ");
    const dietTypes =
      recipe.recipeDietType?.map((diet) => diet.dietType.title) || [];
    const recipeTypes =
      recipe.recipeRecipeType?.map((type) => type.recipeType.title) || [];
    const cookingMethods =
      recipe.recipeCookingMethods?.map(
        (method) => method.cookingMethod.title
      ) || [];
    const cuisines =
      recipe.recipeCuisine?.map((cuisine) => cuisine.cuisine.title) || [];
    const nutrients =
      recipe.recipeNutrient?.map((nutrient) => nutrient.nutrient.title) || [];
    const mealTimes =
      recipe.recipeMealTime?.map((meal) => meal.mealTimeId) || [];

    return [
      ingredients,
      methods,
      cookingTimes,
      ...dietTypes,
      ...recipeTypes,
      recipe.recipeDifficulty?.title || "",
      recipe.recipeSeasons?.title || "",
      ...cookingMethods,
      ...cuisines,
      ...nutrients,
      ...mealTimes,
    ].join(" ");
  });

  const uniqueWords = Array.from(new Set(documents.join(" ").split(" ")));
  const wordIndex: Record<string, number> = Object.fromEntries(
    uniqueWords.map((word, index) => [word, index])
  );

  const numWords = uniqueWords.length;
  const tfidf: number[][] = documents.map((doc) => {
    const tfidfVector = new Array(numWords).fill(0);
    doc.split(" ").forEach((word) => {
      if (word in wordIndex) {
        tfidfVector[wordIndex[word]] += 1;
      }
    });
    return tfidfVector;
  });

  return tfidf;
};

// Function to calculate cosine similarity
const cosineSimilarity = (a: number[], b: number[]): number => {
  const dotProduct = a.reduce((sum, val, idx) => sum + val * b[idx], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
};

export { createTFIDFVectors, cosineSimilarity };
