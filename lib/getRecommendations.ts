import _ from "lodash";
import { RecipeWithCategory } from "@/types/recipe";
import { cosineSimilarity, createTFIDFVectors } from "@/lib/recommendations";

interface RecipeWithSimilarity extends RecipeWithCategory {
  similarity: number;
}

export const getRecommendations = (
  recipes: RecipeWithCategory[],
  page: number,
  pageSize: number
): RecipeWithCategory[] => {
  if (recipes.length === 0) return [];

  const tfidfMatrix = createTFIDFVectors(recipes);

  const targetVector = tfidfMatrix[0];

  const similarities: RecipeWithSimilarity[] = recipes.map((recipe, index) => {
    const vector = tfidfMatrix[index];
    return {
      ...recipe,
      similarity: cosineSimilarity(targetVector, vector),
    };
  });

  const orderedRecipes = _.orderBy(similarities, ["similarity"], ["desc"]);

  // Implement pagination
  const startIndex = (page - 1) * pageSize;
  const endIndex = page * pageSize;
  const paginatedRecipes = orderedRecipes.slice(startIndex, endIndex);

  return paginatedRecipes.map((recipe) => {
    const recommendation: Partial<RecipeWithSimilarity> = { ...recipe };
    delete recommendation.similarity;
    return recommendation as RecipeWithCategory;
  });
};
