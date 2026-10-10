import {
  ContentPipelineScheduleSource,
  ContentPipelineScheduleStatus,
  Prisma,
} from "@prisma/client";

import { db } from "@/lib/db";
import { scheduleContentPipelinePost } from "@/lib/meal-plan-queue";
import { buildContentDraft, type ContentDraft } from "@/lib/content-pipeline/reel-draft";
import { getNextAutomationRecipeCandidate } from "@/lib/content-pipeline/pipeline-recipes";
import {
  contentPlatformSchema,
  contentPublishSchema,
  SIMPLE_AUTOMATION_PLATFORMS,
  type ContentPlatform,
  type ContentPublishPayload,
  type ContentPublishResult,
} from "@/lib/content-pipeline/publish-schema";

export const CONTENT_PIPELINE_TIMEZONE = "Asia/Kolkata";
export const CONTENT_PIPELINE_SIMPLE_PLATFORMS = SIMPLE_AUTOMATION_PLATFORMS;

type ScheduledPostWithAttempts = Prisma.ContentPipelineScheduledPostGetPayload<{
  include: { publishAttempts: true };
}>;

type AutomationRuleWithPosts = Prisma.ContentPipelineAutomationRuleGetPayload<{
  include: { scheduledPosts: { orderBy: { scheduledAt: "desc" }; take: 1 } };
}>;

export type ContentPipelineScheduledPostSummary = {
  id: string;
  recipeId: string | null;
  recipeTitle: string;
  recipeUrl: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  platforms: ContentPlatform[];
  status: ContentPipelineScheduleStatus;
  source: ContentPipelineScheduleSource;
  scheduledAt: string;
  processedAt: string | null;
  lastError: string | null;
  attempts: number;
  automationRuleId: string | null;
  createdAt: string;
  publishAttempts: ContentPipelinePublishAttemptSummary[];
};

export type ContentPipelinePublishAttemptSummary = ContentPublishResult & {
  reactionCount: number | null;
  commentCount: number | null;
  shareCount: number | null;
  viewCount: number | null;
  metricsSyncedAt: string | null;
};

export type ContentPipelineAutomationRuleSummary = {
  id: string;
  name: string;
  isActive: boolean;
  platforms: ContentPlatform[];
  timeSlots: string[];
  daysOfWeek: number[];
  timezone: string;
  lastScheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
  nextScheduledAt: string | null;
};

function workerSecret() {
  return (
    process.env.MEAL_PLAN_WORKER_SECRET ||
    (process.env.NODE_ENV !== "production" ? "local-meal-plan-worker" : "")
  );
}

function internalAppUrl() {
  return process.env.INTERNAL_APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

function jsonArray(value: Prisma.JsonValue | null | undefined) {
  return Array.isArray(value) ? value : [];
}

export function platformArray(value: Prisma.JsonValue | null | undefined): ContentPlatform[] {
  return jsonArray(value).filter((item): item is ContentPlatform =>
    typeof item === "string" && contentPlatformSchema.safeParse(item).success
  );
}

export function timeSlotArray(value: Prisma.JsonValue | null | undefined) {
  return jsonArray(value)
    .filter((item): item is string => typeof item === "string")
    .filter((item) => /^([01]\d|2[0-3]):[0-5]\d$/.test(item))
    .sort();
}

export function dayArray(value: Prisma.JsonValue | null | undefined) {
  return jsonArray(value)
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item >= 0 && item <= 6);
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function istDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CONTENT_PIPELINE_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value),
    day: Number(parts.find((part) => part.type === "day")?.value),
  };
}

function isoDateFromUtcDay(day: Date) {
  return `${day.getUTCFullYear()}-${pad(day.getUTCMonth() + 1)}-${pad(day.getUTCDate())}`;
}

function dateFromIstWallTime(dateKey: string, timeSlot: string) {
  return new Date(`${dateKey}T${timeSlot}:00+05:30`);
}

function dayOfWeekInIst(dateKey: string) {
  return new Date(`${dateKey}T12:00:00+05:30`).getUTCDay();
}

