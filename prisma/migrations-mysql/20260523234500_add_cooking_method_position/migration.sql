ALTER TABLE `CookingMethods` ADD COLUMN `position` INTEGER NULL;

SET @cooking_method_position := 0;
UPDATE `CookingMethods`
SET `position` = (@cooking_method_position := @cooking_method_position + 1)
ORDER BY `title` ASC;
