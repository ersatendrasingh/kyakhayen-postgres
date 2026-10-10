ALTER TABLE `IngredientsForm`
  ADD COLUMN `position` INTEGER NULL;

SET @ingredient_form_position := 0;
UPDATE `IngredientsForm`
SET `position` = (@ingredient_form_position := @ingredient_form_position + 1)
ORDER BY `name` ASC;