export function nextAutomationOccurrence({
  timeSlots,
  daysOfWeek,
  from = new Date(),
}: {
  timeSlots: string[];
  daysOfWeek?: number[];
  from?: Date;
}) {
  const slots = timeSlots.filter((item) => /^([01]\d|2[0-3]):[0-5]\d$/.test(item)).sort();
  if (!slots.length) return null;

  const allowedDays = daysOfWeek?.length ? new Set(daysOfWeek) : null;
  const parts = istDateParts(from);
  const baseUtc = Date.UTC(parts.year, parts.month - 1, parts.day);
  const earliest = new Date(from.getTime() + 15_000);

  for (let offset = 0; offset < 31; offset += 1) {
    const dateKey = isoDateFromUtcDay(new Date(baseUtc + offset * 86_400_000));
    if (allowedDays && !allowedDays.has(dayOfWeekInIst(dateKey))) continue;

    for (const slot of slots) {
      const candidate = dateFromIstWallTime(dateKey, slot);
      if (candidate > earliest) return candidate;
    }
  }

  return null;
}

function buildPublishPayloadFromDraft(
  draft: ContentDraft,
  platforms: ContentPlatform[]
): ContentPublishPayload {
  return {
    recipeId: draft.recipeId,
    recipeTitle: draft.recipeTitle,
    recipeUrl: draft.recipeUrl,
    imageUrl: draft.imageUrl,
    videoUrl: undefined,
    instagramCaption: draft.instagramCaption,
    facebookPost: draft.facebookPost,
    pinterestTitle: draft.pinterestTitle,
    pinterestDescription: draft.pinterestDescription,
    youtubeTitle: draft.youtubeTitle,
    youtubeDescription: draft.youtubeDescription,
    xPost: draft.xPost,
    linkedinPost: draft.linkedinPost,
    platforms,
  };
}

function resultStatus(results: ContentPublishResult[]) {
  const successful = results.filter((result) => result.status === "published" || result.status === "dry_run");
  if (results.length && successful.length === results.length) {
    return ContentPipelineScheduleStatus.COMPLETED;
  }
  if (successful.length > 0) return ContentPipelineScheduleStatus.PARTIAL_FAILED;
  return ContentPipelineScheduleStatus.FAILED;
}

function resultError(results: ContentPublishResult[]) {
  const failed = results.filter((result) => result.status !== "published" && result.status !== "dry_run");
  return failed.map((result) => `${result.platform}: ${result.message}`).join("\n") || null;
}

function normalizeAutomationPlatforms(platforms: ContentPlatform[]) {
  const allowed = new Set(SIMPLE_AUTOMATION_PLATFORMS);
  return platforms.filter((platform) => allowed.has(platform));
}

function isScheduleStateUnavailableError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P1001" ||
      error.code === "P1002" ||
      error.code === "P1017")
  );
}

function isSchedulingSchemaMissingError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2021" || error.code === "P2022")
  );
}

export async function ensureContentPipelineSchedulingSchema() {
  // PostgreSQL schema changes are applied by Prisma migrations during deploy.
}

export async function createScheduledContentPost(input: {
  payload: ContentPublishPayload;
  recipeId?: string | null;
  scheduledAt: Date;
  source?: ContentPipelineScheduleSource;
  automationRuleId?: string | null;
  createdById?: string | null;
  createdByName?: string | null;
}) {
  await ensureContentPipelineSchedulingSchema();
  const parsed = contentPublishSchema.parse(input.payload);
  const post = await db.contentPipelineScheduledPost.create({
    data: {
      recipeTitle: parsed.recipeTitle,
      recipeUrl: parsed.recipeUrl || "",
      recipeId: input.recipeId || null,
      imageUrl: parsed.imageUrl || null,
      videoUrl: parsed.videoUrl || null,
      platforms: parsed.platforms,
      contentJson: parsed,
      source: input.source || ContentPipelineScheduleSource.MANUAL,
      scheduledAt: input.scheduledAt,
      automationRuleId: input.automationRuleId || null,
      createdById: input.createdById || null,
      createdByName: input.createdByName || null,
    },
  });

  await scheduleContentPipelinePost(post.id, input.scheduledAt);
  return post;
}

const RECIPE_REUSE_BLOCKING_STATUSES = [
  ContentPipelineScheduleStatus.SCHEDULED,
  ContentPipelineScheduleStatus.PROCESSING,
  ContentPipelineScheduleStatus.COMPLETED,
  ContentPipelineScheduleStatus.PARTIAL_FAILED,
  ContentPipelineScheduleStatus.FAILED,
];
const NON_BLOCKING_CANCEL_REASONS = [
  "Automation queue repaired.",
  "Automation rule changed.",
  "Automation rule deleted.",
];

