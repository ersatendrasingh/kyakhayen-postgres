-- DropForeignKey
ALTER TABLE `PrakritiQuestionOption` DROP FOREIGN KEY `PrakritiQuestionOption_prakritiId_fkey`;

-- DropForeignKey
ALTER TABLE `PrakritiQuestionOption` DROP FOREIGN KEY `PrakritiQuestionOption_questionId_fkey`;

-- DropForeignKey
ALTER TABLE `RecipeHealthBenefits` DROP FOREIGN KEY `RecipeHealthBenefits_recipeId_fkey`;

-- DropForeignKey
ALTER TABLE `RecipePrakriti` DROP FOREIGN KEY `RecipePrakriti_prakritiId_fkey`;

-- DropForeignKey
ALTER TABLE `RecipePrakriti` DROP FOREIGN KEY `RecipePrakriti_recipeId_fkey`;

-- DropForeignKey
ALTER TABLE `User` DROP FOREIGN KEY `User_prakritiId_fkey`;

-- DropForeignKey
ALTER TABLE `UserHealthGoals` DROP FOREIGN KEY `UserHealthGoals_healthGoalId_fkey`;

-- DropForeignKey
ALTER TABLE `UserHealthGoals` DROP FOREIGN KEY `UserHealthGoals_userId_fkey`;

-- DropForeignKey
ALTER TABLE `UserPrakriti` DROP FOREIGN KEY `UserPrakriti_userId_fkey`;

-- DropForeignKey
ALTER TABLE `recipeDisease` DROP FOREIGN KEY `recipeDisease_diseaseId_fkey`;

-- DropForeignKey
ALTER TABLE `recipeDisease` DROP FOREIGN KEY `recipeDisease_recipeId_fkey`;

-- DropForeignKey
ALTER TABLE `recipeHealthGoals` DROP FOREIGN KEY `recipeHealthGoals_healthGoalId_fkey`;

-- DropForeignKey
ALTER TABLE `recipeHealthGoals` DROP FOREIGN KEY `recipeHealthGoals_recipeId_fkey`;

-- AlterTable
ALTER TABLE `User` DROP COLUMN `age`,
    DROP COLUMN `bmi`,
    DROP COLUMN `dob`,
    DROP COLUMN `heightCm`,
    DROP COLUMN `heightFt`,
    DROP COLUMN `heightInch`,
    DROP COLUMN `prakritiId`,
    DROP COLUMN `weightKg`,
    DROP COLUMN `weightLbs`;

-- DropTable
DROP TABLE `Disease`;

-- DropTable
DROP TABLE `HealthGoals`;

-- DropTable
DROP TABLE `Prakriti`;

-- DropTable
DROP TABLE `PrakritiQuestion`;

-- DropTable
DROP TABLE `PrakritiQuestionOption`;

-- DropTable
DROP TABLE `RecipeHealthBenefits`;

-- DropTable
DROP TABLE `RecipePrakriti`;

-- DropTable
DROP TABLE `UserHealthGoals`;

-- DropTable
DROP TABLE `UserPrakriti`;

-- DropTable
DROP TABLE `recipeDisease`;

-- DropTable
DROP TABLE `recipeHealthGoals`;
