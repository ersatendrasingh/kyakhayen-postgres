"use client";

import type { PaymentStatus, Prisma } from "@prisma/client";
import {
  ArrowRight,
  Banknote,
  Clock3,
  Download,
  ReceiptIndianRupee,
  Search,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type ManagedOrder = Prisma.OrderGetPayload<{
  include: {
    user: { select: { id: true; name: true; email: true } };
    items: { include: { plan: { select: { id: true; name: true; durationDays: true } } } };
  };
}>;

function money(amount: number | null, currency: string | null) {
  if (typeof amount !== "number") return "-";
  return new Intl.NumberFormat(currency === "USD" ? "en-US" : "en-IN", {
    style: "currency",
    currency: currency === "USD" ? "USD" : "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function day(value: Date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value));
}

function statusTone(status: PaymentStatus) {
  if (status === "Paid" || status === "Success") return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300";
  if (status === "Processing") return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300";
  return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300";
}

function isPaid(status: PaymentStatus) {
  return status === "Paid" || status === "Success";
}

export function OrdersDashboard({ orders }: { orders: ManagedOrder[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((order) => {
      const planName = order.items[0]?.plan?.name || order.items[0]?.itemName || "";
      const matchesSearch =
        !term ||
        order.id.toLowerCase().includes(term) ||
        (order.orderId || "").toLowerCase().includes(term) ||
        (order.user.name || "").toLowerCase().includes(term) ||
        (order.user.email || "").toLowerCase().includes(term) ||
        (order.coupon || "").toLowerCase().includes(term) ||
        planName.toLowerCase().includes(term);
      const matchesStatus =
        status === "all" ||
        (status === "paid" && isPaid(order.paymentStatus)) ||
        (status === "processing" && order.paymentStatus === "Processing") ||
        (status === "failed" && (order.paymentStatus === "Failed" || order.paymentStatus === "Cancelled"));
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, status]);

  const selectedOrders = orders.filter((order) => selected.includes(order.id));
  const allVisibleSelected =
    filteredOrders.length > 0 &&
    filteredOrders.every((order) => selected.includes(order.id));
  const paidOrders = orders.filter((order) => isPaid(order.paymentStatus));
  const revenueInr = paidOrders
    .filter((order) => (order.currency || "INR") === "INR")
    .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const processing = orders.filter((order) => order.paymentStatus === "Processing").length;
  const failed = orders.filter((order) => order.paymentStatus === "Failed" || order.paymentStatus === "Cancelled").length;

  function toggleAllVisible(checked: boolean) {
    setSelected((current) => {
      const visible = new Set(filteredOrders.map((order) => order.id));
      if (checked) return Array.from(new Set([...current, ...visible]));
      return current.filter((id) => !visible.has(id));
    });
  }

  function toggleSelected(id: string, checked: boolean) {
    setSelected((current) =>
      checked ? Array.from(new Set([...current, id])) : current.filter((item) => item !== id),
    );
  }

  function exportRows(rows: ManagedOrder[], filename: string) {
    const content = [
      ["Order reference", "Customer", "Email", "Membership", "Total", "Currency", "Coupon", "Status", "Created"],
      ...rows.map((order) => [
        order.orderId || order.id,
        order.user.name || "",
        order.user.email || "",
        order.items[0]?.plan?.name || order.items[0]?.itemName || "",
        String(order.totalAmount ?? ""),
        order.currency || "INR",
        order.coupon || "",
        order.paymentStatus,
        new Date(order.createdAt).toISOString(),
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

  return (
    <div className="space-y-6">
      <section className="admin-taxonomy-hero rounded-[32px] p-5 sm:p-7 lg:p-9">
        <div className="relative z-[1] flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl space-y-3">
            <span className="admin-taxonomy-hero-badge inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em]">
              Commerce
            </span>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Orders dashboard</h1>
              <p className="admin-taxonomy-hero-copy mt-2 text-sm sm:text-base">
                Track membership purchases, payment confirmation and customer access records.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="admin-taxonomy-hero-action rounded-2xl"
            onClick={() => exportRows(orders, "orders.csv")}
          >
            <Download className="size-4" />
            Export Orders
          </Button>
        </div>
        <div className="relative z-[1] mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DashboardStat icon={ReceiptIndianRupee} label="Total Orders" value={String(orders.length)} />
          <DashboardStat icon={Banknote} label="Paid Revenue (INR)" value={money(revenueInr, "INR")} />
          <DashboardStat icon={Clock3} label="Awaiting Confirmation" value={String(processing)} />
          <DashboardStat icon={TriangleAlert} label="Unsuccessful" value={String(failed)} />
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-lg">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search order, customer, plan or coupon"
              className="h-12 rounded-2xl pl-11"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="!h-12 w-[190px] rounded-2xl px-4">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="failed">Failed / Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="h-12 rounded-2xl"
              disabled={!selectedOrders.length}
              onClick={() => exportRows(selectedOrders, "selected-orders.csv")}
            >
              <Download className="size-4" />
              Export Selected
            </Button>
          </div>
        </div>
        <div className="mt-5 overflow-x-auto rounded-3xl border border-border/70">
          <Table>
            <TableHeader className="bg-muted/35">
              <TableRow>
                <TableHead className="w-12 px-4">
                  <Checkbox
                    checked={allVisibleSelected}
                    onCheckedChange={(checked) => toggleAllVisible(checked === true)}
                    aria-label="Select all visible orders"
                  />
                </TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Membership</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Coupon</TableHead>
                <TableHead>Placed</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => {
                const plan = order.items[0]?.plan?.name || order.items[0]?.itemName || "Membership";
                return (
                  <TableRow key={order.id}>
                    <TableCell className="px-4">
                      <Checkbox
                        checked={selected.includes(order.id)}
                        onCheckedChange={(checked) => toggleSelected(order.id, checked === true)}
                        aria-label={`Select order ${order.orderId || order.id}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/orders/${order.id}`} className="flex items-center gap-3">
                        <span className="flex size-12 items-center justify-center rounded-2xl border bg-muted/40">
                          <ReceiptIndianRupee className="size-5 text-webprimary" />
                        </span>
                        <span>
                          <span className="block font-semibold">{order.orderId || "Payment not opened"}</span>
                          <span className="text-sm text-muted-foreground">{order.id.slice(-8).toUpperCase()}</span>
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{order.user.name || "Member"}</p>
                      <p className="text-sm text-muted-foreground">{order.user.email || "No email"}</p>
                    </TableCell>
                    <TableCell>{plan}</TableCell>
                    <TableCell className="font-semibold">{money(order.totalAmount, order.currency)}</TableCell>
                    <TableCell>{order.coupon || "-"}</TableCell>
                    <TableCell>{day(order.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusTone(order.paymentStatus)}>
                        {order.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild className="rounded-xl">
                        <Link href={`/admin/orders/${order.id}`} aria-label={`View order ${order.orderId || order.id}`}>
                          <ArrowRight className="size-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {filteredOrders.length === 0 && (
            <div className="px-4 py-14 text-center text-sm text-muted-foreground">
              No orders match this filter.
            </div>
          )}
          <div className="flex items-center justify-between border-t px-4 py-4 text-sm text-muted-foreground">
            <span>{selected.length} of {filteredOrders.length} row(s) selected</span>
            <span>{filteredOrders.length} orders available</span>
          </div>
        </div>
      </section>
    </div>
  );
}

function DashboardStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ReceiptIndianRupee;
  label: string;
  value: string;
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
