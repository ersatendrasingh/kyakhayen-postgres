-- Publish only the imported allergens that are actively used by recipes.
UPDATE `Allergies`
SET `isPublished` = true
WHERE EXISTS (
  SELECT 1
  FROM `RecipeAllergies`
  WHERE `RecipeAllergies`.`allergyId` = `Allergies`.`id`
);
