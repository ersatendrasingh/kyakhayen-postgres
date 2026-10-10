CREATE TABLE `ContentPipelineAutomationRule` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `platforms` JSON NOT NULL,
  `timeSlots` JSON NOT NULL,
  `daysOfWeek` JSON NULL,
  `timezone` VARCHAR(191) NOT NULL DEFAULT 'Asia/Kolkata',
  `recipeSource` ENUM('LATEST_READY') NOT NULL DEFAULT 'LATEST_READY',
  `lastScheduledAt` DATETIME(3) NULL,
  `createdById` VARCHAR(191) NULL,
  `createdByName` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `ContentPipelineAutomationRule_isActive_createdAt_idx`(`isActive`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ContentPipelineScheduledPost` (
  `id` VARCHAR(191) NOT NULL,
  `recipeId` VARCHAR(191) NULL,
  `recipeTitle` TEXT NOT NULL,
  `recipeUrl` VARCHAR(700) NOT NULL,
  `imageUrl` VARCHAR(700) NULL,
  `videoUrl` VARCHAR(700) NULL,
  `platforms` JSON NOT NULL,
  `contentJson` JSON NOT NULL,
  `status` ENUM('SCHEDULED', 'PROCESSING', 'COMPLETED', 'PARTIAL_FAILED', 'FAILED', 'CANCELLED', 'SKIPPED') NOT NULL DEFAULT 'SCHEDULED',
  `source` ENUM('MANUAL', 'AUTOMATION') NOT NULL DEFAULT 'MANUAL',
  `scheduledAt` DATETIME(3) NOT NULL,
  `processedAt` DATETIME(3) NULL,
  `lastError` TEXT NULL,
  `attempts` INTEGER NOT NULL DEFAULT 0,
  `createdById` VARCHAR(191) NULL,
  `createdByName` VARCHAR(191) NULL,
  `automationRuleId` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `ContentPipelineScheduledPost_status_scheduledAt_idx`(`status`, `scheduledAt`),
  INDEX `ContentPipelineScheduledPost_automationRuleId_scheduledAt_idx`(`automationRuleId`, `scheduledAt`),
  INDEX `ContentPipelineScheduledPost_recipeId_scheduledAt_idx`(`recipeId`, `scheduledAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ContentPipelinePublishAttempt` (
  `id` VARCHAR(191) NOT NULL,
  `scheduledPostId` VARCHAR(191) NOT NULL,
  `platform` VARCHAR(64) NOT NULL,
  `status` VARCHAR(64) NOT NULL,
  `message` TEXT NOT NULL,
  `externalId` VARCHAR(191) NULL,
  `externalUrl` VARCHAR(700) NULL,
  `reactionCount` INTEGER NULL,
  `commentCount` INTEGER NULL,
  `shareCount` INTEGER NULL,
  `viewCount` INTEGER NULL,
  `metricsSyncedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `ContentPipelinePublishAttempt_scheduledPostId_idx`(`scheduledPostId`),
  INDEX `ContentPipelinePublishAttempt_platform_status_idx`(`platform`, `status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `ContentPipelineScheduledPost`
  ADD CONSTRAINT `ContentPipelineScheduledPost_automationRuleId_fkey` FOREIGN KEY (`automationRuleId`) REFERENCES `ContentPipelineAutomationRule`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `ContentPipelinePublishAttempt`
  ADD CONSTRAINT `ContentPipelinePublishAttempt_scheduledPostId_fkey` FOREIGN KEY (`scheduledPostId`) REFERENCES `ContentPipelineScheduledPost`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
