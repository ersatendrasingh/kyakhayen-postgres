export const handleRecipeClick = (recipeId: string, category: string) => {
  const behaviorData = JSON.parse(localStorage.getItem("behaviorData") || "{}");

  behaviorData[recipeId] = (behaviorData[recipeId] || 0) + 1;

  localStorage.setItem("behaviorData", JSON.stringify(behaviorData));

  const categoryData = JSON.parse(localStorage.getItem("categoryData") || "{}");
  categoryData[category] = (categoryData[category] || 0) + 1;
  localStorage.setItem("categoryData", JSON.stringify(categoryData));
};
