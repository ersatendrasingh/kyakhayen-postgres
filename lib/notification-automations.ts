import {
  NotificationAudience,
  NotificationAutomationTrigger,
  NotificationSource,
} from "@prisma/client";

import { db } from "@/lib/db";
import { createNotificationCampaign, sendNotificationCampaign } from "@/lib/notifications";
import { recipeHref } from "@/lib/seo";

type AutomationTokens = Record<string, string | null | undefined>;

function renderTemplate(template: string | null, tokens: AutomationTokens) {
  if (!template) return null;
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => tokens[key] || "");
}

export async function runUserAutomationRules({
  trigger,
  userId,
  tokens = {},
  dedupeScope,
  imageUrl,
}: {
  trigger: NotificationAutomationTrigger;
  userId: string;
  tokens?: AutomationTokens;
  dedupeScope: string;
  imageUrl?: string | null;
}) {
  const rules = await db.notificationAutomationRule.findMany({
    where: { trigger, isActive: true, audience: NotificationAudience.USER },
  });

  for (const rule of rules) {
    const campaign = await createNotificationCampaign({
      targetUserId: userId,
      audience: NotificationAudience.USER,
      source: rule.source,
      title: renderTemplate(rule.titleTemplate, tokens) || rule.titleTemplate,
      body: renderTemplate(rule.bodyTemplate, tokens) || rule.bodyTemplate,
      url: renderTemplate(rule.urlTemplate, tokens) || "/",
      imageUrl: imageUrl ?? rule.imageUrl,
      automationRuleId: rule.id,
      createdByName: rule.createdByName || "Automation",
      dedupeKey: `${rule.id}-${dedupeScope}`,
    });
    await sendNotificationCampaign(campaign.id);
  }

  return rules.length;
}

export async function runRecipePublishedAutomations(recipeId: string) {
  const recipe = await db.recipes.findUnique({
    where: { id: recipeId },
    include: {
      RecipeCategories: { select: { id: true, name: true } },
      recipeCuisine: { include: { cuisine: { select: { id: true, title: true } } } },
    },
  });
  if (!recipe || !recipe.isPublished) return 0;

  const rules = await db.notificationAutomationRule.findMany({
    where: {
      trigger: NotificationAutomationTrigger.RECIPE_PUBLISHED,
      isActive: true,
      audience: NotificationAudience.PREFERENCE_SEGMENT,
    },
  });
  let executed = 0;

  for (const rule of rules) {
    const matchingPreference =
      rule.segmentType === "CUISINE"
        ? recipe.recipeCuisine.find(({ cuisine }) => cuisine.id === rule.segmentId)?.cuisine.title
        : recipe.RecipeCategories?.id === rule.segmentId
          ? recipe.RecipeCategories.name
          : null;
    if (!matchingPreference || !rule.segmentId) continue;

    const tokens = {
      recipeTitle: recipe.title,
      recipePath: recipeHref(recipe).replace(/^\//, ""),
      preference: matchingPreference,
    };
    const campaign = await createNotificationCampaign({
      audience: NotificationAudience.PREFERENCE_SEGMENT,
      segmentType: rule.segmentType,
      segmentId: rule.segmentId,
      source: NotificationSource.PREFERENCE_PROMOTION,
      title: renderTemplate(rule.titleTemplate, tokens) || rule.titleTemplate,
      body: renderTemplate(rule.bodyTemplate, tokens) || rule.bodyTemplate,
      url: renderTemplate(rule.urlTemplate, tokens) || `/${tokens.recipePath}`,
      imageUrl: rule.imageUrl || recipe.imageUrl,
      automationRuleId: rule.id,
      createdByName: rule.createdByName || "Automation",
      dedupeKey: `${rule.id}-recipe-${recipe.id}`,
    });
    await sendNotificationCampaign(campaign.id);
    executed += 1;
  }

  return executed;
}