function recipeReuseBlockingWhere(recipeId?: string, excludePostId?: string): Prisma.ContentPipelineScheduledPostWhereInput {
  return {
    ...(recipeId ? { recipeId } : { recipeId: { not: null } }),
    ...(excludePostId ? { id: { not: excludePostId } } : {}),
    OR: [
      { status: { in: RECIPE_REUSE_BLOCKING_STATUSES } },
      {
        status: ContentPipelineScheduleStatus.CANCELLED,
        OR: [{ lastError: null }, { lastError: { notIn: NON_BLOCKING_CANCEL_REASONS } }],
      },
    ],
  };
}

async function chooseAutomationRecipe() {
  const consumedPosts = await db.contentPipelineScheduledPost.findMany({
    where: recipeReuseBlockingWhere(),
    orderBy: { createdAt: "desc" },
    select: { recipeId: true },
  });
  const consumedRecipeIds = Array.from(
    new Set(consumedPosts.flatMap((post) => (post.recipeId ? [post.recipeId] : [])))
  );
  return getNextAutomationRecipeCandidate(consumedRecipeIds);
}

async function recipeHasBlockingHistory(recipeId: string, excludePostId?: string) {
  const count = await db.contentPipelineScheduledPost.count({
    where: recipeReuseBlockingWhere(recipeId, excludePostId),
  });
  return count > 0;
}

async function cancelRuleFutureQueue(ruleId: string, excludePostId?: string | null) {
  await db.contentPipelineScheduledPost.updateMany({
    where: {
      automationRuleId: ruleId,
      status: ContentPipelineScheduleStatus.SCHEDULED,
      scheduledAt: { gt: new Date() },
      ...(excludePostId ? { id: { not: excludePostId } } : {}),
    },
    data: {
      status: ContentPipelineScheduleStatus.CANCELLED,
      lastError: "Automation queue repaired.",
    },
  });
}

async function normalizeRuleFutureQueue(ruleId: string) {
  const futurePosts = await db.contentPipelineScheduledPost.findMany({
    where: {
      automationRuleId: ruleId,
      status: ContentPipelineScheduleStatus.SCHEDULED,
      scheduledAt: { gt: new Date() },
    },
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }],
  });

  const [nextPost, ...extraPosts] = futurePosts;
  if (extraPosts.length) {
    await db.contentPipelineScheduledPost.updateMany({
      where: { id: { in: extraPosts.map((post) => post.id) } },
      data: {
        status: ContentPipelineScheduleStatus.CANCELLED,
        lastError: "Automation queue repaired.",
      },
    });
  }

  return nextPost ?? null;
}

export async function scheduleNextAutomationPost(ruleId: string, from = new Date()) {
  await ensureContentPipelineSchedulingSchema();
  const rule = await db.contentPipelineAutomationRule.findUnique({ where: { id: ruleId } });
  if (!rule?.isActive) return null;

  const existing = await normalizeRuleFutureQueue(ruleId);
  if (existing) {
    const duplicateRecipe =
      existing.recipeId && (await recipeHasBlockingHistory(existing.recipeId, existing.id));
    if (!duplicateRecipe) return existing;

    await db.contentPipelineScheduledPost.update({
      where: { id: existing.id },
      data: {
        status: ContentPipelineScheduleStatus.CANCELLED,
        lastError: "Cancelled because this recipe was already used in automation history.",
      },
    });
  }

  const platforms = normalizeAutomationPlatforms(platformArray(rule.platforms));
  const scheduledAt = nextAutomationOccurrence({
    timeSlots: timeSlotArray(rule.timeSlots),
    daysOfWeek: dayArray(rule.daysOfWeek),
    from,
  });
  if (!platforms.length || !scheduledAt) return null;

  const recipe = await chooseAutomationRecipe();
  if (!recipe) return null;

  const draft = buildContentDraft(recipe);
  const payload = buildPublishPayloadFromDraft(draft, platforms);
  const post = await db.contentPipelineScheduledPost.create({
    data: {
      recipeId: recipe.id,
      recipeTitle: payload.recipeTitle,
      recipeUrl: payload.recipeUrl || "",
      imageUrl: payload.imageUrl || null,
      videoUrl: null,
      platforms,
      contentJson: payload,
      source: ContentPipelineScheduleSource.AUTOMATION,
      scheduledAt,
      automationRuleId: rule.id,
      createdById: rule.createdById,
      createdByName: rule.createdByName,
    },
  });

  await scheduleContentPipelinePost(post.id, scheduledAt);
  await db.contentPipelineAutomationRule.update({
    where: { id: rule.id },
    data: { lastScheduledAt: scheduledAt },
  });

  return post;
}

