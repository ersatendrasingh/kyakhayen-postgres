"use client";

import { NotificationAudience, NotificationAutomationTrigger, type NotificationAutomationRule } from "@prisma/client";
import { CalendarClock, LoaderCircle, Pencil, Plus, Trash2, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { MediaField } from "@/components/admin/media/media-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type Segments = {
  foodStyles: Array<{ id: string; name: string }>;
  cuisines: Array<{ id: string; title: string }>;
  mealTimes: Array<{ id: string; title: string }>;
};
type RuleForm = {
  name: string;
  trigger: NotificationAutomationTrigger;
  audience: NotificationAudience;
  segmentType: "FOOD_STYLE" | "CUISINE";
  segmentId: string;
  titleTemplate: string;
  bodyTemplate: string;
  urlTemplate: string;
  imageUrl: string | null;
  scheduleTime: string;
  timezone: string;
  daysOfWeek: number[];
  mealTimeId: string;
};

const ANY_MEAL_TIME = "__ANY__";
const allDays = [0, 1, 2, 3, 4, 5, 6];
const dayOptions = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];

const presets: Record<NotificationAutomationTrigger, Omit<RuleForm, "trigger" | "segmentType" | "segmentId" | "imageUrl">> = {
  TRAFFIC_RECIPE: {
    name: "Breakfast recipe traffic",
    audience: NotificationAudience.ALL_SUBSCRIBERS,
    titleTemplate: "Breakfast ka mood? {{recipeTitle}} ready hai",
    bodyTemplate: "Aaj breakfast me kya khane ka mann hai? Tap karo, tasty idea mil gaya.",
    urlTemplate: "/{{recipePath}}",
    scheduleTime: "06:00",
    timezone: "Asia/Kolkata",
    daysOfWeek: allDays,
    mealTimeId: ANY_MEAL_TIME,
  },
  RECIPE_PUBLISHED: {
    name: "New matching recipe published",
    audience: NotificationAudience.PREFERENCE_SEGMENT,
    titleTemplate: "New {{preference}} recipe: {{recipeTitle}}",
    bodyTemplate: "A fresh recipe matching your preference is ready. Tap to see what is cooking today.",
    urlTemplate: "/{{recipePath}}",
    scheduleTime: "",
    timezone: "Asia/Kolkata",
    daysOfWeek: allDays,
    mealTimeId: ANY_MEAL_TIME,
  },
  MEAL_PLAN_READY: {
    name: "Meal plan ready",
    audience: NotificationAudience.USER,
    titleTemplate: "Your meal plan is ready",
    bodyTemplate: "Your personalised dishes are waiting. Open the plan and start cooking.",
    urlTemplate: "/meal-plan",
    scheduleTime: "",
    timezone: "Asia/Kolkata",
    daysOfWeek: allDays,
    mealTimeId: ANY_MEAL_TIME,
  },
  MEAL_REMINDER: {
    name: "Meal reminders",
    audience: NotificationAudience.USER,
    titleTemplate: "{{meal}} is coming up",
    bodyTemplate: "Recipe pick: {{recipeTitle}}. Open it before you start cooking.",
    urlTemplate: "/{{recipePath}}",
    scheduleTime: "",
    timezone: "Asia/Kolkata",
    daysOfWeek: allDays,
    mealTimeId: ANY_MEAL_TIME,
  },
  MEMBERSHIP_EXPIRY: {
    name: "Membership expiry reminder",
    audience: NotificationAudience.USER,
    titleTemplate: "Your membership {{expiryAction}}",
    bodyTemplate: "{{planName}} access ends {{expiryTiming}}. Renew to continue personalised meal planning.",
    urlTemplate: "/subscription-plans",
    scheduleTime: "",
    timezone: "Asia/Kolkata",
    daysOfWeek: allDays,
    mealTimeId: ANY_MEAL_TIME,
  },
  PAYMENT_SUCCESS: {
    name: "Payment successful",
    audience: NotificationAudience.USER,
    titleTemplate: "Your membership is active",
    bodyTemplate: "{{planName}} access is confirmed. Your personalised meal planning is ready.",
    urlTemplate: "/user/subscriptions",
    scheduleTime: "",
    timezone: "Asia/Kolkata",
    daysOfWeek: allDays,
    mealTimeId: ANY_MEAL_TIME,
  },
  PAYMENT_FAILED: {
    name: "Payment failed",
    audience: NotificationAudience.USER,
    titleTemplate: "Payment could not be completed",
    bodyTemplate: "Your membership payment was unsuccessful. Try again or contact support if you need help.",
    urlTemplate: "/subscription-plans",
    scheduleTime: "",
    timezone: "Asia/Kolkata",
    daysOfWeek: allDays,
    mealTimeId: ANY_MEAL_TIME,
  },
};

