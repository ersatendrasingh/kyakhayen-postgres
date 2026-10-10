"use client";

import type { Feature, Plan } from "@prisma/client";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CalendarDays,
  Check,
  ListChecks,
  LoaderCircle,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";

type EditablePlan = Plan & {
  features: Feature[];
  _count: { UserPlan: number; PlanOnCoupon: number };
};

const money = (value: number | null) =>
  value == null
    ? "Not set"
    : new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(value);

export function PlanEditor({ plan }: { plan: EditablePlan }) {
  const requiredFields = [plan.name, plan.priceInr, plan.priceUsd, plan.durationDays];
  const completedFields = requiredFields.filter(Boolean).length;
  const completion = (completedFields / requiredFields.length) * 100;
  const canPublish = requiredFields.every(Boolean);

  return (
    <div className="min-w-0 space-y-6 overflow-x-clip">
      <section className="admin-taxonomy-hero rounded-[32px] p-5 sm:p-7">
        <div className="relative z-[1] flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-4">
            <Button variant="outline" className="admin-taxonomy-hero-action rounded-xl" asChild>
              <Link href="/admin/subscription-plans">
                <ArrowLeft className="size-4" />
                Plans catalogue
              </Link>
            </Button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={plan.isPublished ? "default" : "outline"}>
                  {plan.isPublished ? "Published" : "Draft"}
                </Badge>
                {!canPublish && <Badge variant="secondary">Setup incomplete</Badge>}
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                {plan.name}
              </h1>
              <p className="admin-taxonomy-hero-copy mt-2 text-sm sm:text-base">
                Build the offer customers see at pricing and checkout, then publish when ready.
              </p>
            </div>
          </div>
          <PlanEditorActions plan={plan} canPublish={canPublish} />
        </div>
        <div className="relative z-[1] mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <EditorStat icon={Check} label="Setup complete" value={`${completedFields}/4 fields`} />
          <EditorStat icon={CalendarDays} label="Access period" value={plan.durationDays ? `${plan.durationDays} days` : "Pending"} />
          <EditorStat icon={UsersRound} label="Assignments" value={String(plan._count.UserPlan)} />
          <EditorStat icon={ListChecks} label="Benefits" value={`${plan.features.length} listed`} />
        </div>
        <div className="relative z-[1] mt-6">
          <div className="mb-2 flex justify-between text-xs font-medium text-muted-foreground">
            <span>Publishing readiness</span>
            <span>{Math.round(completion)}%</span>
          </div>
          <Progress value={completion} className="h-2.5" />
        </div>
      </section>

      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <PlanConfigurationCard plan={plan} />
        <div className="min-w-0 space-y-6">
          <PlanBenefitsCard
            key={plan.features.map((feature) => `${feature.id}:${feature.position}:${feature.name}`).join("|")}
            planId={plan.id}
            features={plan.features}
          />
          <CustomerPreviewCard plan={plan} />
        </div>
      </div>
    </div>
  );
}

