"use client";

import type { Coupon, DiscountType, Plan } from "@prisma/client";
import {
  ArrowLeft,
  BadgePercent,
  CalendarClock,
  Check,
  Layers3,
  LoaderCircle,
  TicketPercent,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type EditableCoupon = Coupon & {
  PlanOnCoupon: { plan: Plan }[];
  _count: { UserCoupon: number };
};

const dateInputValue = (value: Date | null) =>
  value ? new Date(value).toISOString().slice(0, 10) : "";

function discountLabel(coupon: EditableCoupon) {
  if (!coupon.discountValue) return "Pending";
  return coupon.discountType === "CART_PERCENTAGE"
    ? `${coupon.discountValue}% off`
    : `Rs ${coupon.discountValue} off`;
}

export function CouponEditor({ coupon, plans }: { coupon: EditableCoupon; plans: Plan[] }) {
  const expired = Boolean(coupon.expiryDate && coupon.expiryDate < new Date());
  const configured = Boolean(coupon.code && coupon.discountValue && coupon.discountValue > 0);
  const completion = configured ? 100 : coupon.code ? 50 : 0;
  const status = expired ? "Expired" : coupon.isActive ? "Live" : "Draft";

  return (
    <div className="min-w-0 space-y-6 overflow-x-clip">
      <section className="admin-taxonomy-hero rounded-[32px] p-5 sm:p-7">
        <div className="relative z-[1] flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-4">
            <Button variant="outline" className="admin-taxonomy-hero-action rounded-xl" asChild>
              <Link href="/admin/coupons">
                <ArrowLeft className="size-4" />
                Coupons catalogue
              </Link>
            </Button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={coupon.isActive && !expired ? "default" : "outline"}>{status}</Badge>
                {!configured && <Badge variant="secondary">Setup incomplete</Badge>}
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{coupon.code}</h1>
              <p className="admin-taxonomy-hero-copy mt-2 text-sm sm:text-base">
                Create clear membership offers, control eligibility and publish only when ready.
              </p>
            </div>
          </div>
          <CouponEditorActions coupon={coupon} canPublish={configured && !expired} />
        </div>
        <div className="relative z-[1] mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <EditorStat icon={BadgePercent} label="Saving" value={discountLabel(coupon)} />
          <EditorStat
            icon={Layers3}
            label="Eligible plans"
            value={coupon.PlanOnCoupon.length ? `${coupon.PlanOnCoupon.length} selected` : "All paid plans"}
          />
          <EditorStat
            icon={CalendarClock}
            label="Expires"
            value={coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString("en-IN") : "No expiry"}
          />
          <EditorStat icon={TicketPercent} label="Redemptions" value={String(coupon._count.UserCoupon)} />
        </div>
        <div className="relative z-[1] mt-6">
          <div className="mb-2 flex justify-between text-xs font-medium text-muted-foreground">
            <span>Activation readiness</span>
            <span>{completion}%</span>
          </div>
          <Progress value={completion} className="h-2.5" />
        </div>
      </section>

      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(430px,1fr)_minmax(360px,0.9fr)]">
        <CouponConfigurationCard coupon={coupon} plans={plans} />
        <CouponPreviewCard coupon={coupon} />
      </div>
    </div>
  );
}

