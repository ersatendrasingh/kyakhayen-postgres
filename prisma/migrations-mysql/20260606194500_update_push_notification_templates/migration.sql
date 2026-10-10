UPDATE `NotificationAutomationRule`
SET
  `titleTemplate` = 'Your meal plan is ready',
  `bodyTemplate` = 'Your personalised dishes are waiting. Open the plan and start cooking.',
  `urlTemplate` = '/meal-plan',
  `updatedAt` = CURRENT_TIMESTAMP(3)
WHERE `id` = 'system-meal-plan-ready';

UPDATE `NotificationAutomationRule`
SET
  `titleTemplate` = '{{meal}} is coming up',
  `bodyTemplate` = 'Recipe pick: {{recipeTitle}}. Open it before you start cooking.',
  `urlTemplate` = '/{{recipePath}}',
  `imageUrl` = NULL,
  `updatedAt` = CURRENT_TIMESTAMP(3)
WHERE `id` = 'system-meal-reminder';

UPDATE `NotificationAutomationRule`
SET
  `titleTemplate` = 'Your membership {{expiryAction}}',
  `bodyTemplate` = '{{planName}} access ends {{expiryTiming}}. Renew to continue personalised meal planning.',
  `urlTemplate` = '/subscription-plans',
  `updatedAt` = CURRENT_TIMESTAMP(3)
WHERE `id` = 'system-membership-expiry';

UPDATE `NotificationAutomationRule`
SET
  `titleTemplate` = 'Your membership is active',
  `bodyTemplate` = '{{planName}} access is confirmed. Your personalised meal planning is ready.',
  `urlTemplate` = '/user/subscriptions',
  `updatedAt` = CURRENT_TIMESTAMP(3)
WHERE `id` = 'system-payment-success';

UPDATE `NotificationAutomationRule`
SET
  `titleTemplate` = 'Payment could not be completed',
  `bodyTemplate` = 'Your membership payment was unsuccessful. Try again or contact support if you need help.',
  `urlTemplate` = '/subscription-plans',
  `updatedAt` = CURRENT_TIMESTAMP(3)
WHERE `id` = 'system-payment-failed';