function PlanEditorActions({ plan, canPublish }: { plan: EditablePlan; canPublish: boolean }) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);

  async function updatePublication(checked: boolean) {
    try {
      setUpdating(true);
      const response = await fetch(
        `/api/subscription-plans/${plan.id}/${checked ? "publish" : "unpublish"}`,
        { method: "PATCH" }
      );
      if (!response.ok) throw new Error("Publication failed");
      toast.success(checked ? "Membership plan published" : "Membership plan unpublished");
      router.refresh();
    } catch {
      toast.error("Could not update publication state");
    } finally {
      setUpdating(false);
    }
  }

  async function deletePlan() {
    if (plan._count.UserPlan > 0) {
      toast.error("This plan has member assignments and cannot be deleted");
      return;
    }
    try {
      setUpdating(true);
      const response = await fetch(`/api/subscription-plans/${plan.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Delete failed");
      toast.success("Membership plan deleted");
      router.push("/admin/subscription-plans");
      router.refresh();
    } catch {
      toast.error("Could not delete this membership plan");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 rounded-2xl border bg-background/80 px-4 py-2.5">
        <Switch
          checked={plan.isPublished}
          disabled={updating || (!plan.isPublished && !canPublish)}
          onCheckedChange={(checked) => void updatePublication(checked)}
          className="cursor-pointer"
        />
        <span className="text-sm font-medium">{plan.isPublished ? "Published" : "Draft"}</span>
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="icon" className="size-11 rounded-2xl" disabled={updating}>
            <Trash2 className="size-4" />
            <span className="sr-only">Delete plan</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {plan.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the membership offer and its listed benefits.
              Plans already assigned to members cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void deletePlan()}>
              Delete plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PlanConfigurationCard({ plan }: { plan: EditablePlan }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(plan.name);
  const [durationDays, setDurationDays] = useState(String(plan.durationDays ?? ""));
  const [priceInr, setPriceInr] = useState(String(plan.priceInr ?? ""));
  const [regularPriceInr, setRegularPriceInr] = useState(String(plan.regularPriceInr ?? ""));
  const [priceUsd, setPriceUsd] = useState(String(plan.priceUsd ?? ""));
  const [regularPriceUsd, setRegularPriceUsd] = useState(String(plan.regularPriceUsd ?? ""));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !durationDays || !priceInr || !priceUsd) {
      toast.error("Title, duration and both sale prices are required to publish");
      return;
    }
    try {
      setSaving(true);
      const response = await fetch(`/api/subscription-plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          durationDays: Number(durationDays),
          priceInr: Number(priceInr),
          regularPriceInr: regularPriceInr ? Number(regularPriceInr) : null,
          priceUsd: Number(priceUsd),
          regularPriceUsd: regularPriceUsd ? Number(regularPriceUsd) : null,
        }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => "Plan could not be saved");
        throw new Error(typeof error === "string" ? error : "Plan could not be saved");
      }
      toast.success("Plan configuration saved");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Plan could not be saved");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="gap-0 overflow-hidden rounded-3xl py-0">
      <CardHeader className="border-b px-5 py-5 sm:px-6">
        <CardTitle>Plan configuration</CardTitle>
        <CardDescription>Customer-facing title, access length and checkout pricing.</CardDescription>
      </CardHeader>
      <CardContent className="px-5 py-6 sm:px-6">
        <form className="space-y-5" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="plan-name">Plan title</Label>
            <Input id="plan-name" className="h-11 rounded-xl" value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="plan-duration">Access duration in days</Label>
            <Input id="plan-duration" type="number" min="1" className="h-11 rounded-xl" value={durationDays} onChange={(event) => setDurationDays(event.target.value)} />
          </div>
          <div className="border-t pt-5">
            <p className="mb-4 text-sm font-semibold">India pricing</p>
            <div className="grid grid-cols-2 gap-3">
              <PriceInput id="sale-inr" label="Sale price" value={priceInr} onChange={setPriceInr} prefix="₹" required />
              <PriceInput id="regular-inr" label="Original price" value={regularPriceInr} onChange={setRegularPriceInr} prefix="₹" />
            </div>
          </div>
          <div className="border-t pt-5">
            <p className="mb-4 text-sm font-semibold">International pricing</p>
            <div className="grid grid-cols-2 gap-3">
              <PriceInput id="sale-usd" label="Sale price" value={priceUsd} onChange={setPriceUsd} prefix="$" required />
              <PriceInput id="regular-usd" label="Original price" value={regularPriceUsd} onChange={setRegularPriceUsd} prefix="$" />
            </div>
          </div>
          <Button type="submit" className="h-11 w-full rounded-xl" disabled={saving}>
            {saving && <LoaderCircle className="size-4 animate-spin" />}
            Save configuration
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PriceInput({
  id,
  label,
  value,
  onChange,
  prefix,
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  prefix: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{prefix}</span>
        <Input
          id={id}
          type="number"
          min="0"
          required={required}
          className="h-11 rounded-xl pl-7"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </div>
  );
}