function CouponEditorActions({ coupon, canPublish }: { coupon: EditableCoupon; canPublish: boolean }) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);

  async function updatePublication(checked: boolean) {
    try {
      setUpdating(true);
      const response = await fetch(`/api/coupons/${coupon.id}/${checked ? "publish" : "unpublish"}`, {
        method: "PATCH",
      });
      if (!response.ok) {
        const message = await response.json().catch(() => "Offer state could not be updated");
        throw new Error(typeof message === "string" ? message : "Offer state could not be updated");
      }
      toast.success(checked ? "Coupon published" : "Coupon unpublished");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Offer state could not be updated");
    } finally {
      setUpdating(false);
    }
  }

  async function deleteCoupon() {
    try {
      setUpdating(true);
      const response = await fetch(`/api/coupons/${coupon.id}`, { method: "DELETE" });
      if (!response.ok) {
        const message = await response.json().catch(() => "Coupon could not be deleted");
        throw new Error(typeof message === "string" ? message : "Coupon could not be deleted");
      }
      toast.success("Coupon deleted");
      router.push("/admin/coupons");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Coupon could not be deleted");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 rounded-2xl border bg-background/80 px-4 py-2.5">
        <Switch
          checked={coupon.isActive}
          disabled={updating || (!coupon.isActive && !canPublish)}
          onCheckedChange={(checked) => void updatePublication(checked)}
          className="cursor-pointer"
        />
        <span className="text-sm font-medium">{coupon.isActive ? "Live" : "Draft"}</span>
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="icon" className="size-11 rounded-2xl" disabled={updating}>
            <Trash2 className="size-4" />
            <span className="sr-only">Delete coupon</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {coupon.code}?</AlertDialogTitle>
            <AlertDialogDescription>
              Unused coupons can be removed permanently. Redeemed coupons are retained for order history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void deleteCoupon()}>
              Delete coupon
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CouponConfigurationCard({ coupon, plans }: { coupon: EditableCoupon; plans: Plan[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [code, setCode] = useState(coupon.code);
  const [description, setDescription] = useState(coupon.description ?? "");
  const [discountType, setDiscountType] = useState<DiscountType>(coupon.discountType);
  const [discountValue, setDiscountValue] = useState(String(coupon.discountValue ?? ""));
  const [expiryDate, setExpiryDate] = useState(dateInputValue(coupon.expiryDate));
  const [selectedPlans, setSelectedPlans] = useState(
    coupon.PlanOnCoupon.map(({ plan }) => plan.id)
  );

  const paidPlans = plans.filter((plan) => !/free|freemium/i.test(plan.name));

  function updatePlan(planId: string, checked: boolean) {
    setSelectedPlans((current) =>
      checked ? [...new Set([...current, planId])] : current.filter((id) => id !== planId)
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = Number(discountValue);
    if (code.trim().length < 3 || !Number.isFinite(value) || value <= 0) {
      toast.error("Enter a valid code and discount value");
      return;
    }
    if (discountType === "CART_PERCENTAGE" && value > 100) {
      toast.error("Percentage discount cannot exceed 100%");
      return;
    }
    try {
      setSaving(true);
      const response = await fetch(`/api/coupons/${coupon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          description: description.trim() || null,
          discountType,
          discountValue: value,
          expiryDate: expiryDate ? new Date(`${expiryDate}T23:59:59.999`).toISOString() : null,
          products: selectedPlans,
        }),
      });
      if (!response.ok) {
        const message = await response.json().catch(() => "Coupon could not be saved");
        throw new Error(typeof message === "string" ? message : "Coupon could not be saved");
      }
      toast.success("Coupon configuration saved");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Coupon could not be saved");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="gap-0 overflow-hidden rounded-3xl py-0">
      <CardHeader className="border-b px-5 py-5 sm:px-6">
        <CardTitle>Offer configuration</CardTitle>
        <CardDescription>Set the code, saving and memberships where this offer can be redeemed.</CardDescription>
      </CardHeader>
      <CardContent className="px-5 py-6 sm:px-6">
        <form className="space-y-5" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="coupon-code">Coupon code</Label>
              <Input
                id="coupon-code"
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                className="h-12 rounded-xl uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coupon-expiry">Expiry date</Label>
              <Input
                id="coupon-expiry"
                type="date"
                value={expiryDate}
                onChange={(event) => setExpiryDate(event.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="coupon-description">Campaign note</Label>
            <Textarea
              id="coupon-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="e.g. Welcome offer for new monthly members"
              className="min-h-20 resize-none rounded-xl"
            />
          </div>
          <div className="grid gap-4 border-t pt-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Discount type</Label>
              <Select value={discountType} onValueChange={(value) => setDiscountType(value as DiscountType)}>
                <SelectTrigger className="!h-12 w-full rounded-xl px-4">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CART_PERCENTAGE">Percentage off</SelectItem>
                  <SelectItem value="FIXED_PRODUCT">Flat amount off</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount-value">
                {discountType === "CART_PERCENTAGE" ? "Discount percentage" : "Discount amount"}
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {discountType === "CART_PERCENTAGE" ? "%" : "Rs"}
                </span>
                <Input
                  id="discount-value"
                  type="number"
                  min="0.01"
                  max={discountType === "CART_PERCENTAGE" ? "100" : undefined}
                  step="0.01"
                  value={discountValue}
                  onChange={(event) => setDiscountValue(event.target.value)}
                  className="h-12 rounded-xl pl-10"
                />
              </div>
            </div>
          </div>
          <div className="border-t pt-5">
            <div className="mb-4">
              <p className="text-sm font-semibold">Eligible memberships</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Leave all unchecked to apply this offer to every paid published plan.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {paidPlans.map((plan) => (
                <label
                  key={plan.id}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border bg-muted/20 p-3"
                >
                  <Checkbox
                    checked={selectedPlans.includes(plan.id)}
                    onCheckedChange={(checked) => updatePlan(plan.id, checked === true)}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="block text-sm font-medium">{plan.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {plan.durationDays ? `${plan.durationDays} days` : "Duration pending"}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>
          <Button type="submit" className="h-12 w-full rounded-xl" disabled={saving}>
            {saving && <LoaderCircle className="size-4 animate-spin" />}
            Save offer configuration
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function CouponPreviewCard({ coupon }: { coupon: EditableCoupon }) {
  return (
    <Card className="gap-0 overflow-hidden rounded-3xl py-0">
      <CardHeader className="border-b px-5 py-5 sm:px-6">
        <CardTitle>Checkout preview</CardTitle>
        <CardDescription>How this offer is explained at payment time.</CardDescription>
      </CardHeader>
      <CardContent className="px-5 py-6 sm:px-6">
        <div className="rounded-[26px] border border-webprimary/25 bg-gradient-to-br from-background via-background to-webprimary/10 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-webprimary">Special offer</p>
          <div className="mt-4 flex items-center justify-between gap-4">
            <h3 className="font-mono text-3xl font-semibold">{coupon.code}</h3>
            <Badge>{discountLabel(coupon)}</Badge>
          </div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            {coupon.description || "Add a short campaign note so the team understands when this offer should be used."}
          </p>
          <div className="mt-6 rounded-2xl border bg-background/70 p-4 text-sm">
            <p className="flex items-center gap-2 font-medium">
              <Check className="size-4 text-webprimary" />
              Applies at membership checkout
            </p>
            <p className="mt-3 text-muted-foreground">
              {coupon.PlanOnCoupon.length
                ? coupon.PlanOnCoupon.map(({ plan }) => plan.name).join(", ")
                : "All paid memberships"}
            </p>
          </div>
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
  icon: typeof BadgePercent;
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
