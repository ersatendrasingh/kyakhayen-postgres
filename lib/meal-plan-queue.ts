import { NotificationAutomationTrigger, type NotificationAutomationRule } from "@prisma/client";
import { Queue } from "bullmq";
import { formatISO } from "date-fns";

import { db } from "@/lib/db";
import { getRedisConnection } from "@/lib/redis-connection";

const DEFAULT_TRAFFIC_TIMEZONE = "Asia/Kolkata";
const ALL_DAYS_OF_WEEK = [0, 1, 2, 3, 4, 5, 6];
const TRAFFIC_RECIPE_JOB_NAME = "trafficRecipeNotification";

type TrafficRuleSchedule = Pick<
  NotificationAutomationRule,
  "id" | "isActive" | "scheduleTime" | "timezone" | "daysOfWeek" | "nextRunAt"
>;

export function getMealPlanQueue() {
  return new Queue("generateMealPlan", {
    connection: getRedisConnection(),
  });
}

export async function scheduleMealPlanDeliveries(
  userId: string,
  deliveryDates: Date[],
) {
  const queue = getMealPlanQueue();

  try {
    for (const targetDate of deliveryDates) {
      const date = formatISO(targetDate, { representation: "date" });
      const [year, month, day] = date.split("-").map(Number);
      const deliveryAt = new Date(Date.UTC(year, month - 1, day, 10, 30));
      deliveryAt.setUTCDate(deliveryAt.getUTCDate() - 1);

      await queue.add(
        "deliverMealPlanDay",
        { userId, date },
        {
          delay: Math.max(deliveryAt.getTime() - Date.now(), 0),
          jobId: `daily-plan-${userId}-${date}`,
          removeOnComplete: true,
        },
      );
    }
  } finally {
    await queue.close();
  }
}

function notificationTime(date: Date, time: string) {
  const targetDate = formatISO(date, { representation: "date" });
  return new Date(`${targetDate}T${time}+05:30`);
}

function trafficRuleJobId(ruleId: string, sendAt: Date) {
  return `push-traffic-rule-${ruleId}-${sendAt.getTime()}`;
}

function validTimezone(timezone: string | null | undefined) {
  const fallback = DEFAULT_TRAFFIC_TIMEZONE;
  if (!timezone) return fallback;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date());
    return timezone;
  } catch {
    return fallback;
  }
}

function zonedParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value || 0);
  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    hour: value("hour"),
    minute: value("minute"),
    second: value("second"),
  };
}

function timezoneOffsetMs(date: Date, timezone: string) {
  const parts = zonedParts(date, timezone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return asUtc - date.getTime();
}

function zonedLocalTimeToUtc(localDate: Date, time: string, timezone: string) {
  const [hour, minute] = time.split(":").map(Number);
  const utcGuess = new Date(
    Date.UTC(localDate.getUTCFullYear(), localDate.getUTCMonth(), localDate.getUTCDate(), hour, minute, 0),
  );
  return new Date(utcGuess.getTime() - timezoneOffsetMs(utcGuess, timezone));
}

export function normalizeTrafficDays(daysOfWeek?: string | null) {
  const parsed = (daysOfWeek || "")
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6);
  const unique = Array.from(new Set(parsed));
  return unique.length ? unique : ALL_DAYS_OF_WEEK;
}

export function nextTrafficRuleRunAt(rule: Pick<TrafficRuleSchedule, "scheduleTime" | "timezone" | "daysOfWeek">, now = new Date()) {
  if (!rule.scheduleTime || !/^\d{2}:\d{2}$/.test(rule.scheduleTime)) return null;
  const timezone = validTimezone(rule.timezone);
  const days = normalizeTrafficDays(rule.daysOfWeek);
  const current = zonedParts(now, timezone);
  const localDate = new Date(Date.UTC(current.year, current.month - 1, current.day));

  for (let offset = 0; offset < 14; offset += 1) {
    const candidateDate = new Date(localDate);
    candidateDate.setUTCDate(localDate.getUTCDate() + offset);
    if (!days.includes(candidateDate.getUTCDay())) continue;
    const candidate = zonedLocalTimeToUtc(candidateDate, rule.scheduleTime, timezone);
    if (candidate > now) return candidate;
  }

  return null;
}

async function removeTrafficRuleJobs(queue: Queue, ruleId: string, nextRunAt?: Date | string | null) {
  const jobIds = new Set<string>();
  if (nextRunAt) jobIds.add(trafficRuleJobId(ruleId, new Date(nextRunAt)));

  const delayedJobs = await queue.getDelayed(0, -1);
  for (const job of delayedJobs) {
    if (job.name === TRAFFIC_RECIPE_JOB_NAME && job.data?.ruleId === ruleId) {
      jobIds.add(job.id || "");
    }
  }

  await Promise.all(
    Array.from(jobIds)
      .filter(Boolean)
      .map(async (jobId) => {
        try {
          const job = await queue.getJob(jobId);
          await job?.remove();
        } catch {
          // The job may already be active or completed.
        }
      }),
  );
}

