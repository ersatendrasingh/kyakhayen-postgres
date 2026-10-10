ALTER TABLE `IngredientCategories`
  ADD COLUMN `imageUrl` VARCHAR(191) NULL,
  ADD COLUMN `position` INTEGER NULL,
  ADD COLUMN `isPublished` BOOLEAN NOT NULL DEFAULT false;

SET @ingredient_category_position := 0;
UPDATE `IngredientCategories`
SET `position` = (@ingredient_category_position := @ingredient_category_position + 1)
ORDER BY `name` ASC;

-- Existing imported category data is already in active use by the catalog.
UPDATE `IngredientCategories` SET `isPublished` = true;
