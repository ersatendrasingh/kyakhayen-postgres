"use client";

import {
  BarChart3,
  CalendarClock,
  CalendarDays,
  Clock,
  Gauge,
  ListChecks,
  LoaderCircle,
  Pause,
  Pencil,
  Play,
  Plus,
  Repeat2,
  Send,
  Trash2,
  TrendingUp,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import type {
  ContentPipelineAutomationRuleSummary,
  ContentPipelineScheduledPostSummary,
} from "@/lib/content-pipeline/scheduling";
import {
  SIMPLE_AUTOMATION_PLATFORMS,
  type ContentPlatform,
} from "@/lib/content-pipeline/publish-schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type ScheduleStateResponse = {
  scheduledPosts?: ContentPipelineScheduledPostSummary[];
  automationRules?: ContentPipelineAutomationRuleSummary[];
};

type PlatformSelection = Partial<Record<ContentPlatform, boolean>>;

type AutomationFormState = {
  name: string;
  platforms: PlatformSelection;
  timeSlots: string[];
  timeSlotDraft: string;
  daysOfWeek: number[];
};

const DAY_OPTIONS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];
const QUICK_TIME_SLOTS = ["07:30", "09:00", "12:30", "15:30", "18:00", "20:30"];
const DEFAULT_PLATFORMS: PlatformSelection = {
  instagram_photo: true,
  facebook_post: true,
  pinterest_pin: true,
};

function platformLabel(platform: string) {
  const labels: Record<string, string> = {
    instagram_photo: "Instagram Photo",
    facebook_post: "Facebook Post",
    pinterest_pin: "Pinterest Pin",
    x_post: "X Post",
    linkedin_post: "LinkedIn Post",
    instagram_reel: "Instagram Reel",
    facebook_reel: "Facebook Reel",
    youtube_short: "YouTube Short",
  };
  return labels[platform] ?? platform.replaceAll("_", " ");
}

function formatScheduleDate(value: string | null | undefined) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function statusLabel(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

function selectedPlatforms(selection: PlatformSelection) {
  return SIMPLE_AUTOMATION_PLATFORMS.filter((platform) => selection[platform]);
}

function normalizeTimeSlot(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value) ? value : "";
}

function sortUniqueTimeSlots(values: string[]) {
  return Array.from(new Set(values.map(normalizeTimeSlot).filter(Boolean))).sort();
}

function isAttemptSuccess(status: string) {
  return status === "published" || status === "dry_run";
}

async function readResponsePayload<T>(response: Response, fallback: string) {
  const text = await response.text();
  if (!text.trim()) return fallback;

  try {
    return JSON.parse(text) as T | string;
  } catch {
    return fallback;
  }
}

function responseMessage(payload: ScheduleStateResponse | string, fallback: string) {
  return typeof payload === "string" && payload.trim() ? payload : fallback;
}