function PlanBenefitsCard({ planId, features }: { planId: string; features: Feature[] }) {
  const router = useRouter();
  const [items, setItems] = useState(features);
  const [newBenefit, setNewBenefit] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [loading, setLoading] = useState(false);

  async function addBenefit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newBenefit.trim()) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/subscription-plans/${planId}/features`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newBenefit.trim() }),
      });
      if (!response.ok) throw new Error("Benefit could not be added");
      setNewBenefit("");
      toast.success("Benefit added");
      router.refresh();
    } catch {
      toast.error("Benefit could not be added");
    } finally {
      setLoading(false);
    }
  }

  async function saveBenefit(id: string) {
    if (!editValue.trim()) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/subscription-plans/${planId}/features/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editValue.trim() }),
      });
      if (!response.ok) throw new Error("Benefit could not be updated");
      setEditingId(null);
      toast.success("Benefit updated");
      router.refresh();
    } catch {
      toast.error("Benefit could not be updated");
    } finally {
      setLoading(false);
    }
  }

  async function removeBenefit(id: string) {
    try {
      setLoading(true);
      const response = await fetch(`/api/subscription-plans/${planId}/features/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Benefit could not be removed");
      toast.success("Benefit removed");
      router.refresh();
    } catch {
      toast.error("Benefit could not be removed");
    } finally {
      setLoading(false);
    }
  }

  async function moveBenefit(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
    try {
      setLoading(true);
      const response = await fetch(`/api/subscription-plans/${planId}/features/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          list: next.map((feature, position) => ({ id: feature.id, position: position + 1 })),
        }),
      });
      if (!response.ok) throw new Error("Benefit order could not be saved");
      router.refresh();
    } catch {
      setItems(features);
      toast.error("Benefit order could not be saved");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="gap-0 overflow-hidden rounded-3xl py-0">
      <CardHeader className="border-b px-5 py-5 sm:px-6">
        <CardTitle>Included benefits</CardTitle>
        <CardDescription>These points appear on your pricing and checkout cards.</CardDescription>
      </CardHeader>
      <CardContent className="px-5 py-6 sm:px-6">
        <form className="relative mb-5" onSubmit={addBenefit}>
          <Input
            value={newBenefit}
            onChange={(event) => setNewBenefit(event.target.value)}
            placeholder="Add a customer-facing benefit"
            className="h-12 rounded-xl pr-14"
          />
          <Button
            type="submit"
            size="icon"
            className="absolute right-1.5 top-1.5 size-9 rounded-lg"
            disabled={loading || !newBenefit.trim()}
            aria-label="Add benefit"
          >
            <Plus className="size-4" />
          </Button>
        </form>
        <div className="space-y-3">
          {items.map((feature, index) => (
            <div key={feature.id} className="flex items-center gap-3 rounded-2xl border bg-muted/25 p-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background text-xs font-semibold text-muted-foreground">
                {index + 1}
              </span>
              {editingId === feature.id ? (
                <Input
                  autoFocus
                  value={editValue}
                  onChange={(event) => setEditValue(event.target.value)}
                  className="h-9 rounded-lg"
                />
              ) : (
                <p className="min-w-0 flex-1 text-sm font-medium">{feature.name}</p>
              )}
              <div className="ml-auto flex items-center gap-1">
                {editingId === feature.id ? (
                  <>
                    <Button type="button" size="icon" variant="ghost" className="size-8 rounded-lg" onClick={() => void saveBenefit(feature.id)} disabled={loading}>
                      <Check className="size-4" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" className="size-8 rounded-lg" onClick={() => setEditingId(null)}>
                      <X className="size-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button type="button" size="icon" variant="ghost" className="size-8 rounded-lg" disabled={loading || index === 0} onClick={() => void moveBenefit(index, -1)}>
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" className="size-8 rounded-lg" disabled={loading || index === items.length - 1} onClick={() => void moveBenefit(index, 1)}>
                      <ArrowDown className="size-4" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" className="size-8 rounded-lg" onClick={() => { setEditingId(feature.id); setEditValue(feature.name); }}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" className="size-8 rounded-lg text-destructive" onClick={() => void removeBenefit(feature.id)} disabled={loading}>
                      <Trash2 className="size-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
          {!items.length && (
            <div className="rounded-2xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
              No benefits listed yet. Add the reasons customers should choose this plan.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CustomerPreviewCard({ plan }: { plan: EditablePlan }) {
  const savings = useMemo(() => {
    if (!plan.regularPriceInr || !plan.priceInr || plan.regularPriceInr <= plan.priceInr) return null;
    return Math.round(((plan.regularPriceInr - plan.priceInr) / plan.regularPriceInr) * 100);
  }, [plan.priceInr, plan.regularPriceInr]);

  return (
    <Card className="gap-0 overflow-hidden rounded-3xl py-0">
      <CardHeader className="border-b px-5 py-5 sm:px-6">
        <CardTitle>Customer card preview</CardTitle>
        <CardDescription>How this membership reads in the pricing experience.</CardDescription>
      </CardHeader>
      <CardContent className="px-5 py-6 sm:px-6">
        <div className="rounded-[26px] border border-webprimary/25 bg-gradient-to-br from-background via-background to-webprimary/10 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-webprimary">Membership</p>
              <h3 className="mt-3 text-2xl font-semibold">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {plan.durationDays ? `${plan.durationDays} days of access` : "Duration pending"}
              </p>
            </div>
            {savings && <Badge>{savings}% off</Badge>}
          </div>
          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-4xl font-semibold">{money(plan.priceInr)}</span>
            {plan.regularPriceInr && (
              <span className="text-base text-muted-foreground line-through">
                {money(plan.regularPriceInr)}
              </span>
            )}
          </div>
          <div className="mt-6 space-y-3">
            {plan.features.slice(0, 4).map((feature) => (
              <p key={feature.id} className="flex items-center gap-2 text-sm">
                <Sparkles className="size-4 text-webprimary" />
                {feature.name}
              </p>
            ))}
          </div>
          <Button className="mt-7 w-full rounded-xl" disabled>
            Choose membership
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EditorStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Check;
  label: string;
  value: string;
}) {
  return (
    <div className="admin-taxonomy-stat rounded-3xl px-5 py-4">
      <p className="admin-taxonomy-stat-label text-sm">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <Icon className="admin-taxonomy-stat-icon size-5" />
        <p className="admin-taxonomy-stat-value text-2xl font-semibold">{value}</p>
      </div>
    </div>
  );
}
