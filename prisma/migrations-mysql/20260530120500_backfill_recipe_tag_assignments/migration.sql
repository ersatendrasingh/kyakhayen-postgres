INSERT IGNORE INTO `RecipeDifficultyAssignment` (`id`, `recipeId`, `recipeDifficultyId`)
SELECT UUID(), `id`, `recipeDifficultyId`
FROM `Recipes`
WHERE `recipeDifficultyId` IS NOT NULL;

INSERT IGNORE INTO `RecipeSeasonAssignment` (`id`, `recipeId`, `recipeSeasonsId`)
SELECT UUID(), `id`, `recipeSeasonsId`
FROM `Recipes`
WHERE `recipeSeasonsId` IS NOT NULL;
