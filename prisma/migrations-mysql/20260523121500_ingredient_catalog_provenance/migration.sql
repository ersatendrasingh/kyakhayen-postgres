-- Ingredient catalog imports need stable external identity and auditable nutrition provenance.
ALTER TABLE `Ingredients`
    ADD COLUMN `slug` VARCHAR(191) NULL,
    ADD COLUMN `sourceSystem` VARCHAR(191) NULL,
    ADD COLUMN `sourceId` INTEGER NULL,
    ADD COLUMN `nutritionSource` VARCHAR(191) NULL,
    ADD COLUMN `nutritionBasisGrams` DOUBLE NOT NULL DEFAULT 100,
    CHANGE COLUMN `phophorus` `phosphorus` DOUBLE NULL;

CREATE UNIQUE INDEX `Ingredients_slug_key` ON `Ingredients`(`slug`);
CREATE UNIQUE INDEX `Ingredients_sourceSystem_sourceId_key`
    ON `Ingredients`(`sourceSystem`, `sourceId`);
CREATE UNIQUE INDEX `IngredientUnitMeasurements_ingredientId_unitId_key`
    ON `IngredientUnitMeasurements`(`ingredientId`, `unitId`);
