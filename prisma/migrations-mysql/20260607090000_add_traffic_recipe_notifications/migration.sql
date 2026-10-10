ALTER TABLE `NotificationCampaign`
  MODIFY `source` ENUM('ADMIN_BROADCAST', 'ADMIN_TARGETED', 'MEAL_PLAN_READY', 'MEAL_REMINDER', 'MEMBERSHIP_EXPIRY', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'PREFERENCE_PROMOTION', 'TRAFFIC_RECIPE') NOT NULL DEFAULT 'ADMIN_BROADCAST';

ALTER TABLE `NotificationAutomationRule`
  MODIFY `trigger` ENUM('MEAL_PLAN_READY', 'MEAL_REMINDER', 'MEMBERSHIP_EXPIRY', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'RECIPE_PUBLISHED', 'TRAFFIC_RECIPE') NOT NULL,
  MODIFY `source` ENUM('ADMIN_BROADCAST', 'ADMIN_TARGETED', 'MEAL_PLAN_READY', 'MEAL_REMINDER', 'MEMBERSHIP_EXPIRY', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'PREFERENCE_PROMOTION', 'TRAFFIC_RECIPE') NOT NULL,
  ADD COLUMN `scheduleTime` VARCHAR(5) NULL,
  ADD COLUMN `timezone` VARCHAR(64) NOT NULL DEFAULT 'Asia/Kolkata',
  ADD COLUMN `daysOfWeek` VARCHAR(32) NULL,
  ADD COLUMN `mealTimeId` VARCHAR(191) NULL,
  ADD COLUMN `lastRecipeId` VARCHAR(191) NULL,
  ADD COLUMN `lastRunAt` DATETIME(3) NULL,
  ADD COLUMN `nextRunAt` DATETIME(3) NULL;

CREATE INDEX `NotificationAutomationRule_trigger_isActive_nextRunAt_idx`
  ON `NotificationAutomationRule`(`trigger`, `isActive`, `nextRunAt`);

CREATE INDEX `NotificationAutomationRule_mealTimeId_idx`
  ON `NotificationAutomationRule`(`mealTimeId`);

INSERT INTO `NotificationAutomationRule`
  (`id`, `name`, `trigger`, `source`, `isActive`, `isSystem`, `audience`, `titleTemplate`, `bodyTemplate`, `urlTemplate`, `scheduleTime`, `timezone`, `daysOfWeek`, `createdByName`, `createdAt`, `updatedAt`)
VALUES
  ('system-traffic-breakfast', 'Breakfast recipe traffic', 'TRAFFIC_RECIPE', 'TRAFFIC_RECIPE', true, true, 'ALL_SUBSCRIBERS', 'Breakfast ka mood? {{recipeTitle}} ready hai', 'Subah ka sawaal: aaj breakfast me kya khane ka mann hai? Tap karo, tasty idea mil gaya.', '/{{recipePath}}', '06:00', 'Asia/Kolkata', '0,1,2,3,4,5,6', 'System', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('system-traffic-mid-morning', 'Mid-morning recipe traffic', 'TRAFFIC_RECIPE', 'TRAFFIC_RECIPE', true, true, 'ALL_SUBSCRIBERS', 'Mid-morning craving ka fix: {{recipeTitle}}', 'Chai break ke saath kuch smart try karein? Yeh recipe aaj ka tasty plot twist ho sakti hai.', '/{{recipePath}}', '09:30', 'Asia/Kolkata', '0,1,2,3,4,5,6', 'System', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('system-traffic-lunch', 'Lunch recipe traffic', 'TRAFFIC_RECIPE', 'TRAFFIC_RECIPE', true, true, 'ALL_SUBSCRIBERS', 'Lunch scene sorted: {{recipeTitle}}', 'Dopahar me kya banega wali confusion khatam. Tap karo aur lunch idea pakka karo.', '/{{recipePath}}', '13:00', 'Asia/Kolkata', '0,1,2,3,4,5,6', 'System', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('system-traffic-evening', 'Evening snack recipe traffic', 'TRAFFIC_RECIPE', 'TRAFFIC_RECIPE', true, true, 'ALL_SUBSCRIBERS', 'Shaam ka snack signal: {{recipeTitle}}', 'Evening hunger ne knock kiya? Yeh recipe mood bhi set karegi aur plate bhi.', '/{{recipePath}}', '17:00', 'Asia/Kolkata', '0,1,2,3,4,5,6', 'System', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('system-traffic-dinner', 'Dinner recipe traffic', 'TRAFFIC_RECIPE', 'TRAFFIC_RECIPE', true, true, 'ALL_SUBSCRIBERS', 'Dinner plan mil gaya: {{recipeTitle}}', 'Raat ka sawaal solved. Tap karo aur aaj ka dinner thoda special banao.', '/{{recipePath}}', '20:00', 'Asia/Kolkata', '0,1,2,3,4,5,6', 'System', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