export function ContentAutomationDashboard({
  initialScheduledPosts,
  initialAutomationRules,
}: {
  initialScheduledPosts: ContentPipelineScheduledPostSummary[];
  initialAutomationRules: ContentPipelineAutomationRuleSummary[];
}) {
  const [scheduledPosts, setScheduledPosts] =
    useState<ContentPipelineScheduledPostSummary[]>(initialScheduledPosts);
  const [automationRules, setAutomationRules] =
    useState<ContentPipelineAutomationRuleSummary[]>(initialAutomationRules);
  const [automationForm, setAutomationForm] = useState<AutomationFormState>({
    name: "Daily recipe social posts",
    platforms: DEFAULT_PLATFORMS,
    timeSlots: ["09:00", "18:00"],
    timeSlotDraft: "12:30",
    daysOfWeek: [],
  });
  const [editingAutomationId, setEditingAutomationId] = useState<string | null>(null);
  const [automationSaving, setAutomationSaving] = useState(false);
  const [automationBusyId, setAutomationBusyId] = useState<string | null>(null);
  const [rulePendingDelete, setRulePendingDelete] =
    useState<ContentPipelineAutomationRuleSummary | null>(null);

  const visibleQueuePosts = scheduledPosts.filter(
    (post) => post.status === "SCHEDULED" || post.status === "PROCESSING"
  );
  const upcomingScheduleCount = scheduledPosts.filter((post) => post.status === "SCHEDULED")
    .length;
  const activeAutomationCount = automationRules.filter((rule) => rule.isActive).length;
  const todayKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const publishedTodayCount = scheduledPosts.filter(
    (post) =>
      post.processedAt &&
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(post.processedAt)) === todayKey &&
      (post.status === "COMPLETED" || post.status === "PARTIAL_FAILED")
  ).length;
  const allAttempts = scheduledPosts.flatMap((post) => post.publishAttempts);
  const successfulAttempts = allAttempts.filter((attempt) => isAttemptSuccess(attempt.status));
  const successRate = allAttempts.length
    ? Math.round((successfulAttempts.length / allAttempts.length) * 100)
    : 0;
  const nextScheduledPost =
    scheduledPosts
      .filter((post) => post.status === "SCHEDULED")
      .sort((left, right) => new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime())[0] ??
    null;
  const platformReports = SIMPLE_AUTOMATION_PLATFORMS.map((platform) => {
    const attempts = allAttempts.filter((attempt) => attempt.platform === platform);
    const latestAttempt = attempts[0] ?? null;
    return {
      platform,
      attempts: attempts.length,
      successful: attempts.filter((attempt) => isAttemptSuccess(attempt.status)).length,
      failed: attempts.filter((attempt) => attempt.status === "failed").length,
      latestAttempt,
      lastStatus: latestAttempt?.status ?? "waiting",
    };
  }).filter((report) => report.attempts > 0);

  const applyScheduleState = (payload: ScheduleStateResponse | string) => {
    if (typeof payload === "string") return;
    setScheduledPosts(payload.scheduledPosts ?? []);
    setAutomationRules(payload.automationRules ?? []);
  };

  const resetAutomationForm = () => {
    setEditingAutomationId(null);
    setAutomationForm({
      name: "Daily recipe social posts",
      platforms: DEFAULT_PLATFORMS,
      timeSlots: ["09:00", "18:00"],
      timeSlotDraft: "12:30",
      daysOfWeek: [],
    });
  };

  const addAutomationTimeSlot = (slot: string = automationForm.timeSlotDraft) => {
    const normalized = normalizeTimeSlot(slot);
    if (!normalized) {
      toast.error("Choose a valid publish time.");
      return;
    }
    setAutomationForm((current) => ({
      ...current,
      timeSlots: sortUniqueTimeSlots([...current.timeSlots, normalized]),
      timeSlotDraft: normalized,
    }));
  };

  const removeAutomationTimeSlot = (slot: string) => {
    setAutomationForm((current) => ({
      ...current,
      timeSlots: current.timeSlots.filter((value) => value !== slot),
    }));
  };

  const submitAutomationRule = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const platforms = selectedPlatforms(automationForm.platforms);
    const timeSlots = sortUniqueTimeSlots(automationForm.timeSlots);
    if (!platforms.length) {
      toast.error("Choose at least one simple post platform.");
      return;
    }
    if (!timeSlots.length) {
      toast.error("Add at least one publish time.");
      return;
    }

    try {
      setAutomationSaving(true);
      const response = await fetch(
        editingAutomationId
          ? `/api/admin/content-pipeline/automation-rules/${editingAutomationId}`
          : "/api/admin/content-pipeline/automation-rules",
        {
          method: editingAutomationId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: automationForm.name,
            platforms,
            timeSlots,
            daysOfWeek: automationForm.daysOfWeek,
            isActive: true,
          }),
        }
      );
      const payload = await readResponsePayload<ScheduleStateResponse>(
        response,
        "Unable to save automation."
      );
      if (!response.ok) {
        throw new Error(responseMessage(payload, "Unable to save automation."));
      }
      applyScheduleState(payload);
      resetAutomationForm();
      toast.success(editingAutomationId ? "Automation updated." : "Automation created.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save automation.");
    } finally {
      setAutomationSaving(false);
    }
  };

  const editAutomationRule = (rule: ContentPipelineAutomationRuleSummary) => {
    setEditingAutomationId(rule.id);
    setAutomationForm({
      name: rule.name,
      platforms: Object.fromEntries(rule.platforms.map((platform) => [platform, true])) as PlatformSelection,
      timeSlots: rule.timeSlots,
      timeSlotDraft: rule.timeSlots[0] ?? "12:30",
      daysOfWeek: rule.daysOfWeek,
    });
  };

  const toggleAutomationRule = async (rule: ContentPipelineAutomationRuleSummary) => {
    try {
      setAutomationBusyId(rule.id);
      const response = await fetch(`/api/admin/content-pipeline/automation-rules/${rule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !rule.isActive }),
      });
      const payload = await readResponsePayload<ScheduleStateResponse>(
        response,
        "Unable to update automation."
      );
      if (!response.ok) {
        throw new Error(responseMessage(payload, "Unable to update automation."));
      }
      applyScheduleState(payload);
      toast.success(rule.isActive ? "Automation paused." : "Automation resumed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update automation.");
    } finally {
      setAutomationBusyId(null);
    }
  };

  const deleteAutomationRule = async () => {
    if (!rulePendingDelete) return;

    const rule = rulePendingDelete;
    try {
      setAutomationBusyId(rule.id);
      const response = await fetch(`/api/admin/content-pipeline/automation-rules/${rule.id}`, {
        method: "DELETE",
      });
      const payload = await readResponsePayload<ScheduleStateResponse>(
        response,
        "Unable to delete automation."
      );
      if (!response.ok) {
        throw new Error(responseMessage(payload, "Unable to delete automation."));
      }
      applyScheduleState(payload);
      if (editingAutomationId === rule.id) resetAutomationForm();
      setRulePendingDelete(null);
      toast.success("Automation deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete automation.");
    } finally {
      setAutomationBusyId(null);
    }
  };

  const cancelScheduledPost = async (post: ContentPipelineScheduledPostSummary) => {
    try {
      const response = await fetch(`/api/admin/content-pipeline/scheduled-posts/${post.id}`, {
        method: "DELETE",
      });
      const payload = await readResponsePayload<ScheduleStateResponse>(
        response,
        "Unable to cancel schedule."
      );
      if (!response.ok) {
        throw new Error(responseMessage(payload, "Unable to cancel schedule."));
      }
      applyScheduleState(payload);
      toast.success("Scheduled post cancelled.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to cancel schedule.");
    }
  };

  return (
    <div className="space-y-5">
      <AlertDialog
        open={Boolean(rulePendingDelete)}
        onOpenChange={(open) => {
          if (!open && automationBusyId !== rulePendingDelete?.id) {
            setRulePendingDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete automation rule?</AlertDialogTitle>
            <AlertDialogDescription>
              {rulePendingDelete
                ? `"${rulePendingDelete.name}" will be deleted and its future queued posts will be cancelled.`
                : "This automation rule will be deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={automationBusyId === rulePendingDelete?.id}>
              Keep rule
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={automationBusyId === rulePendingDelete?.id}
              onClick={(event) => {
                event.preventDefault();
                void deleteAutomationRule();
              }}
            >
              {automationBusyId === rulePendingDelete?.id ? (
                <LoaderCircle className="mr-2 size-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 size-4" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <section className="rounded-[24px] border border-[#eadcc8] bg-[#fffdf8] p-5 shadow-sm dark:border-white/10 dark:bg-[#10221d]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <Badge
              variant="outline"
              className="border-[#ead6b9] bg-white text-[#a86822] dark:border-white/10 dark:bg-white/5"
            >
              <Gauge className="mr-2 size-3.5" />
              Content Automation
            </Badge>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[#30261f] dark:text-[#eef2ec]">
              Schedule social posts from recipes
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6c5b4d] dark:text-[#c9d6cf]">
              Build recurring rules, keep the recipe queue clean, and review platform publish outcomes.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="px-3 py-1">
              {upcomingScheduleCount} queued
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              {activeAutomationCount} active rules
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              {successRate}% success
            </Badge>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border bg-card p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Queued posts", value: upcomingScheduleCount, icon: CalendarClock },
            { label: "Active rules", value: activeAutomationCount, icon: Repeat2 },
            { label: "Published today", value: publishedTodayCount, icon: Send },
            { label: "Success rate", value: `${successRate}%`, icon: TrendingUp },
          ].map((metric) => (
            <div key={metric.label} className="rounded-2xl border bg-background p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">{metric.label}</p>
                <metric.icon className="size-4 text-[#c43127]" />
              </div>
              <p className="mt-3 text-2xl font-semibold">{metric.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-5 2xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
          <div className="rounded-2xl border bg-background p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <ListChecks className="size-5 text-[#c43127]" />
                  Rule builder
                </h2>
                <p className="text-sm text-muted-foreground">
                  Auto-pick skips any recipe already scheduled, published, or failed in automation history.
                </p>
              </div>
              {editingAutomationId && (
                <Button variant="outline" size="sm" onClick={resetAutomationForm}>
                  <XCircle className="mr-2 size-4" />
                  Cancel edit
                </Button>
              )}
            </div>

            <form className="mt-4 grid gap-5" onSubmit={(event) => void submitAutomationRule(event)}>
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
                <div className="space-y-2">
                  <Label htmlFor="automation-name">Rule name</Label>
                  <Input
                    id="automation-name"
                    value={automationForm.name}
                    onChange={(event) =>
                      setAutomationForm((current) => ({ ...current, name: event.target.value }))
                    }
                  />
                </div>
                <div className="rounded-xl border bg-muted/25 p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Recipe source</p>
                  <p className="mt-2 text-sm font-semibold">Next unused ready recipe</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Uses published recipes from the full database, not just the visible list.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="rounded-2xl border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <Label className="font-semibold">Publish times</Label>
                    <Badge variant="outline">Asia/Kolkata</Badge>
                  </div>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <Input
                      type="time"
                      value={automationForm.timeSlotDraft}
                      onChange={(event) =>
                        setAutomationForm((current) => ({
                          ...current,
                          timeSlotDraft: event.target.value,
                        }))
                      }
                      className="sm:max-w-40"
                    />
                    <Button type="button" variant="outline" onClick={() => addAutomationTimeSlot()}>
                      <Plus className="mr-2 size-4" />
                      Add time
                    </Button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {automationForm.timeSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => removeAutomationTimeSlot(slot)}
                        className="inline-flex h-8 items-center gap-2 rounded-md border border-[#d8ad63] bg-[#fff8ed] px-3 text-sm font-semibold text-[#30261f] transition hover:bg-[#ffeccd] dark:bg-[#18342c] dark:text-[#eef2ec]"
                      >
                        <Clock className="size-3.5" />
                        {slot}
                        <XCircle className="size-3.5 opacity-70" />
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {QUICK_TIME_SLOTS.map((slot) => (
                      <Button
                        key={slot}
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => addAutomationTimeSlot(slot)}
                      >
                        {slot}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border p-3">
                  <Label className="font-semibold">Days</Label>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {DAY_OPTIONS.map((day) => {
                      const checked = automationForm.daysOfWeek.includes(day.value);
                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() =>
                            setAutomationForm((current) => ({
                              ...current,
                              daysOfWeek: checked
                                ? current.daysOfWeek.filter((value) => value !== day.value)
                                : [...current.daysOfWeek, day.value].sort(),
                            }))
                          }
                          className={cn(
                            "h-8 rounded-md border px-3 text-xs font-semibold transition",
                            checked
                              ? "border-[#c43127] bg-[#fff1ee] text-[#9d241d]"
                              : "bg-background text-muted-foreground hover:bg-muted"
                          )}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                    <Button
                      type="button"
                      variant={automationForm.daysOfWeek.length ? "outline" : "default"}
                      size="sm"
                      onClick={() => setAutomationForm((current) => ({ ...current, daysOfWeek: [] }))}
                    >
                      Every day
                    </Button>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border p-3">
                <div className="flex items-center justify-between gap-3">
                  <Label className="font-semibold">Simple post platforms</Label>
                  <Badge variant="outline">{selectedPlatforms(automationForm.platforms).length} selected</Badge>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                  {SIMPLE_AUTOMATION_PLATFORMS.map((platform) => (
                    <label
                      key={platform}
                      className={cn(
                        "flex min-h-16 items-center gap-2 rounded-xl border p-3 text-sm transition",
                        automationForm.platforms[platform]
                          ? "border-[#c43127] bg-[#fff6f4]"
                          : "bg-background hover:bg-muted/40"
                      )}
                    >
                      <Checkbox
                        checked={Boolean(automationForm.platforms[platform])}
                        onCheckedChange={(checked) =>
                          setAutomationForm((current) => ({
                            ...current,
                            platforms: { ...current.platforms, [platform]: checked === true },
                          }))
                        }
                      />
                      <span className="font-medium">{platformLabel(platform)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3 rounded-2xl border bg-muted/25 p-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {automationForm.timeSlots.length} slots ·{" "}
                    {automationForm.daysOfWeek.length ? `${automationForm.daysOfWeek.length} days` : "Every day"} ·{" "}
                    {selectedPlatforms(automationForm.platforms).length} platforms
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Queue item will show exact recipe, time, and platform outcome.
                  </p>
                </div>
                <Button type="submit" disabled={automationSaving}>
                  {automationSaving ? (
                    <LoaderCircle className="mr-2 size-4 animate-spin" />
                  ) : editingAutomationId ? (
                    <Pencil className="mr-2 size-4" />
                  ) : (
                    <Plus className="mr-2 size-4" />
                  )}
                  {editingAutomationId ? "Update rule" : "Create rule"}
                </Button>
              </div>
            </form>
          </div>

          <div className="grid gap-4">
            <div className="rounded-2xl border bg-background p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <CalendarDays className="size-5 text-[#c43127]" />
                  Next publish plan
                </h2>
                <Badge variant="outline">{upcomingScheduleCount} queued</Badge>
              </div>
              {nextScheduledPost ? (
                <div className="mt-3 rounded-xl border bg-muted/20 p-3">
                  <div className="grid gap-3 sm:grid-cols-[56px_minmax(0,1fr)] sm:items-center">
                    <div className="relative hidden aspect-square overflow-hidden rounded-lg bg-muted sm:block">
                      {nextScheduledPost.imageUrl ? (
                        <Image
                          src={nextScheduledPost.imageUrl}
                          alt={nextScheduledPost.recipeTitle}
                          fill
                          unoptimized
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <p className="line-clamp-1 font-semibold">{nextScheduledPost.recipeTitle}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatScheduleDate(nextScheduledPost.scheduledAt)}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {nextScheduledPost.platforms.map((platform) => (
                          <Badge key={platform} variant="outline">
                            {platformLabel(platform)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
                  Queue is empty.
                </div>
              )}
            </div>

            <div className="rounded-2xl border bg-background p-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Repeat2 className="size-5 text-[#c43127]" />
                Active automations
              </h2>
              <div className="mt-3 space-y-2">
                {automationRules.length ? (
                  automationRules.map((rule) => (
                    <div key={rule.id} className="rounded-xl border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">{rule.name}</p>
                            <Badge variant="outline">{rule.isActive ? "Active" : "Paused"}</Badge>
                          </div>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">
                            {rule.timeSlots.join(", ")} IST ·{" "}
                            {rule.daysOfWeek.length
                              ? DAY_OPTIONS.filter((day) => rule.daysOfWeek.includes(day.value))
                                  .map((day) => day.label)
                                  .join(", ")
                              : "Every day"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Next: {formatScheduleDate(rule.nextScheduledAt)}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            aria-label={`Edit ${rule.name}`}
                            onClick={() => editAutomationRule(rule)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Delete ${rule.name}`}
                            disabled={automationBusyId === rule.id}
                            onClick={() => setRulePendingDelete(rule)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={automationBusyId === rule.id}
                          onClick={() => void toggleAutomationRule(rule)}
                        >
                          {rule.isActive ? <Pause className="mr-1 size-4" /> : <Play className="mr-1 size-4" />}
                          {rule.isActive ? "Pause" : "Resume"}
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                    No automation rules yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(380px,0.8fr)]">
        <div className="rounded-[24px] border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Clock className="size-5 text-[#c43127]" />
                Scheduled queue
              </h2>
              <p className="text-sm text-muted-foreground">
                Exact recipe, publish time, platform list, and last result.
              </p>
            </div>
            <Badge variant="outline">{upcomingScheduleCount} queued</Badge>
          </div>

          <div className="mt-4 space-y-2">
            {visibleQueuePosts.length ? (
              visibleQueuePosts.map((post) => (
                <div key={post.id} className="rounded-xl border bg-background p-3">
                  <div className="grid gap-3 lg:grid-cols-[72px_minmax(0,1fr)_auto] lg:items-start">
                    <div className="relative hidden aspect-square overflow-hidden rounded-xl bg-muted lg:block">
                      {post.imageUrl ? (
                        <Image
                          src={post.imageUrl}
                          alt={post.recipeTitle}
                          fill
                          unoptimized
                          sizes="72px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="line-clamp-2 font-semibold">{post.recipeTitle}</p>
                        <Badge variant="outline" className="shrink-0">
                          {statusLabel(post.status)}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatScheduleDate(post.scheduledAt)} ·{" "}
                        {post.source === "AUTOMATION" ? "Automation" : "Manual"}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {post.platforms.map((platform) => (
                          <Badge key={platform} variant="outline">
                            {platformLabel(platform)}
                          </Badge>
                        ))}
                      </div>
                      {post.lastError && (
                        <p className="mt-2 line-clamp-2 rounded-lg bg-destructive/10 px-2 py-1 text-xs text-destructive">
                          {post.lastError}
                        </p>
                      )}
                    </div>
                    {post.status === "SCHEDULED" && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void cancelScheduledPost(post)}
                      >
                        <XCircle className="mr-2 size-4" />
                        Cancel
                      </Button>
                    )}
                  </div>
                  {post.publishAttempts.length > 0 && (
                    <div className="mt-3 grid gap-2 border-t pt-3 md:grid-cols-2">
                      {post.publishAttempts.map((attempt, index) => (
                        <div
                          key={`${post.id}-${attempt.platform}-${attempt.status}-${index}`}
                          className="rounded-lg border bg-muted/25 p-2 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold">{platformLabel(attempt.platform)}</span>
                            <Badge variant="outline">{attempt.status.replaceAll("_", " ")}</Badge>
                          </div>
                          <p className="mt-1 text-muted-foreground">{attempt.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed bg-background p-4 text-sm text-muted-foreground">
                No active queue items.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[24px] border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <BarChart3 className="size-5 text-[#c43127]" />
                Platform report
              </h2>
              <p className="text-sm text-muted-foreground">
                Publish attempts grouped by platform.
              </p>
            </div>
            <Badge variant="outline">{allAttempts.length} attempts</Badge>
          </div>
          <div className="mt-4 space-y-2">
            {platformReports.length ? (
              platformReports.map((report) => (
                <div key={report.platform} className="rounded-xl border bg-background p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{platformLabel(report.platform)}</p>
                      <p className="text-xs text-muted-foreground">
                        {report.successful}/{report.attempts} successful · {report.failed} failed
                      </p>
                    </div>
                    <Badge variant="outline">{report.lastStatus.replaceAll("_", " ")}</Badge>
                  </div>
                  {report.latestAttempt?.message ? (
                    <p className="mt-2 text-sm text-muted-foreground">{report.latestAttempt.message}</p>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed bg-background p-4 text-sm text-muted-foreground">
                No publish attempts yet.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
