-- CreateEnum
CREATE TYPE "RecipeSeasonality" AS ENUM ('UNREVIEWED', 'ALL_YEAR', 'SEASONAL');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "PwaPlatform" AS ENUM ('ANDROID', 'IOS', 'DESKTOP', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "PwaInstallState" AS ENUM ('BROWSING', 'PROMPTED', 'INSTALLED', 'INFERRED');

-- CreateEnum
CREATE TYPE "PwaInstallEventType" AS ENUM ('VISITED', 'PROMPT_SHOWN', 'PROMPT_ACCEPTED', 'PROMPT_DISMISSED', 'APP_INSTALLED', 'STANDALONE_OPENED', 'PUSH_PERMISSION_GRANTED', 'PUSH_PERMISSION_DENIED', 'PUSH_PERMISSION_BLOCKED', 'PUSH_SUBSCRIBED', 'PUSH_UNSUBSCRIBED');

-- CreateEnum
CREATE TYPE "NotificationAudience" AS ENUM ('ALL_SUBSCRIBERS', 'USER', 'PREFERENCE_SEGMENT');

-- CreateEnum
CREATE TYPE "NotificationCampaignStatus" AS ENUM ('SCHEDULED', 'PROCESSING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "NotificationSource" AS ENUM ('ADMIN_BROADCAST', 'ADMIN_TARGETED', 'MEAL_PLAN_READY', 'MEAL_REMINDER', 'MEMBERSHIP_EXPIRY', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'PREFERENCE_PROMOTION', 'TRAFFIC_RECIPE');

-- CreateEnum
CREATE TYPE "NotificationAutomationTrigger" AS ENUM ('MEAL_PLAN_READY', 'MEAL_REMINDER', 'MEMBERSHIP_EXPIRY', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'RECIPE_PUBLISHED', 'TRAFFIC_RECIPE');

-- CreateEnum
CREATE TYPE "NotificationDeliveryStatus" AS ENUM ('QUEUED', 'DELIVERED', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ContentPipelineScheduleStatus" AS ENUM ('SCHEDULED', 'PROCESSING', 'COMPLETED', 'PARTIAL_FAILED', 'FAILED', 'CANCELLED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "ContentPipelineScheduleSource" AS ENUM ('MANUAL', 'AUTOMATION');

-- CreateEnum
CREATE TYPE "ContentPipelineRecipeSource" AS ENUM ('LATEST_READY');

-- CreateEnum
CREATE TYPE "ContactLeadStatus" AS ENUM ('NEW', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP', 'CONVERTED', 'NOT_INTERESTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "RecipeReactionType" AS ENUM ('YUMMY', 'LOVE', 'WOW', 'MADE_IT', 'COMFORT');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('Processing', 'Paid', 'Failed', 'Success', 'Cancelled');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('FIXED_PRODUCT', 'CART_PERCENTAGE');

-- CreateTable
CREATE TABLE "Recipes" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "metaSlug" TEXT,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "recipeCategoriesId" TEXT,
    "recipeDifficultyId" TEXT,
    "recipeSeasonsId" TEXT,
    "seasonality" "RecipeSeasonality" NOT NULL DEFAULT 'UNREVIEWED',
    "views" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "contentUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "altText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeViews" (
    "id" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,

    CONSTRAINT "RecipeViews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRecipeViews" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserRecipeViews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeCategories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "imageUrl" TEXT,
    "position" INTEGER,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RecipeCategories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Units" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "position" INTEGER,

    CONSTRAINT "Units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeIngredients" (
    "id" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "formId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "recipeId" TEXT NOT NULL,

    CONSTRAINT "RecipeIngredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeMethods" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "videoUrl" TEXT,
    "position" INTEGER NOT NULL,
    "notes" TEXT,
    "recipeId" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecipeMethods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeDifficulty" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT,
    "position" INTEGER,

    CONSTRAINT "RecipeDifficulty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeSeasons" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "RecipeSeasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeDifficultyAssignment" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "recipeDifficultyId" TEXT NOT NULL,

    CONSTRAINT "RecipeDifficultyAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeSeasonAssignment" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "recipeSeasonsId" TEXT NOT NULL,

    CONSTRAINT "RecipeSeasonAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeCookingTime" (
    "id" TEXT NOT NULL,
    "prepTime" INTEGER NOT NULL,
    "cookTime" INTEGER NOT NULL,
    "restTime" INTEGER NOT NULL,
    "totalTime" INTEGER NOT NULL DEFAULT 0,
    "recipeId" TEXT NOT NULL,

    CONSTRAINT "RecipeCookingTime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CookingMethods" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "imageUrl" TEXT,
    "position" INTEGER,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CookingMethods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeCookingMethod" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "cookingMethodId" TEXT NOT NULL,

    CONSTRAINT "RecipeCookingMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BodyTypes" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "imageUrl" TEXT,
    "position" INTEGER,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "BodyTypes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeBodyType" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "bodyTypeId" TEXT NOT NULL,

    CONSTRAINT "RecipeBodyType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cuisines" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "imageUrl" TEXT,
    "position" INTEGER,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Cuisines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeCuisines" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "cuisineId" TEXT NOT NULL,

    CONSTRAINT "RecipeCuisines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Allergies" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "imageUrl" TEXT,
    "position" INTEGER,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Allergies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeAllergies" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "allergyId" TEXT NOT NULL,

    CONSTRAINT "RecipeAllergies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealTimes" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "imageUrl" TEXT,
    "position" INTEGER,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MealTimes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipeMealTime" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "mealTimeId" TEXT NOT NULL,

    CONSTRAINT "recipeMealTime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nutrient" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "imageUrl" TEXT,
    "position" INTEGER,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Nutrient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipeNutrient" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "nutrientId" TEXT NOT NULL,

    CONSTRAINT "recipeNutrient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DietTypes" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "imageUrl" TEXT,
    "position" INTEGER,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DietTypes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipeDietType" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "dietTypeId" TEXT NOT NULL,

    CONSTRAINT "recipeDietType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeTypes" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "imageUrl" TEXT,
    "position" INTEGER,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RecipeTypes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipeRecipeType" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "recipeTypeId" TEXT NOT NULL,

    CONSTRAINT "recipeRecipeType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ingredients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "imageUrl" TEXT,
    "nutritionSource" TEXT,
    "nutritionBasisGrams" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "calories" DOUBLE PRECISION,
    "carbohydrate" DOUBLE PRECISION,
    "totalFat" DOUBLE PRECISION,
    "dietaryFiber" DOUBLE PRECISION,
    "protein" DOUBLE PRECISION,
    "vitaminA" DOUBLE PRECISION,
    "ascorbicAcids" DOUBLE PRECISION,
    "vitaminD" DOUBLE PRECISION,
    "tocopherolEquivalent" DOUBLE PRECISION,
    "vitaminK" DOUBLE PRECISION,
    "thiamine" DOUBLE PRECISION,
    "riboflavin" DOUBLE PRECISION,
    "totalB6" DOUBLE PRECISION,
    "folates" DOUBLE PRECISION,
    "calcium" DOUBLE PRECISION,
    "iron" DOUBLE PRECISION,
    "phosphorus" DOUBLE PRECISION,
    "potassium" DOUBLE PRECISION,
    "sodium" DOUBLE PRECISION,
    "zinc" DOUBLE PRECISION,
    "marketPriceInr" DOUBLE PRECISION,
    "marketPriceBasisGrams" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "marketPriceSource" TEXT,
    "marketPriceUpdatedAt" TIMESTAMP(3),
    "ingredientCategoriesId" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngredientUnitMeasurements" (
    "id" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "values" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "IngredientUnitMeasurements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngredientCategories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "imageUrl" TEXT,
    "position" INTEGER,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "IngredientCategories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngredientsForm" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER,

    CONSTRAINT "IngredientsForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "durationDays" INTEGER,
    "regularPriceInr" DOUBLE PRECISION,
    "regularPriceUsd" DOUBLE PRECISION,
    "priceInr" DOUBLE PRECISION,
    "priceUsd" DOUBLE PRECISION,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feature" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "Feature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "phoneNumber" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "bio" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "genderId" TEXT,
    "foodPreferenceId" TEXT,
    "cookingSkillId" TEXT,
    "isTwoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isPersonalised" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "suspendedAt" TIMESTAMP(3),
    "suspensionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "deviceId" TEXT,
    "endpoint" VARCHAR(512) NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "platform" "PwaPlatform" NOT NULL DEFAULT 'UNKNOWN',
    "os" VARCHAR(120),
    "browser" VARCHAR(120),
    "displayMode" VARCHAR(60),
    "notificationPermission" VARCHAR(40),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSentAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PwaDevice" (
    "id" TEXT NOT NULL,
    "deviceKey" VARCHAR(80) NOT NULL,
    "userId" TEXT,
    "platform" "PwaPlatform" NOT NULL DEFAULT 'UNKNOWN',
    "os" VARCHAR(120),
    "browser" VARCHAR(120),
    "displayMode" VARCHAR(60),
    "userAgent" TEXT,
    "installState" "PwaInstallState" NOT NULL DEFAULT 'BROWSING',
    "pushPermission" VARCHAR(40),
    "promptShownAt" TIMESTAMP(3),
    "promptAcceptedAt" TIMESTAMP(3),
    "installedAt" TIMESTAMP(3),
    "standaloneFirstSeenAt" TIMESTAMP(3),
    "pushSubscribedAt" TIMESTAMP(3),
    "pushUnsubscribedAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PwaDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PwaInstallEvent" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "userId" TEXT,
    "eventType" "PwaInstallEventType" NOT NULL,
    "platform" "PwaPlatform" NOT NULL DEFAULT 'UNKNOWN',
    "os" VARCHAR(120),
    "browser" VARCHAR(120),
    "displayMode" VARCHAR(60),
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PwaInstallEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationCampaign" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "url" TEXT,
    "imageUrl" TEXT,
    "audience" "NotificationAudience" NOT NULL DEFAULT 'ALL_SUBSCRIBERS',
    "source" "NotificationSource" NOT NULL DEFAULT 'ADMIN_BROADCAST',
    "status" "NotificationCampaignStatus" NOT NULL DEFAULT 'PROCESSING',
    "segmentType" TEXT,
    "segmentId" TEXT,
    "dedupeKey" TEXT,
    "targetUserId" TEXT,
    "createdById" TEXT,
    "createdByName" TEXT,
    "totalRecipients" INTEGER NOT NULL DEFAULT 0,
    "successfulDeliveries" INTEGER NOT NULL DEFAULT 0,
    "failedDeliveries" INTEGER NOT NULL DEFAULT 0,
    "expiredSubscriptions" INTEGER NOT NULL DEFAULT 0,
    "openedCount" INTEGER NOT NULL DEFAULT 0,
    "clickedCount" INTEGER NOT NULL DEFAULT 0,
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "automationRuleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationAutomationRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger" "NotificationAutomationTrigger" NOT NULL,
    "source" "NotificationSource" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "audience" "NotificationAudience" NOT NULL DEFAULT 'USER',
    "segmentType" TEXT,
    "segmentId" TEXT,
    "titleTemplate" TEXT NOT NULL,
    "bodyTemplate" TEXT NOT NULL,
    "urlTemplate" TEXT,
    "imageUrl" TEXT,
    "scheduleTime" VARCHAR(5),
    "timezone" VARCHAR(64) NOT NULL DEFAULT 'Asia/Kolkata',
    "daysOfWeek" VARCHAR(32),
    "mealTimeId" TEXT,
    "lastRecipeId" TEXT,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationAutomationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationDelivery" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "userId" TEXT,
    "subscriptionId" TEXT,
    "status" "NotificationDeliveryStatus" NOT NULL DEFAULT 'QUEUED',
    "deliveredAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentPipelineAutomationRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "platforms" JSONB NOT NULL,
    "timeSlots" JSONB NOT NULL,
    "daysOfWeek" JSONB,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "recipeSource" "ContentPipelineRecipeSource" NOT NULL DEFAULT 'LATEST_READY',
    "lastScheduledAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentPipelineAutomationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentPipelineScheduledPost" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT,
    "recipeTitle" TEXT NOT NULL,
    "recipeUrl" VARCHAR(700) NOT NULL,
    "imageUrl" VARCHAR(700),
    "videoUrl" VARCHAR(700),
    "platforms" JSONB NOT NULL,
    "contentJson" JSONB NOT NULL,
    "status" "ContentPipelineScheduleStatus" NOT NULL DEFAULT 'SCHEDULED',
    "source" "ContentPipelineScheduleSource" NOT NULL DEFAULT 'MANUAL',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdByName" TEXT,
    "automationRuleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentPipelineScheduledPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentPipelinePublishAttempt" (
    "id" TEXT NOT NULL,
    "scheduledPostId" TEXT NOT NULL,
    "platform" VARCHAR(64) NOT NULL,
    "status" VARCHAR(64) NOT NULL,
    "message" TEXT NOT NULL,
    "externalId" TEXT,
    "externalUrl" VARCHAR(700),
    "reactionCount" INTEGER,
    "commentCount" INTEGER,
    "shareCount" INTEGER,
    "viewCount" INTEGER,
    "metricsSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentPipelinePublishAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentPipelineSocialCredential" (
    "id" TEXT NOT NULL,
    "provider" VARCHAR(64) NOT NULL,
    "environment" VARCHAR(32) NOT NULL,
    "boardId" TEXT,
    "accessTokenCiphertext" TEXT,
    "refreshTokenCiphertext" TEXT,
    "tokenType" VARCHAR(64),
    "scope" VARCHAR(700),
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "connectedAccountId" TEXT,
    "connectedAccountName" TEXT,
    "connectedById" TEXT,
    "connectedByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentPipelineSocialCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TwoFactorToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TwoFactorToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TwoFactorConfirmation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "TwoFactorConfirmation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gender" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT,
    "position" INTEGER,

    CONSTRAINT "Gender_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCuisines" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cuisineId" TEXT NOT NULL,

    CONSTRAINT "UserCuisines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAllrgies" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "allergyId" TEXT NOT NULL,

    CONSTRAINT "UserAllrgies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserMealPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planStartDate" TIMESTAMP(3) NOT NULL,
    "planEndDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserMealPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "metaSlug" TEXT,
    "content" TEXT,
    "imageUrl" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "imageUrl" TEXT,
    "position" INTEGER,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostCategory" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "PostCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleTag" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "imageUrl" TEXT,
    "position" INTEGER,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ArticleTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostTag" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "PostTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactUsQueries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "query" TEXT,
    "status" "ContactLeadStatus" NOT NULL DEFAULT 'NEW',
    "lastContactedAt" TIMESTAMP(3),
    "closedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactUsQueries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactQueryActivity" (
    "id" TEXT NOT NULL,
    "queryId" TEXT NOT NULL,
    "previousStatus" "ContactLeadStatus",
    "status" "ContactLeadStatus" NOT NULL,
    "contactMethod" TEXT,
    "note" TEXT NOT NULL,
    "contactedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "createdByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactQueryActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "content" TEXT NOT NULL,
    "likes" INTEGER DEFAULT 0,
    "recipeId" TEXT,
    "postId" TEXT,
    "parentCommentId" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommentLikes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommentLikes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 1,
    "comment" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeReaction" (
    "id" TEXT NOT NULL,
    "type" "RecipeReactionType" NOT NULL,
    "userId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecipeReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "subTotal" DOUBLE PRECISION,
    "taxTotal" DOUBLE PRECISION,
    "coupon" TEXT,
    "discount" DOUBLE PRECISION,
    "totalAmount" DOUBLE PRECISION,
    "currency" TEXT,
    "userId" TEXT NOT NULL,
    "paymentMethod" TEXT,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'Processing',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "itemName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "priceInr" DOUBLE PRECISION,
    "priceUsd" DOUBLE PRECISION,
    "planId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "discountType" "DiscountType" NOT NULL DEFAULT 'CART_PERCENTAGE',
    "discountValue" DOUBLE PRECISION,
    "expiryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanOnCoupon" (
    "id" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,

    CONSTRAINT "PlanOnCoupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCoupon" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserCoupon_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Recipes_slug_key" ON "Recipes"("slug");

-- CreateIndex
CREATE INDEX "Recipes_isPublished_publishedAt_idx" ON "Recipes"("isPublished", "publishedAt");

-- CreateIndex
CREATE INDEX "Recipes_contentUpdatedAt_idx" ON "Recipes"("contentUpdatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_url_key" ON "MediaAsset"("url");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_storageKey_key" ON "MediaAsset"("storageKey");

-- CreateIndex
CREATE INDEX "MediaAsset_mediaType_createdAt_idx" ON "MediaAsset"("mediaType", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeViews_recipeId_ipAddress_key" ON "RecipeViews"("recipeId", "ipAddress");

-- CreateIndex
CREATE UNIQUE INDEX "UserRecipeViews_userId_recipeId_key" ON "UserRecipeViews"("userId", "recipeId");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeCategories_name_key" ON "RecipeCategories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeCategories_slug_key" ON "RecipeCategories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Units_title_key" ON "Units"("title");

-- CreateIndex
CREATE UNIQUE INDEX "Units_shortName_key" ON "Units"("shortName");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeDifficultyAssignment_recipeId_recipeDifficultyId_key" ON "RecipeDifficultyAssignment"("recipeId", "recipeDifficultyId");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeSeasonAssignment_recipeId_recipeSeasonsId_key" ON "RecipeSeasonAssignment"("recipeId", "recipeSeasonsId");

-- CreateIndex
CREATE INDEX "RecipeCookingTime_totalTime_idx" ON "RecipeCookingTime"("totalTime");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeCookingTime_recipeId_key" ON "RecipeCookingTime"("recipeId");

-- CreateIndex
CREATE UNIQUE INDEX "CookingMethods_slug_key" ON "CookingMethods"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BodyTypes_slug_key" ON "BodyTypes"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeBodyType_recipeId_bodyTypeId_key" ON "RecipeBodyType"("recipeId", "bodyTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "Cuisines_slug_key" ON "Cuisines"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Allergies_slug_key" ON "Allergies"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "MealTimes_slug_key" ON "MealTimes"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Nutrient_slug_key" ON "Nutrient"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "DietTypes_slug_key" ON "DietTypes"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeTypes_slug_key" ON "RecipeTypes"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Ingredients_slug_key" ON "Ingredients"("slug");

-- CreateIndex
CREATE INDEX "Ingredients_marketPriceInr_idx" ON "Ingredients"("marketPriceInr");

-- CreateIndex
CREATE UNIQUE INDEX "IngredientUnitMeasurements_ingredientId_unitId_key" ON "IngredientUnitMeasurements"("ingredientId", "unitId");

-- CreateIndex
CREATE UNIQUE INDEX "IngredientCategories_name_key" ON "IngredientCategories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "IngredientCategories_slug_key" ON "IngredientCategories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "IngredientsForm_name_key" ON "IngredientsForm"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_slug_key" ON "Plan"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_isActive_idx" ON "PushSubscription"("userId", "isActive");

-- CreateIndex
CREATE INDEX "PushSubscription_deviceId_idx" ON "PushSubscription"("deviceId");

-- CreateIndex
CREATE INDEX "PushSubscription_platform_isActive_idx" ON "PushSubscription"("platform", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PwaDevice_deviceKey_key" ON "PwaDevice"("deviceKey");

-- CreateIndex
CREATE INDEX "PwaDevice_platform_installState_idx" ON "PwaDevice"("platform", "installState");

-- CreateIndex
CREATE INDEX "PwaDevice_userId_idx" ON "PwaDevice"("userId");

-- CreateIndex
CREATE INDEX "PwaDevice_installedAt_idx" ON "PwaDevice"("installedAt");

-- CreateIndex
CREATE INDEX "PwaDevice_lastSeenAt_idx" ON "PwaDevice"("lastSeenAt");

-- CreateIndex
CREATE INDEX "PwaInstallEvent_deviceId_createdAt_idx" ON "PwaInstallEvent"("deviceId", "createdAt");

-- CreateIndex
CREATE INDEX "PwaInstallEvent_eventType_createdAt_idx" ON "PwaInstallEvent"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "PwaInstallEvent_platform_createdAt_idx" ON "PwaInstallEvent"("platform", "createdAt");

-- CreateIndex
CREATE INDEX "PwaInstallEvent_userId_createdAt_idx" ON "PwaInstallEvent"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationCampaign_dedupeKey_key" ON "NotificationCampaign"("dedupeKey");

-- CreateIndex
CREATE INDEX "NotificationCampaign_createdAt_idx" ON "NotificationCampaign"("createdAt");

-- CreateIndex
CREATE INDEX "NotificationCampaign_targetUserId_idx" ON "NotificationCampaign"("targetUserId");

-- CreateIndex
CREATE INDEX "NotificationCampaign_status_scheduledAt_idx" ON "NotificationCampaign"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "NotificationCampaign_automationRuleId_idx" ON "NotificationCampaign"("automationRuleId");

-- CreateIndex
CREATE INDEX "NotificationAutomationRule_trigger_isActive_idx" ON "NotificationAutomationRule"("trigger", "isActive");

-- CreateIndex
CREATE INDEX "NotificationAutomationRule_trigger_isActive_nextRunAt_idx" ON "NotificationAutomationRule"("trigger", "isActive", "nextRunAt");

-- CreateIndex
CREATE INDEX "NotificationAutomationRule_mealTimeId_idx" ON "NotificationAutomationRule"("mealTimeId");

-- CreateIndex
CREATE INDEX "NotificationDelivery_campaignId_status_idx" ON "NotificationDelivery"("campaignId", "status");

-- CreateIndex
CREATE INDEX "NotificationDelivery_userId_createdAt_idx" ON "NotificationDelivery"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationDelivery_campaignId_subscriptionId_key" ON "NotificationDelivery"("campaignId", "subscriptionId");

-- CreateIndex
CREATE INDEX "ContentPipelineAutomationRule_isActive_createdAt_idx" ON "ContentPipelineAutomationRule"("isActive", "createdAt");

-- CreateIndex
CREATE INDEX "ContentPipelineScheduledPost_status_scheduledAt_idx" ON "ContentPipelineScheduledPost"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "ContentPipelineScheduledPost_automationRuleId_scheduledAt_idx" ON "ContentPipelineScheduledPost"("automationRuleId", "scheduledAt");

-- CreateIndex
CREATE INDEX "ContentPipelineScheduledPost_recipeId_scheduledAt_idx" ON "ContentPipelineScheduledPost"("recipeId", "scheduledAt");

-- CreateIndex
CREATE INDEX "ContentPipelinePublishAttempt_scheduledPostId_idx" ON "ContentPipelinePublishAttempt"("scheduledPostId");

-- CreateIndex
CREATE INDEX "ContentPipelinePublishAttempt_platform_status_idx" ON "ContentPipelinePublishAttempt"("platform", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ContentPipelineSocialCredential_provider_key" ON "ContentPipelineSocialCredential"("provider");

-- CreateIndex
CREATE INDEX "ContentPipelineSocialCredential_provider_environment_idx" ON "ContentPipelineSocialCredential"("provider", "environment");

-- CreateIndex
CREATE INDEX "UserPlan_userId_idx" ON "UserPlan"("userId");

-- CreateIndex
CREATE INDEX "UserPlan_planId_idx" ON "UserPlan"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPlan_userId_planId_key" ON "UserPlan"("userId", "planId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_email_token_key" ON "VerificationToken"("email", "token");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_email_token_key" ON "PasswordResetToken"("email", "token");

-- CreateIndex
CREATE UNIQUE INDEX "TwoFactorToken_token_key" ON "TwoFactorToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "TwoFactorToken_email_token_key" ON "TwoFactorToken"("email", "token");

-- CreateIndex
CREATE UNIQUE INDEX "TwoFactorConfirmation_userId_key" ON "TwoFactorConfirmation"("userId");

-- CreateIndex
CREATE INDEX "UserCuisines_cuisineId_idx" ON "UserCuisines"("cuisineId");

-- CreateIndex
CREATE INDEX "UserCuisines_userId_idx" ON "UserCuisines"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserCuisines_userId_cuisineId_key" ON "UserCuisines"("userId", "cuisineId");

-- CreateIndex
CREATE INDEX "UserAllrgies_allergyId_idx" ON "UserAllrgies"("allergyId");

-- CreateIndex
CREATE INDEX "UserAllrgies_userId_idx" ON "UserAllrgies"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAllrgies_userId_allergyId_key" ON "UserAllrgies"("userId", "allergyId");

-- CreateIndex
CREATE UNIQUE INDEX "Post_slug_key" ON "Post"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Category_title_key" ON "Category"("title");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PostCategory_postId_categoryId_key" ON "PostCategory"("postId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleTag_title_key" ON "ArticleTag"("title");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleTag_slug_key" ON "ArticleTag"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PostTag_postId_tagId_key" ON "PostTag"("postId", "tagId");

-- CreateIndex
CREATE INDEX "ContactQueryActivity_queryId_contactedAt_idx" ON "ContactQueryActivity"("queryId", "contactedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CommentLikes_userId_commentId_key" ON "CommentLikes"("userId", "commentId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_recipeId_key" ON "Favorite"("userId", "recipeId");

-- CreateIndex
CREATE INDEX "RecipeReaction_recipeId_type_idx" ON "RecipeReaction"("recipeId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeReaction_userId_recipeId_key" ON "RecipeReaction"("userId", "recipeId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderId_key" ON "Order"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE INDEX "Coupon_code_idx" ON "Coupon"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PlanOnCoupon_couponId_planId_key" ON "PlanOnCoupon"("couponId", "planId");

-- AddForeignKey
ALTER TABLE "Recipes" ADD CONSTRAINT "Recipes_recipeCategoriesId_fkey" FOREIGN KEY ("recipeCategoriesId") REFERENCES "RecipeCategories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipes" ADD CONSTRAINT "Recipes_recipeDifficultyId_fkey" FOREIGN KEY ("recipeDifficultyId") REFERENCES "RecipeDifficulty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipes" ADD CONSTRAINT "Recipes_recipeSeasonsId_fkey" FOREIGN KEY ("recipeSeasonsId") REFERENCES "RecipeSeasons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeViews" ADD CONSTRAINT "RecipeViews_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRecipeViews" ADD CONSTRAINT "UserRecipeViews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRecipeViews" ADD CONSTRAINT "UserRecipeViews_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeIngredients" ADD CONSTRAINT "RecipeIngredients_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeIngredients" ADD CONSTRAINT "RecipeIngredients_formId_fkey" FOREIGN KEY ("formId") REFERENCES "IngredientsForm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeIngredients" ADD CONSTRAINT "RecipeIngredients_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeIngredients" ADD CONSTRAINT "RecipeIngredients_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeMethods" ADD CONSTRAINT "RecipeMethods_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeDifficultyAssignment" ADD CONSTRAINT "RecipeDifficultyAssignment_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeDifficultyAssignment" ADD CONSTRAINT "RecipeDifficultyAssignment_recipeDifficultyId_fkey" FOREIGN KEY ("recipeDifficultyId") REFERENCES "RecipeDifficulty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeSeasonAssignment" ADD CONSTRAINT "RecipeSeasonAssignment_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeSeasonAssignment" ADD CONSTRAINT "RecipeSeasonAssignment_recipeSeasonsId_fkey" FOREIGN KEY ("recipeSeasonsId") REFERENCES "RecipeSeasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeCookingTime" ADD CONSTRAINT "RecipeCookingTime_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeCookingMethod" ADD CONSTRAINT "RecipeCookingMethod_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeCookingMethod" ADD CONSTRAINT "RecipeCookingMethod_cookingMethodId_fkey" FOREIGN KEY ("cookingMethodId") REFERENCES "CookingMethods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeBodyType" ADD CONSTRAINT "RecipeBodyType_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeBodyType" ADD CONSTRAINT "RecipeBodyType_bodyTypeId_fkey" FOREIGN KEY ("bodyTypeId") REFERENCES "BodyTypes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeCuisines" ADD CONSTRAINT "RecipeCuisines_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeCuisines" ADD CONSTRAINT "RecipeCuisines_cuisineId_fkey" FOREIGN KEY ("cuisineId") REFERENCES "Cuisines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeAllergies" ADD CONSTRAINT "RecipeAllergies_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeAllergies" ADD CONSTRAINT "RecipeAllergies_allergyId_fkey" FOREIGN KEY ("allergyId") REFERENCES "Allergies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipeMealTime" ADD CONSTRAINT "recipeMealTime_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipeMealTime" ADD CONSTRAINT "recipeMealTime_mealTimeId_fkey" FOREIGN KEY ("mealTimeId") REFERENCES "MealTimes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipeNutrient" ADD CONSTRAINT "recipeNutrient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipeNutrient" ADD CONSTRAINT "recipeNutrient_nutrientId_fkey" FOREIGN KEY ("nutrientId") REFERENCES "Nutrient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipeDietType" ADD CONSTRAINT "recipeDietType_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipeDietType" ADD CONSTRAINT "recipeDietType_dietTypeId_fkey" FOREIGN KEY ("dietTypeId") REFERENCES "DietTypes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipeRecipeType" ADD CONSTRAINT "recipeRecipeType_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipeRecipeType" ADD CONSTRAINT "recipeRecipeType_recipeTypeId_fkey" FOREIGN KEY ("recipeTypeId") REFERENCES "RecipeTypes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingredients" ADD CONSTRAINT "Ingredients_ingredientCategoriesId_fkey" FOREIGN KEY ("ingredientCategoriesId") REFERENCES "IngredientCategories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngredientUnitMeasurements" ADD CONSTRAINT "IngredientUnitMeasurements_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngredientUnitMeasurements" ADD CONSTRAINT "IngredientUnitMeasurements_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feature" ADD CONSTRAINT "Feature_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_genderId_fkey" FOREIGN KEY ("genderId") REFERENCES "Gender"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_foodPreferenceId_fkey" FOREIGN KEY ("foodPreferenceId") REFERENCES "RecipeCategories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_cookingSkillId_fkey" FOREIGN KEY ("cookingSkillId") REFERENCES "RecipeDifficulty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "PwaDevice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PwaDevice" ADD CONSTRAINT "PwaDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PwaInstallEvent" ADD CONSTRAINT "PwaInstallEvent_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "PwaDevice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PwaInstallEvent" ADD CONSTRAINT "PwaInstallEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationCampaign" ADD CONSTRAINT "NotificationCampaign_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationCampaign" ADD CONSTRAINT "NotificationCampaign_automationRuleId_fkey" FOREIGN KEY ("automationRuleId") REFERENCES "NotificationAutomationRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "NotificationCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "PushSubscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentPipelineScheduledPost" ADD CONSTRAINT "ContentPipelineScheduledPost_automationRuleId_fkey" FOREIGN KEY ("automationRuleId") REFERENCES "ContentPipelineAutomationRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentPipelinePublishAttempt" ADD CONSTRAINT "ContentPipelinePublishAttempt_scheduledPostId_fkey" FOREIGN KEY ("scheduledPostId") REFERENCES "ContentPipelineScheduledPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPlan" ADD CONSTRAINT "UserPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPlan" ADD CONSTRAINT "UserPlan_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TwoFactorConfirmation" ADD CONSTRAINT "TwoFactorConfirmation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCuisines" ADD CONSTRAINT "UserCuisines_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCuisines" ADD CONSTRAINT "UserCuisines_cuisineId_fkey" FOREIGN KEY ("cuisineId") REFERENCES "Cuisines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAllrgies" ADD CONSTRAINT "UserAllrgies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAllrgies" ADD CONSTRAINT "UserAllrgies_allergyId_fkey" FOREIGN KEY ("allergyId") REFERENCES "Allergies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMealPlan" ADD CONSTRAINT "UserMealPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostCategory" ADD CONSTRAINT "PostCategory_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostCategory" ADD CONSTRAINT "PostCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostTag" ADD CONSTRAINT "PostTag_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostTag" ADD CONSTRAINT "PostTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "ArticleTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactQueryActivity" ADD CONSTRAINT "ContactQueryActivity_queryId_fkey" FOREIGN KEY ("queryId") REFERENCES "ContactUsQueries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentLikes" ADD CONSTRAINT "CommentLikes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentLikes" ADD CONSTRAINT "CommentLikes_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeReaction" ADD CONSTRAINT "RecipeReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeReaction" ADD CONSTRAINT "RecipeReaction_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanOnCoupon" ADD CONSTRAINT "PlanOnCoupon_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanOnCoupon" ADD CONSTRAINT "PlanOnCoupon_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCoupon" ADD CONSTRAINT "UserCoupon_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCoupon" ADD CONSTRAINT "UserCoupon_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
