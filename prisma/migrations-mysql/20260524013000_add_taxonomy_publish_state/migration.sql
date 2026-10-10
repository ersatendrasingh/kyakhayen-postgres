ALTER TABLE `RecipeCategories`
  ADD COLUMN `isPublished` BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE `CookingMethods`
  ADD COLUMN `isPublished` BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE `BodyTypes`
  ADD COLUMN `isPublished` BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE `Cuisines`
  ADD COLUMN `isPublished` BOOLEAN NOT NULL DEFAULT false;

-- Existing imported taxonomy content is already reviewed and currently visible.
UPDATE `RecipeCategories` SET `isPublished` = true;
UPDATE `CookingMethods` SET `isPublished` = true;
UPDATE `BodyTypes` SET `isPublished` = true;
UPDATE `Cuisines` SET `isPublished` = true;