function freshForm(trigger: NotificationAutomationTrigger = NotificationAutomationTrigger.TRAFFIC_RECIPE): RuleForm {
  return { ...presets[trigger], daysOfWeek: [...presets[trigger].daysOfWeek], trigger, segmentType: "FOOD_STYLE", segmentId: "", imageUrl: null };
}
function labelForTrigger(trigger: NotificationAutomationTrigger) {
  return {
    TRAFFIC_RECIPE: "Recurring recipe traffic",
    RECIPE_PUBLISHED: "Recipe published",
    MEAL_PLAN_READY: "Meal plan generated",
    MEAL_REMINDER: "Scheduled meal reminder",
    MEMBERSHIP_EXPIRY: "Membership expiring",
    PAYMENT_SUCCESS: "Payment successful",
    PAYMENT_FAILED: "Payment failed",
  }[trigger];
}
function parseDaysOfWeek(value: string | null) {
  const parsed = (value || "")
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isInteger(item) && item >= 0 && item <= 6);
  return parsed.length ? Array.from(new Set(parsed)) : allDays;
}
function formatDate(value: Date | string | null) {
  return value
    ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
    : null;
}
function scheduleSummary(rule: NotificationAutomationRule) {
  if (rule.trigger !== NotificationAutomationTrigger.TRAFFIC_RECIPE) return null;
  const days = parseDaysOfWeek(rule.daysOfWeek);
  const dayLabel = days.length === 7 ? "Daily" : dayOptions.filter((day) => days.includes(day.value)).map((day) => day.label).join(", ");
  const nextRun = formatDate(rule.nextRunAt);
  return `${dayLabel} at ${rule.scheduleTime || "--:--"} ${rule.timezone || "Asia/Kolkata"}${nextRun ? ` | Next ${nextRun}` : ""}`;
}

