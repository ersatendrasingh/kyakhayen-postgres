ALTER TABLE `RecipeTypes`
  ADD COLUMN `isPublished` BOOLEAN NOT NULL DEFAULT false;

-- Existing imported recipe-type tags belong to the current visible recipe catalog.
UPDATE `RecipeTypes` SET `isPublished` = true;
