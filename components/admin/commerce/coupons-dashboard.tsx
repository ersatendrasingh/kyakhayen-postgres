"use client";

import type { Coupon, Plan } from "@prisma/client";
import {
  BadgePercent,
  CalendarClock,
  Download,
  EllipsisVertical,
  Pencil,
  Plus,
  Search,
  TicketPercent,
  Trash2,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { CouponDrawer } from "@/components/admin/commerce/coupon-drawer";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type ManagedCoupon = Coupon & {
  PlanOnCoupon: { plan: Pick<Plan, "id" | "name"> }[];
  _count: { UserCoupon: number };
};
type CouponState = "live" | "expired" | "inactive";
type DeleteSelection = ManagedCoupon[] | null;

const stateOf = (coupon: Coupon, nowMs: number): CouponState =>
  coupon.expiryDate && coupon.expiryDate.getTime() < nowMs
    ? "expired"
    : coupon.isActive
      ? "live"
      : "inactive";
const dateText = (date: Date | null) =>
  date
    ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(date))
    : "No expiry";
const discountText = (coupon: Coupon) =>
  coupon.discountValue == null
    ? "Not set"
    : coupon.discountType === "CART_PERCENTAGE"
      ? `${coupon.discountValue}% off`
      : `₹${coupon.discountValue} off`;