export async function cancelScheduledContentPost(postId: string) {
  await ensureContentPipelineSchedulingSchema();
  const post = await db.contentPipelineScheduledPost.findUnique({ where: { id: postId } });
  if (!post) return { error: "Scheduled post not found.", status: 404 as const };
  if (
    post.status !== ContentPipelineScheduleStatus.SCHEDULED &&
    post.status !== ContentPipelineScheduleStatus.FAILED
  ) {
    return { error: "Only scheduled or failed posts can be cancelled.", status: 400 as const };
  }

  await db.contentPipelineScheduledPost.update({
    where: { id: postId },
    data: {
      status: ContentPipelineScheduleStatus.CANCELLED,
      lastError: "Cancelled by admin.",
    },
  });

  if (post.automationRuleId) {
    const nextSearchFrom = new Date(Math.max(post.scheduledAt.getTime() + 60_000, Date.now()));
    await cancelRuleFutureQueue(post.automationRuleId, post.id);
    await scheduleNextAutomationPost(post.automationRuleId, nextSearchFrom);
  }

  return { cancelled: true };
}

async function repairActiveAutomationQueues() {
  const activeRules = await db.contentPipelineAutomationRule.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  for (const rule of activeRules) {
    await scheduleNextAutomationPost(rule.id);
  }
}

async function publishViaInternalApi(payload: ContentPublishPayload) {
  const secret = workerSecret();
  if (!secret) throw new Error("MEAL_PLAN_WORKER_SECRET is required for scheduled publishing.");

  const response = await fetch(`${internalAppUrl()}/api/admin/content-pipeline/publish`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-meal-plan-worker-secret": secret,
    },
    body: JSON.stringify(payload),
  });
  const body = (await response.json().catch(() => null)) as
    | { results?: ContentPublishResult[] }
    | string
    | null;

  if (!response.ok) {
    throw new Error(typeof body === "string" ? body : `Publish request failed with ${response.status}.`);
  }

  return typeof body === "string" ? [] : (body?.results ?? []);
}

export async function runScheduledContentPost(postId: string) {
  await ensureContentPipelineSchedulingSchema();
  const post = await db.contentPipelineScheduledPost.findUnique({ where: { id: postId } });
  if (!post) return { skipped: true, reason: "Scheduled post not found." };
  if (post.status === ContentPipelineScheduleStatus.CANCELLED) {
    return { skipped: true, reason: "Scheduled post is cancelled." };
  }
  if (post.status === ContentPipelineScheduleStatus.COMPLETED) {
    return { skipped: true, reason: "Scheduled post already completed." };
  }
  if (post.scheduledAt.getTime() > Date.now() + 60_000) {
    return { skipped: true, reason: "Scheduled post is not due yet." };
  }

  await db.contentPipelineScheduledPost.update({
    where: { id: post.id },
    data: {
      status: ContentPipelineScheduleStatus.PROCESSING,
      attempts: { increment: 1 },
      lastError: null,
    },
  });

  try {
    const parsed = contentPublishSchema.safeParse(post.contentJson);
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || "Saved publish payload is invalid.");

    const results = await publishViaInternalApi(parsed.data);
    const nextStatus = resultStatus(results);
    const lastError = resultError(results);

    await db.contentPipelineScheduledPost.update({
      where: { id: post.id },
      data: {
        status: nextStatus,
        processedAt: new Date(),
        lastError,
        publishAttempts: {
          create: results.map((result) => ({
            platform: result.platform,
            status: result.status,
            message: result.message,
            externalId: result.id || null,
            externalUrl: result.url || null,
          })),
        },
      },
    });

    if (post.source === ContentPipelineScheduleSource.AUTOMATION && post.automationRuleId) {
      await scheduleNextAutomationPost(post.automationRuleId, new Date(post.scheduledAt.getTime() + 60_000));
    }

    return { status: nextStatus, results };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to publish scheduled post.";
    await db.contentPipelineScheduledPost.update({
      where: { id: post.id },
      data: {
        status: ContentPipelineScheduleStatus.FAILED,
        processedAt: new Date(),
        lastError: message,
      },
    });

    if (post.source === ContentPipelineScheduleSource.AUTOMATION && post.automationRuleId) {
      await scheduleNextAutomationPost(post.automationRuleId, new Date(post.scheduledAt.getTime() + 60_000));
    }

    throw error;
  }
}