export function AutomationRulesPanel({ rules, segments }: { rules: NotificationAutomationRule[]; segments: Segments }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<NotificationAutomationRule | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [form, setForm] = useState<RuleForm>(freshForm());

  function beginNew() {
    setEditing(null);
    setForm(freshForm());
    setOpen(true);
  }
  function beginEdit(rule: NotificationAutomationRule) {
    setEditing(rule);
    setForm({
      name: rule.name,
      trigger: rule.trigger,
      audience: rule.audience,
      segmentType: rule.segmentType === "CUISINE" ? "CUISINE" : "FOOD_STYLE",
      segmentId: rule.segmentId || "",
      titleTemplate: rule.titleTemplate,
      bodyTemplate: rule.bodyTemplate,
      urlTemplate: rule.urlTemplate || "/",
      imageUrl: rule.imageUrl,
      scheduleTime: rule.scheduleTime || presets[rule.trigger].scheduleTime,
      timezone: rule.timezone || "Asia/Kolkata",
      daysOfWeek: parseDaysOfWeek(rule.daysOfWeek),
      mealTimeId: rule.mealTimeId || ANY_MEAL_TIME,
    });
    setOpen(true);
  }
  async function changeStatus(rule: NotificationAutomationRule, isActive: boolean) {
    try {
      setBusyId(rule.id);
      const response = await fetch(`/api/admin/notification-automations/${rule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(typeof result === "string" ? result : "Unable to update automation.");
      toast.success(`${rule.name} ${isActive ? "resumed" : "paused"}.`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update automation.");
    } finally {
      setBusyId(null);
    }
  }
  async function saveRule() {
    try {
      setSaving(true);
      const response = await fetch(editing ? `/api/admin/notification-automations/${editing.id}` : "/api/admin/notification-automations", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          mealTimeId: form.mealTimeId === ANY_MEAL_TIME ? null : form.mealTimeId,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(typeof result === "string" ? result : "Unable to save automation.");
      toast.success(editing ? "Automation rule updated." : "Automation rule created.");
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save automation.");
    } finally {
      setSaving(false);
    }
  }
  async function deleteRule(rule: NotificationAutomationRule) {
    try {
      setBusyId(rule.id);
      const response = await fetch(`/api/admin/notification-automations/${rule.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(typeof result === "string" ? result : "Unable to delete automation.");
      toast.success("Automation rule deleted.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete automation.");
    } finally {
      setBusyId(null);
    }
  }

  const activeCount = rules.filter((rule) => rule.isActive).length;
  const currentSegments = form.segmentType === "CUISINE" ? segments.cuisines : segments.foodStyles;
  const isTrafficRule = form.trigger === NotificationAutomationTrigger.TRAFFIC_RECIPE;
  const usesPreferenceSegment =
    form.trigger === NotificationAutomationTrigger.RECIPE_PUBLISHED ||
    (isTrafficRule && form.audience === NotificationAudience.PREFERENCE_SEGMENT);
  const canSave =
    !saving &&
    Boolean(form.name.trim()) &&
    Boolean(form.titleTemplate.trim()) &&
    Boolean(form.bodyTemplate.trim()) &&
    (!usesPreferenceSegment || Boolean(form.segmentId)) &&
    (!isTrafficRule || (Boolean(form.scheduleTime) && form.daysOfWeek.length > 0));

  return (
    <>
      <section className="rounded-[28px] border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Automation rules</h2>
            <p className="mt-1 text-sm text-muted-foreground">Control event triggers, audience matching and templates without code changes.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">{activeCount} active</Badge>
            <Button size="sm" onClick={beginNew}><Plus /> New rule</Button>
          </div>
        </div>
        <div className="mt-5 space-y-2">
          {rules.map((rule) => (
            <div key={rule.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{rule.name}</p>
                  {rule.isSystem ? <Badge variant="outline">Built-in</Badge> : <Badge variant="secondary">Custom</Badge>}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  <Zap className="mr-1 inline size-3" />{labelForTrigger(rule.trigger)}
                  {rule.segmentId ? ` | ${rule.segmentType === "CUISINE" ? "Cuisine" : "Food style"} match` : ""}
                </p>
                {scheduleSummary(rule) ? <p className="mt-1 text-xs text-muted-foreground">{scheduleSummary(rule)}</p> : null}
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={rule.isActive} disabled={busyId === rule.id} aria-label={`${rule.isActive ? "Pause" : "Resume"} ${rule.name}`} onCheckedChange={(checked) => void changeStatus(rule, checked)} />
                <Button size="icon-sm" variant="outline" aria-label={`Edit ${rule.name}`} onClick={() => beginEdit(rule)}><Pencil /></Button>
                {!rule.isSystem ? <Button size="icon-sm" variant="ghost" aria-label={`Delete ${rule.name}`} disabled={busyId === rule.id} onClick={() => void deleteRule(rule)}><Trash2 /></Button> : null}
              </div>
            </div>
          ))}
        </div>
      </section>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[28px] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit automation rule" : "Create automation rule"}</DialogTitle>
            <DialogDescription>When this event happens, an active rule creates a tracked campaign for matching subscribers.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Field label="Rule name"><Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></Field>
            <Field label="Trigger event">
              <Select value={form.trigger} disabled={Boolean(editing?.isSystem)} onValueChange={(value) => setForm({ ...freshForm(value as NotificationAutomationTrigger), imageUrl: form.imageUrl })}>
                <SelectTrigger className="h-12 w-full rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.values(NotificationAutomationTrigger).map((trigger) => <SelectItem key={trigger} value={trigger}>{labelForTrigger(trigger)}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            {isTrafficRule ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Send time">
                    <Input type="time" value={form.scheduleTime} onChange={(event) => setForm((current) => ({ ...current, scheduleTime: event.target.value }))} className="h-12 rounded-xl" />
                  </Field>
                  <Field label="Timezone">
                    <Select value={form.timezone} onValueChange={(timezone) => setForm((current) => ({ ...current, timezone }))}>
                      <SelectTrigger className="h-12 w-full rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Kolkata">Asia/Kolkata</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Audience">
                    <Select value={form.audience} onValueChange={(audience) => setForm((current) => ({ ...current, audience: audience as NotificationAudience, segmentId: "" }))}>
                      <SelectTrigger className="h-12 w-full rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL_SUBSCRIBERS">All subscribed users</SelectItem>
                        <SelectItem value="PREFERENCE_SEGMENT">Matching food preference</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Recipe meal filter">
                    <Select value={form.mealTimeId} onValueChange={(mealTimeId) => setForm((current) => ({ ...current, mealTimeId }))}>
                      <SelectTrigger className="h-12 w-full rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ANY_MEAL_TIME}>Any published recipe</SelectItem>
                        {segments.mealTimes.map((mealTime) => (
                          <SelectItem key={mealTime.id} value={mealTime.id}>{mealTime.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <Field label="Active days">
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                    {dayOptions.map((day) => (
                      <label key={day.value} className="flex h-10 items-center justify-center gap-2 rounded-xl border bg-background text-xs font-medium">
                        <Checkbox
                          checked={form.daysOfWeek.includes(day.value)}
                          onCheckedChange={(checked) =>
                            setForm((current) => ({
                              ...current,
                              daysOfWeek: checked
                                ? Array.from(new Set([...current.daysOfWeek, day.value]))
                                : current.daysOfWeek.filter((value) => value !== day.value),
                            }))
                          }
                        />
                        {day.label}
                      </label>
                    ))}
                  </div>
                </Field>
              </>
            ) : null}
            {usesPreferenceSegment ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Match preference by">
                  <Select value={form.segmentType} onValueChange={(value) => setForm((current) => ({ ...current, segmentType: value as "FOOD_STYLE" | "CUISINE", segmentId: "" }))}>
                    <SelectTrigger className="h-12 w-full rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="FOOD_STYLE">Food style</SelectItem><SelectItem value="CUISINE">Cuisine</SelectItem></SelectContent>
                  </Select>
                </Field>
                <Field label="Matching value">
                  <Select value={form.segmentId} onValueChange={(segmentId) => setForm((current) => ({ ...current, segmentId }))}>
                    <SelectTrigger className="h-12 w-full rounded-xl"><SelectValue placeholder="Select preference" /></SelectTrigger>
                    <SelectContent>{currentSegments.map((segment) => <SelectItem key={segment.id} value={segment.id}>{"title" in segment ? segment.title : segment.name}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
              </div>
            ) : null}
            <Field label="Title template"><Input value={form.titleTemplate} maxLength={120} onChange={(event) => setForm((current) => ({ ...current, titleTemplate: event.target.value }))} /></Field>
            <Field label="Message template"><Textarea value={form.bodyTemplate} maxLength={300} rows={3} onChange={(event) => setForm((current) => ({ ...current, bodyTemplate: event.target.value }))} /></Field>
            <Field label="Open link template"><Input value={form.urlTemplate} onChange={(event) => setForm((current) => ({ ...current, urlTemplate: event.target.value }))} /></Field>
            <p className="rounded-xl bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              Tokens: {form.trigger === NotificationAutomationTrigger.TRAFFIC_RECIPE ? "{{recipeTitle}}, {{recipePath}}, {{recipeUrl}}, {{meal}}, {{ruleName}}, {{sendTime}}" : form.trigger === NotificationAutomationTrigger.RECIPE_PUBLISHED ? "{{recipeTitle}}, {{recipePath}}, {{preference}}" : form.trigger === NotificationAutomationTrigger.MEAL_REMINDER ? "{{meal}}, {{recipeTitle}}, {{recipePath}}" : form.trigger === NotificationAutomationTrigger.MEMBERSHIP_EXPIRY ? "{{planName}}, {{expiryTiming}}, {{expiryAction}}" : form.trigger === NotificationAutomationTrigger.PAYMENT_SUCCESS ? "{{planName}}" : "No tokens required"}
            </p>
            <MediaField label="Notification image (optional)" value={form.imageUrl} onChange={(imageUrl) => setForm((current) => ({ ...current, imageUrl }))} accept="image" disabled={saving} description={form.trigger === NotificationAutomationTrigger.RECIPE_PUBLISHED || isTrafficRule ? "Leave empty to use the recipe image from the database" : "Choose an image from the media library"} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={!canSave} onClick={() => void saveRule()}>
              {saving ? <LoaderCircle className="animate-spin" /> : <CalendarClock />} Save automation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