export function CouponsDashboard({ coupons }: { coupons: ManagedCoupon[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteSelection, setDeleteSelection] = useState<DeleteSelection>(null);
  const [deleting, setDeleting] = useState(false);
  const [nowMs] = useState(() => Date.now());
  const filteredCoupons = useMemo(() => {
    const term = search.trim().toLowerCase();
    return coupons.filter(
      (coupon) =>
        (!term ||
          coupon.code.toLowerCase().includes(term) ||
          coupon.PlanOnCoupon.some(({ plan }) => plan.name.toLowerCase().includes(term))) &&
        (status === "all" || stateOf(coupon, nowMs) === status)
    );
  }, [coupons, nowMs, search, status]);
  const selectedCoupons = coupons.filter((coupon) => selected.includes(coupon.id));
  const allVisibleSelected =
    filteredCoupons.length > 0 &&
    filteredCoupons.every((coupon) => selected.includes(coupon.id));
  const live = coupons.filter((coupon) => stateOf(coupon, nowMs) === "live").length;
  const endingSoon = coupons.filter(
    (coupon) =>
      coupon.expiryDate &&
      stateOf(coupon, nowMs) === "live" &&
      (coupon.expiryDate.getTime() - nowMs) / 86400000 <= 7
  ).length;
  const uses = coupons.reduce((sum, coupon) => sum + coupon._count.UserCoupon, 0);

  function toggleAllVisible(checked: boolean) {
    setSelected((current) => {
      const visible = new Set(filteredCoupons.map((coupon) => coupon.id));
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

  function exportRows(rows: ManagedCoupon[], filename: string) {
    const content = [
      ["Code", "Discount", "Plans", "Expiry", "Uses", "Status"],
      ...rows.map((coupon) => [
        coupon.code,
        discountText(coupon),
        coupon.PlanOnCoupon.map(({ plan }) => plan.name).join("; ") || "All plans",
        dateText(coupon.expiryDate),
        String(coupon._count.UserCoupon),
        stateOf(coupon, nowMs),
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

  async function setActive(coupon: ManagedCoupon, checked: boolean) {
    if (checked && stateOf(coupon, nowMs) === "expired") {
      toast.error("Update the expiry date before enabling this coupon");
      return;
    }
    try {
      setUpdatingId(coupon.id);
      const response = await fetch(
        `/api/coupons/${coupon.id}/${checked ? "publish" : "unpublish"}`,
        { method: "PATCH" }
      );
      if (!response.ok) throw new Error("Could not update coupon");
      toast.success(checked ? "Coupon enabled" : "Coupon disabled");
      router.refresh();
    } catch {
      toast.error("Could not update this coupon");
    } finally {
      setUpdatingId(null);
    }
  }

  async function confirmDelete() {
    const items = deleteSelection ?? [];
    if (!items.length) return;
    const redeemed = items.filter((coupon) => coupon._count.UserCoupon > 0);
    if (redeemed.length) {
      toast.error(
        `${redeemed.map((coupon) => coupon.code).join(", ")} cannot be deleted after redemption`
      );
      setDeleteSelection(null);
      return;
    }
    try {
      setDeleting(true);
      for (const coupon of items) {
        const response = await fetch(`/api/coupons/${coupon.id}`, { method: "DELETE" });
        if (!response.ok) throw new Error(`Unable to delete ${coupon.code}`);
      }
      toast.success(items.length === 1 ? "Coupon deleted" : `${items.length} coupons deleted`);
      setDeleteSelection(null);
      setSelected([]);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete coupons");
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
              Commerce Offers
            </span>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Coupons dashboard
              </h1>
              <p className="admin-taxonomy-hero-copy mt-2 text-sm sm:text-base">
                Control promotional codes, connected memberships and checkout availability.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 sm:flex-nowrap xl:shrink-0">
            <Button
              variant="outline"
              className="admin-taxonomy-hero-action rounded-2xl"
              onClick={() => exportRows(coupons, "coupons.csv")}
            >
              <Download className="size-4" />
              Export
            </Button>
            <Button className="rounded-2xl shadow-sm" onClick={() => setDrawerOpen(true)}>
              <Plus className="size-4" />
              Add Coupon
            </Button>
          </div>
        </div>
        <div className="relative z-[1] mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DashboardStat icon={TicketPercent} label="Total Coupons" value={coupons.length} />
          <DashboardStat icon={BadgePercent} label="Live Offers" value={live} />
          <DashboardStat icon={CalendarClock} label="Expiring Soon" value={endingSoon} />
          <DashboardStat icon={UsersRound} label="Redemptions" value={uses} />
        </div>
      </section>
      <section className="overflow-hidden rounded-[28px] border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-lg">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by code or membership plan"
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
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="h-12 rounded-2xl"
              disabled={!selectedCoupons.length}
              onClick={() => exportRows(selectedCoupons, "selected-coupons.csv")}
            >
              <Download className="size-4" />
              Export Selected
            </Button>
            <Button
              variant="outline"
              className="h-12 rounded-2xl"
              disabled={!selectedCoupons.length}
              onClick={() => setDeleteSelection(selectedCoupons)}
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
                    aria-label="Select all visible coupons"
                  />
                </TableHead>
                <TableHead>Coupon Code</TableHead>
                <TableHead>Saving</TableHead>
                <TableHead>Membership Plans</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Used</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCoupons.map((coupon) => {
                const state = stateOf(coupon, nowMs);
                return (
                  <TableRow key={coupon.id}>
                    <TableCell className="px-4">
                      <Checkbox
                        checked={selected.includes(coupon.id)}
                        onCheckedChange={(checked) => toggleSelected(coupon.id, checked === true)}
                        aria-label={`Select ${coupon.code}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/coupons/${coupon.id}`} className="flex items-center gap-3">
                        <span className="flex size-12 items-center justify-center rounded-2xl border bg-muted/40">
                          <TicketPercent className="size-5 text-webprimary" />
                        </span>
                        <span className="font-mono font-semibold">{coupon.code}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium">{discountText(coupon)}</TableCell>
                    <TableCell>
                      {coupon.PlanOnCoupon.length
                        ? coupon.PlanOnCoupon.map(({ plan }) => plan.name).join(", ")
                        : "All published plans"}
                    </TableCell>
                    <TableCell>{dateText(coupon.expiryDate)}</TableCell>
                    <TableCell>{coupon._count.UserCoupon}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={state === "live"}
                          disabled={updatingId === coupon.id || state === "expired"}
                          onCheckedChange={(checked) => void setActive(coupon, checked)}
                          className="cursor-pointer"
                        />
                        <span className="text-sm text-muted-foreground">
                          {state === "live" ? "Live" : state === "expired" ? "Expired" : "Off"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-xl">
                            <EllipsisVertical className="size-4" />
                            <span className="sr-only">Coupon actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/coupons/${coupon.id}`}>
                              <Pencil className="size-4" />
                              Edit Coupon
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={() => setDeleteSelection([coupon])}
                          >
                            <Trash2 className="size-4" />
                            Delete Coupon
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {filteredCoupons.length === 0 && (
            <div className="px-4 py-14 text-center text-sm text-muted-foreground">
              No coupons match this filter.
            </div>
          )}
          <div className="flex items-center justify-between border-t px-4 py-4 text-sm text-muted-foreground">
            <span>{selected.length} of {filteredCoupons.length} row(s) selected</span>
            <span>{filteredCoupons.length} coupons available</span>
          </div>
        </div>
      </section>
      <CouponDrawer
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
              Delete {(deleteSelection?.length ?? 0) === 1 ? "coupon" : "selected coupons"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Redeemed coupons must be retained for order history.
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
  icon: typeof TicketPercent;
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