export async function removeTrafficNotificationRuleSchedule(ruleId: string, nextRunAt?: Date | string | null) {
  const queue = getMealPlanQueue();
  try {
    await removeTrafficRuleJobs(queue, ruleId, nextRunAt);
    await db.notificationAutomationRule.updateMany({
      where: { id: ruleId },
      data: { nextRunAt: null },
    });
  } finally {
    await queue.close();
  }
}

export async function scheduleTrafficNotificationRule(rule: TrafficRuleSchedule) {
  const queue = getMealPlanQueue();
  try {
    await removeTrafficRuleJobs(queue, rule.id, rule.nextRunAt);
    if (!rule.isActive || !rule.scheduleTime) {
      await db.notificationAutomationRule.update({ where: { id: rule.id }, data: { nextRunAt: null } });
      return null;
    }

    const nextRunAt = nextTrafficRuleRunAt(rule);
    if (!nextRunAt) {
      await db.notificationAutomationRule.update({ where: { id: rule.id }, data: { nextRunAt: null } });
      return null;
    }

    await queue.add(
      TRAFFIC_RECIPE_JOB_NAME,
      { ruleId: rule.id, scheduledFor: nextRunAt.toISOString() },
      {
        delay: Math.max(nextRunAt.getTime() - Date.now(), 0),
        jobId: trafficRuleJobId(rule.id, nextRunAt),
        attempts: 2,
        backoff: { type: "fixed", delay: 5 * 60 * 1000 },
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
    await db.notificationAutomationRule.update({ where: { id: rule.id }, data: { nextRunAt } });
    return nextRunAt;
  } finally {
    await queue.close();
  }
}

export async function syncTrafficNotificationSchedules() {
  const rules = await db.notificationAutomationRule.findMany({
    where: {
      trigger: NotificationAutomationTrigger.TRAFFIC_RECIPE,
      isActive: true,
      scheduleTime: { not: null },
    },
  });

  let scheduled = 0;
  for (const rule of rules) {
    const nextRunAt = await scheduleTrafficNotificationRule(rule);
    if (nextRunAt) scheduled += 1;
  }
  return { scheduled, total: rules.length };
}

export async function scheduleMealReminders(userId: string, deliveryDates: Date[]) {
  const queue = getMealPlanQueue();
  const reminders = [
    { meal: "Breakfast", time: "07:30:00" },
    { meal: "Lunch", time: "12:30:00" },
    { meal: "Dinner", time: "18:30:00" },
  ];

  try {
    for (const targetDate of deliveryDates) {
      const date = formatISO(targetDate, { representation: "date" });
      for (const reminder of reminders) {
        const sendAt = notificationTime(targetDate, reminder.time);
        if (sendAt <= new Date()) continue;
        await queue.add(
          "mealReminder",
          { userId, date, meal: reminder.meal },
          {
            delay: sendAt.getTime() - Date.now(),
            jobId: `push-meal-${userId}-${date}-${reminder.meal.toLowerCase()}`,
            removeOnComplete: true,
          },
        );
      }
    }
  } finally {
    await queue.close();
  }
}

export async function scheduleMembershipExpiryNotifications(
  userId: string,
  assignmentId: string,
  endDate: Date | null,
) {
  if (!endDate) return;
  const queue = getMealPlanQueue();
  const reminders = [
    { key: "three-days", daysBefore: 3, label: "3 days" },
    { key: "today", daysBefore: 0, label: "today" },
  ];

  try {
    for (const reminder of reminders) {
      const sendAt = notificationTime(endDate, "10:00:00");
      sendAt.setDate(sendAt.getDate() - reminder.daysBefore);
      if (sendAt <= new Date()) continue;
      await queue.add(
        "membershipExpiryReminder",
        { userId, assignmentId, label: reminder.label },
        {
          delay: sendAt.getTime() - Date.now(),
          jobId: `push-expiry-${assignmentId}-${reminder.key}`,
          removeOnComplete: true,
        },
      );
    }
  } finally {
    await queue.close();
  }
}

export async function scheduleNotificationCampaign(campaignId: string, scheduledAt: Date) {
  const queue = getMealPlanQueue();
  try {
    await queue.add(
      "sendNotificationCampaign",
      { campaignId },
      {
        delay: Math.max(scheduledAt.getTime() - Date.now(), 0),
        jobId: `push-campaign-${campaignId}`,
        removeOnComplete: true,
      },
    );
  } finally {
    await queue.close();
  }
}

export async function scheduleContentPipelinePost(postId: string, scheduledAt: Date) {
  const queue = getMealPlanQueue();
  try {
    await queue.add(
      "publishContentPipelinePost",
      { postId },
      {
        delay: Math.max(scheduledAt.getTime() - Date.now(), 0),
        jobId: `content-pipeline-post-${postId}`,
        attempts: 2,
        backoff: { type: "exponential", delay: 30000 },
        removeOnComplete: true,
      },
    );
  } finally {
    await queue.close();
  }
}
