ALTER TABLE `Recipes`
  ADD COLUMN `seasonality` ENUM('UNREVIEWED', 'ALL_YEAR', 'SEASONAL') NOT NULL DEFAULT 'UNREVIEWED' AFTER `recipeSeasonsId`;

UPDATE `Recipes`
SET `seasonality` = 'SEASONAL'
WHERE `recipeSeasonsId` IS NOT NULL;

UPDATE `Recipes` recipe
SET `seasonality` = 'SEASONAL'
WHERE EXISTS (
  SELECT 1
  FROM `RecipeSeasonAssignment` assignment
  WHERE assignment.`recipeId` = recipe.`id`
);
