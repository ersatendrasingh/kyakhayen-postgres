CREATE TABLE `NotificationAutomationRule` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `trigger` ENUM('MEAL_PLAN_READY', 'MEAL_REMINDER', 'MEMBERSHIP_EXPIRY', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'RECIPE_PUBLISHED') NOT NULL,
  `source` ENUM('ADMIN_BROADCAST', 'ADMIN_TARGETED', 'MEAL_PLAN_READY', 'MEAL_REMINDER', 'MEMBERSHIP_EXPIRY', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'PREFERENCE_PROMOTION') NOT NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `isSystem` BOOLEAN NOT NULL DEFAULT false,
  `audience` ENUM('ALL_SUBSCRIBERS', 'USER', 'PREFERENCE_SEGMENT') NOT NULL DEFAULT 'USER',
  `segmentType` VARCHAR(191) NULL,
  `segmentId` VARCHAR(191) NULL,
  `titleTemplate` VARCHAR(191) NOT NULL,
  `bodyTemplate` TEXT NOT NULL,
  `urlTemplate` VARCHAR(191) NULL,
  `imageUrl` VARCHAR(191) NULL,
  `createdById` VARCHAR(191) NULL,
  `createdByName` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `NotificationAutomationRule_trigger_isActive_idx`(`trigger`, `isActive`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `NotificationCampaign`
  ADD COLUMN `automationRuleId` VARCHAR(191) NULL;

CREATE INDEX `NotificationCampaign_automationRuleId_idx` ON `NotificationCampaign`(`automationRuleId`);

ALTER TABLE `NotificationCampaign`
  ADD CONSTRAINT `NotificationCampaign_automationRuleId_fkey` FOREIGN KEY (`automationRuleId`) REFERENCES `NotificationAutomationRule`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO `NotificationAutomationRule`
  (`id`, `name`, `trigger`, `source`, `isActive`, `isSystem`, `audience`, `titleTemplate`, `bodyTemplate`, `urlTemplate`, `createdByName`, `createdAt`, `updatedAt`)
VALUES
  ('system-meal-plan-ready', 'Meal plan ready', 'MEAL_PLAN_READY', 'MEAL_PLAN_READY', true, true, 'USER', 'Your meal plan is ready', 'Your personalised dishes are waiting. Open the plan and start cooking.', '/meal-plan', 'System', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('system-meal-reminder', 'Breakfast, lunch and dinner reminders', 'MEAL_REMINDER', 'MEAL_REMINDER', true, true, 'USER', '{{meal}} is coming up', 'Your planned dishes are ready to view. Open your meal plan before you start cooking.', '/meal-plan', 'System', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('system-membership-expiry', 'Membership expiry reminders', 'MEMBERSHIP_EXPIRY', 'MEMBERSHIP_EXPIRY', true, true, 'USER', 'Your membership {{expiryAction}}', '{{planName}} access ends {{expiryTiming}}. Renew to continue personalised meal planning.', '/subscription-plans', 'System', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('system-payment-success', 'Successful membership payment', 'PAYMENT_SUCCESS', 'PAYMENT_SUCCESS', true, true, 'USER', 'Your membership is active', '{{planName}} access is confirmed. Your personalised meal planning is ready.', '/user/subscriptions', 'System', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('system-payment-failed', 'Failed membership payment', 'PAYMENT_FAILED', 'PAYMENT_FAILED', true, true, 'USER', 'Payment could not be completed', 'Your membership payment was unsuccessful. Try again or contact support if you need help.', '/subscription-plans', 'System', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
