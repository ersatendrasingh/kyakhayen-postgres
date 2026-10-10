"use client";

import type { Feature, Plan } from "@prisma/client";
import {
  BadgeIndianRupee,
  CalendarDays,
  Download,
  EllipsisVertical,
  Layers3,
  Pencil,
  Plus,
  Search,
  Trash2,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PlanDrawer } from "@/components/admin/commerce/plan-drawer";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ManagedPlan = Plan & {
  features: Feature[];
  _count: { UserPlan: number; PlanOnCoupon: number };
};
type DeleteSelection =
  | { type: "single"; plans: ManagedPlan[] }
  | { type: "bulk"; plans: ManagedPlan[] }
  | null;

const formatInr = (amount: number | null) =>
  typeof amount === "number"
    ? new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(amount)
    : "Not set";

export function SubscriptionPlansDashboard({ plans }: { plans: ManagedPlan[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteSelection, setDeleteSelection] = useState<DeleteSelection>(null);
  const [deleting, setDeleting] = useState(false);

  const filteredPlans = useMemo(() => {
    const term = search.trim().toLowerCase();
    return plans.filter((plan) => {
      const matchesSearch =
        !term ||
        plan.name.toLowerCase().includes(term) ||
        plan.slug.toLowerCase().includes(term);
      const matchesStatus =
        status === "all" ||
        (status === "published" && plan.isPublished) ||
        (status === "draft" && !plan.isPublished);
      return matchesSearch && matchesStatus;
    });
  }, [plans, search, status]);
  const selectedPlans = plans.filter((plan) => selected.includes(plan.id));
  const allVisibleSelected =
    filteredPlans.length > 0 &&
    filteredPlans.every((plan) => selected.includes(plan.id));
  const publishedCount = plans.filter((plan) => plan.isPublished).length;
  const assignments = plans.reduce((sum, plan) => sum + plan._count.UserPlan, 0);
  const linkedCoupons = plans.reduce((sum, plan) => sum + plan._count.PlanOnCoupon, 0);

  function toggleAllVisible(checked: boolean) {
    setSelected((current) => {
      const visible = new Set(filteredPlans.map((plan) => plan.id));
      if (checked) return Array.from(new Set([...current, ...visible]));
      return current.filter((id) => !visible.has(id));
    });
  }

  function toggleSelected(id: string, checked: boolean) {
    setSelected((current) =>
      checked
        ? Array.from(new Set([...current, id]))
        : current.filter((item) => item !== id)
    );
  }

  function exportRows(rows: ManagedPlan[], filename: string) {
    const content = [
      ["Plan", "Slug", "Duration", "Price INR", "Benefits", "Members", "Status"],
      ...rows.map((plan) => [
        plan.name,
        plan.slug,
        String(plan.durationDays ?? ""),
        String(plan.priceInr ?? ""),
        String(plan.features.length),
        String(plan._count.UserPlan),
        plan.isPublished ? "Published" : "Draft",
      ]),
    ]
      .map((line) => line.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([content], { type: "text/csv" }));
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function setPublished(plan: ManagedPlan, checked: boolean) {
    try {
      setPublishingId(plan.id);
      const response = await fetch(
        `/api/subscription-plans/${plan.id}/${checked ? "publish" : "unpublish"}`,
        { method: "PATCH" }
      );
      if (!response.ok) throw new Error("Could not update publication state");
      toast.success(
        checked ? "Membership plan published" : "Membership plan unpublished"
      );
      router.refresh();
    } catch {
      toast.error("Could not update this membership plan");
    } finally {
      setPublishingId(null);
    }
  }

  async function confirmDelete() {
    const items = deleteSelection?.plans ?? [];
    if (!items.length) return;
    const assigned = items.filter((plan) => plan._count.UserPlan > 0);
    if (assigned.length) {
      toast.error(
        `${assigned.map((plan) => plan.name).join(", ")} cannot be deleted while members are assigned`
      );
      setDeleteSelection(null);
      return;
    }
    try {
      setDeleting(true);
      for (const plan of items) {
        const response = await fetch(`/api/subscription-plans/${plan.id}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error(`Unable to delete ${plan.name}`);
      }
      toast.success(items.length === 1 ? "Membership plan deleted" : `${items.length} membership plans deleted`);
      setDeleteSelection(null);
      setSelected([]);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete plans");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="admin-taxonomy-hero rounded-[32px] p-5 sm:p-7 lg:p-9">
        <div className="relative z-[1] flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl space-y-3">
            <span className="admin-taxonomy-hero-badge inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em]">
              Commerce
            </span>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Subscription Plans dashboard
              </h1>
              <p className="admin-taxonomy-hero-copy mt-2 text-sm sm:text-base">
                Manage customer access periods, prices and published membership offers.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 sm:flex-nowrap xl:shrink-0">
            <Button
              variant="outline"
              className="admin-taxonomy-hero-action rounded-2xl"
              onClick={() => exportRows(plans, "membership-plans.csv")}
            >
              <Download className="size-4" />
              Export
            </Button>
            <Button className="rounded-2xl shadow-sm" onClick={() => setDrawerOpen(true)}>
              <Plus className="size-4" />
              Add Plan
            </Button>
          </div>
        </div>
        <div className="relative z-[1] mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DashboardStat icon={Layers3} label="Total Plans" value={plans.length} />
          <DashboardStat icon={BadgeIndianRupee} label="Published Plans" value={publishedCount} />
          <DashboardStat icon={UsersRound} label="Active Assignments" value={assignments} />
          <DashboardStat icon={CalendarDays} label="Coupon Links" value={linkedCoupons} />
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-lg">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by plan title"
              className="h-12 rounded-2xl pl-11"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="!h-12 w-[170px] rounded-2xl px-4">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="h-12 rounded-2xl"
              disabled={!selectedPlans.length}
              onClick={() => exportRows(selectedPlans, "selected-membership-plans.csv")}
            >
              <Download className="size-4" />
              Export Selected
            </Button>
            <Button
              variant="outline"
              className="h-12 rounded-2xl"
              disabled={!selectedPlans.length}
              onClick={() => setDeleteSelection({ type: "bulk", plans: selectedPlans })}
            >
              <Trash2 className="size-4" />
              Delete Selected
            </Button>
          </div>
        </div>
        <div className="mt-5 overflow-hidden rounded-3xl border border-border/70">
          <Table>
            <TableHeader className="bg-muted/35">
              <TableRow>
                <TableHead className="w-12 px-4">
                  <Checkbox
                    checked={allVisibleSelected}
                    onCheckedChange={(checked) => toggleAllVisible(checked === true)}
                    aria-label="Select all visible plans"
                  />
                </TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Benefits</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Published</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="px-4">
                    <Checkbox
                      checked={selected.includes(plan.id)}
                      onCheckedChange={(checked) => toggleSelected(plan.id, checked === true)}
                      aria-label={`Select ${plan.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/subscription-plans/${plan.id}`}
                      className="flex items-center gap-3"
                    >
                      <span className="flex size-12 items-center justify-center rounded-2xl border bg-muted/40">
                        <BadgeIndianRupee className="size-5 text-webprimary" />
                      </span>
                      <span>
                        <span className="block font-semibold">{plan.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {plan.durationDays ? `${plan.durationDays} days of access` : "Duration pending"}
                        </span>
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell>{plan.durationDays ? `${plan.durationDays} days` : "Pending"}</TableCell>
                  <TableCell>
                    <p className="font-semibold">{formatInr(plan.priceInr)}</p>
                    {plan.regularPriceInr && (
                      <p className="text-sm text-muted-foreground line-through">
                        {formatInr(plan.regularPriceInr)}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>{plan.features.length} listed</TableCell>
                  <TableCell>{plan._count.UserPlan}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={plan.isPublished}
                        disabled={publishingId === plan.id}
                        onCheckedChange={(checked) => void setPublished(plan, checked)}
                        className="cursor-pointer"
                      />
                      <span className="text-sm text-muted-foreground">
                        {plan.isPublished ? "Live" : "Draft"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-xl">
                          <EllipsisVertical className="size-4" />
                          <span className="sr-only">Plan actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/subscription-plans/${plan.id}`}>
                            <Pencil className="size-4" />
                            Edit Plan
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onSelect={() => setDeleteSelection({ type: "single", plans: [plan] })}
                        >
                          <Trash2 className="size-4" />
                          Delete Plan
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredPlans.length === 0 && (
            <div className="px-4 py-14 text-center text-sm text-muted-foreground">
              No membership plans match this filter.
            </div>
          )}
          <div className="flex items-center justify-between border-t px-4 py-4 text-sm text-muted-foreground">
            <span>{selected.length} of {filteredPlans.length} row(s) selected</span>
            <span>{filteredPlans.length} plans available</span>
          </div>
        </div>
      </section>
      <PlanDrawer
        key={drawerOpen ? "open" : "closed"}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onSaved={() => {
          setSelected([]);
          router.refresh();
        }}
      />
      <AlertDialog
        open={Boolean(deleteSelection)}
        onOpenChange={(open) => !open && setDeleteSelection(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteSelection?.plans.length === 1 ? "membership plan" : "selected membership plans"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. A plan that has already been assigned to a member must be retained for billing history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void confirmDelete()} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function DashboardStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Layers3;
  label: string;
  value: number;
}) {
  return (
    <div className="admin-taxonomy-stat rounded-3xl px-5 py-5 backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <p className="admin-taxonomy-stat-label text-sm font-medium">{label}</p>
        <Icon className="admin-taxonomy-stat-icon size-5" />
      </div>
      <p className="admin-taxonomy-stat-value mt-3 text-3xl font-semibold">{value}</p>
    </div>
  );
}