export function serializeScheduledPost(post: ScheduledPostWithAttempts): ContentPipelineScheduledPostSummary {
  return {
    id: post.id,
    recipeId: post.recipeId,
    recipeTitle: post.recipeTitle,
    recipeUrl: post.recipeUrl || null,
    imageUrl: post.imageUrl,
    videoUrl: post.videoUrl,
    platforms: platformArray(post.platforms),
    status: post.status,
    source: post.source,
    scheduledAt: post.scheduledAt.toISOString(),
    processedAt: post.processedAt?.toISOString() ?? null,
    lastError: post.lastError,
    attempts: post.attempts,
    automationRuleId: post.automationRuleId,
    createdAt: post.createdAt.toISOString(),
    publishAttempts: post.publishAttempts.map((attempt) => ({
      platform: attempt.platform as ContentPlatform,
      status: attempt.status as ContentPublishResult["status"],
      message: attempt.message,
      id: attempt.externalId ?? undefined,
      url: attempt.externalUrl ?? undefined,
      reactionCount: attempt.reactionCount,
      commentCount: attempt.commentCount,
      shareCount: attempt.shareCount,
      viewCount: attempt.viewCount,
      metricsSyncedAt: attempt.metricsSyncedAt?.toISOString() ?? null,
    })),
  };
}

export function serializeAutomationRule(rule: AutomationRuleWithPosts): ContentPipelineAutomationRuleSummary {
  return {
    id: rule.id,
    name: rule.name,
    isActive: rule.isActive,
    platforms: platformArray(rule.platforms),
    timeSlots: timeSlotArray(rule.timeSlots),
    daysOfWeek: dayArray(rule.daysOfWeek),
    timezone: rule.timezone,
    lastScheduledAt: rule.lastScheduledAt?.toISOString() ?? null,
    createdAt: rule.createdAt.toISOString(),
    updatedAt: rule.updatedAt.toISOString(),
    nextScheduledAt: rule.scheduledPosts[0]?.scheduledAt.toISOString() ?? null,
  };
}

async function readContentPipelineScheduleState() {
  const [scheduledPosts, automationRules] = await Promise.all([
    db.contentPipelineScheduledPost.findMany({
      orderBy: [{ scheduledAt: "desc" }, { createdAt: "desc" }],
      take: 30,
      include: { publishAttempts: { orderBy: { createdAt: "desc" } } },
    }),
    db.contentPipelineAutomationRule.findMany({
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
      include: {
        scheduledPosts: {
          where: {
            status: ContentPipelineScheduleStatus.SCHEDULED,
            scheduledAt: { gt: new Date() },
          },
          orderBy: { scheduledAt: "asc" },
          take: 1,
        },
      },
    }),
  ]);

  return {
    scheduledPosts: scheduledPosts.map(serializeScheduledPost),
    automationRules: automationRules.map(serializeAutomationRule),
  };
}

export async function getContentPipelineScheduleState() {
  try {
    await repairActiveAutomationQueues();
    return await readContentPipelineScheduleState();
  } catch (error) {
    if (isSchedulingSchemaMissingError(error)) {
      console.warn("Content pipeline scheduling tables are missing. Creating them now.");
      await ensureContentPipelineSchedulingSchema();
      await repairActiveAutomationQueues();
      return readContentPipelineScheduleState();
    }
    if (isScheduleStateUnavailableError(error)) {
      console.warn(
        "Content pipeline scheduling state is unavailable because the database connection failed."
      );
      return { scheduledPosts: [], automationRules: [] };
    }
    throw error;
  }
}
