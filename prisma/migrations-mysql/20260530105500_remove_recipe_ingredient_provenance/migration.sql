ALTER TABLE `Recipes` DROP INDEX `Recipes_sourceSystem_sourceId_key`;
ALTER TABLE `Recipes` DROP COLUMN `sourceSystem`, DROP COLUMN `sourceId`;

ALTER TABLE `Ingredients` DROP INDEX `Ingredients_sourceSystem_sourceId_key`;
ALTER TABLE `Ingredients` DROP COLUMN `sourceSystem`, DROP COLUMN `sourceId`;
