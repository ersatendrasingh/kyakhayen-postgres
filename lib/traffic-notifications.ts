import {
  NotificationAudience,
  NotificationAutomationTrigger,
  NotificationSource,
  type Prisma,
} from "@prisma/client";

import { db } from "@/lib/db";
import { createNotificationCampaign, sendNotificationCampaign } from "@/lib/notifications";
import { publishedRecipeWhere } from "@/lib/recipe-publication";
import { recipeHref } from "@/lib/seo";

type TemplateTokens = Record<string, string | null | undefined>;

function renderTemplate(template: string | null, tokens: TemplateTokens) {
  if (!template) return null;
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => tokens[key] || "");
}

function localOccurrenceKey(date: Date, timezone: string | null | undefined) {
  const safeTimezone = timezone || "Asia/Kolkata";
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: safeTimezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      hourCycle: "h23",
    }).formatToParts(date);
    const value = (type: string) => parts.find((part) => part.type === type)?.value || "";
    return `${value("year")}-${value("month")}-${value("day")}-${value("hour")}:${value("minute")}`;
  } catch {
    return date.toISOString().slice(0, 16);
  }
}

function scheduledOccurrence(scheduledFor: string | null | undefined, fallback: Date) {
  if (!scheduledFor) return fallback;
  const scheduledAt = new Date(scheduledFor);
  return Number.isNaN(scheduledAt.getTime()) ? fallback : scheduledAt;
}

function recipeSelectionWhere(rule: {
  mealTimeId: string | null;
  audience: NotificationAudience;
  segmentType: string | null;
  segmentId: string | null;
}) {
  const conditions: Prisma.RecipesWhereInput[] = [
    publishedRecipeWhere(),
    { imageUrl: { not: null } },
    { imageUrl: { not: "" } },
  ];

  if (rule.mealTimeId) {
    conditions.push({ recipeMealTime: { some: { mealTimeId: rule.mealTimeId } } });
  }

  if (rule.audience === NotificationAudience.PREFERENCE_SEGMENT && rule.segmentId) {
    if (rule.segmentType === "CUISINE") {
      conditions.push({ recipeCuisine: { some: { cuisineId: rule.segmentId } } });
    } else {
      conditions.push({ recipeCategoriesId: rule.segmentId });
    }
  }

  return { AND: conditions } satisfies Prisma.RecipesWhereInput;
}

async function pickTrafficRecipe(
  where: Prisma.RecipesWhereInput,
  lastRecipeId: string | null,
) {
  const preferredWhere = lastRecipeId
    ? ({ AND: [where, { id: { not: lastRecipeId } }] } satisfies Prisma.RecipesWhereInput)
    : where;

  const preferredCount = await db.recipes.count({ where: preferredWhere });
  const finalWhere = preferredCount > 0 ? preferredWhere : where;
  const finalCount = preferredCount > 0 ? preferredCount : await db.recipes.count({ where });
  if (!finalCount) return null;

  return db.recipes.findFirst({
    where: finalWhere,
    skip: Math.floor(Math.random() * finalCount),
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      metaSlug: true,
      imageUrl: true,
      recipeMealTime: {
        take: 1,
        include: { mealTime: { select: { title: true } } },
      },
    },
  });
}

export async function runTrafficRecipeNotificationRule(ruleId: string, scheduledFor?: string) {
  const rule = await db.notificationAutomationRule.findUnique({ where: { id: ruleId } });
  if (
    !rule ||
    !rule.isActive ||
    rule.trigger !== NotificationAutomationTrigger.TRAFFIC_RECIPE
  ) {
    return { skipped: true, reason: "Traffic notification rule is inactive or missing." };
  }

  const where = recipeSelectionWhere(rule);
  const recipe = await pickTrafficRecipe(where, rule.lastRecipeId);
  const ranAt = new Date();
  const occurrenceAt = scheduledOccurrence(scheduledFor, ranAt);

  if (!recipe) {
    await db.notificationAutomationRule.update({
      where: { id: rule.id },
      data: { lastRunAt: ranAt },
    });
    return { skipped: true, reason: "No matching published recipe with an image." };
  }

  const href = recipeHref(recipe);
  const mealLabel = recipe.recipeMealTime[0]?.mealTime.title || rule.name;
  const tokens = {
    recipeTitle: recipe.title,
    recipePath: href.replace(/^\//, ""),
    recipeUrl: href,
    meal: mealLabel,
    ruleName: rule.name,
    sendTime: rule.scheduleTime,
  };

  const campaign = await createNotificationCampaign({
    audience: rule.audience,
    segmentType: rule.audience === NotificationAudience.PREFERENCE_SEGMENT ? rule.segmentType : null,
    segmentId: rule.audience === NotificationAudience.PREFERENCE_SEGMENT ? rule.segmentId : null,
    source: NotificationSource.TRAFFIC_RECIPE,
    title: renderTemplate(rule.titleTemplate, tokens) || rule.titleTemplate,
    body: renderTemplate(rule.bodyTemplate, tokens) || rule.bodyTemplate,
    url: renderTemplate(rule.urlTemplate, tokens) || href,
    imageUrl: rule.imageUrl || recipe.imageUrl,
    automationRuleId: rule.id,
    createdByName: rule.createdByName || "Traffic automation",
    dedupeKey: `${rule.id}-traffic-${localOccurrenceKey(occurrenceAt, rule.timezone)}`,
  });

  const sentCampaign = await sendNotificationCampaign(campaign.id);
  await db.notificationAutomationRule.update({
    where: { id: rule.id },
    data: { lastRecipeId: recipe.id, lastRunAt: ranAt },
  });

  return {
    skipped: false,
    campaignId: sentCampaign.id,
    recipeId: recipe.id,
    recipients: sentCampaign.totalRecipients,
  };
}
