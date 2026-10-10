"use client";

import {
  ChefHat,
  Crown,
  Eye,
  RotateCcw,
  Search,
  ShieldBan,
  SlidersHorizontal,
  UserRound,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import type { ManagedUser } from "@/components/admin/users/user-types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

function initials(name: string | null, email: string | null) {
  return (name || email || "User")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function date(value: Date | null) {
  return value
    ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value))
    : "-";
}

function activePlan(user: ManagedUser, referenceDate: string) {
  if (!user.isActive) return undefined;
  const now = new Date(referenceDate);
  return user.UserPlan.find((assignment) => !assignment.endDate || new Date(assignment.endDate) >= now);
}

function planProgress(startDate: Date, endDate: Date | null, referenceDate: string) {
  if (!endDate) return 100;
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  if (end <= start) return 100;
  const reference = new Date(referenceDate).getTime();
  return Math.round(Math.min(100, Math.max(0, ((reference - start) / (end - start)) * 100)));
}

function remainingDays(endDate: Date | null, referenceDate: string) {
  if (!endDate) return null;
  return Math.max(0, Math.ceil((new Date(endDate).getTime() - new Date(referenceDate).getTime()) / 86_400_000));
}

type UserFilters = {
  search: string;
  segment: string;
};

function buildPageHref(filters: UserFilters, page: number) {
  const params = new URLSearchParams();
  if (filters.search) params.set("q", filters.search);
  if (filters.segment && filters.segment !== "all") params.set("segment", filters.segment);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/admin/users?${query}` : "/admin/users";
}

function visiblePageNumbers(page: number, pageCount: number) {
  const candidates = new Set([
    1,
    pageCount,
    page - 2,
    page - 1,
    page,
    page + 1,
    page + 2,
  ]);

  return Array.from(candidates)
    .filter((number) => number >= 1 && number <= pageCount)
    .sort((left, right) => left - right);
}

export function UsersDashboard({
  users,
  referenceDate,
  stats,
  filters,
  page,
  pageCount,
  totalFiltered,
}: {
  users: ManagedUser[];
  referenceDate: string;
  stats: {
    total: number;
    activeMembers: number;
    personalized: number;
    verified: number;
  };
  filters: UserFilters;
  page: number;
  pageCount: number;
  totalFiltered: number;
}) {
  const router = useRouter();
  const [filterValues, setFilterValues] = useState<UserFilters>({
    search: filters.search,
    segment: filters.segment || "all",
  });
  const [jumpPage, setJumpPage] = useState(String(page));

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.replace(buildPageHref(filterValues, 1), { scroll: false });
  };

  const clearFilters = () => {
    const cleared = { search: "", segment: "all" };
    setFilterValues(cleared);
    router.replace("/admin/users", { scroll: false });
  };

  const goToPage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const target = Math.min(
      Math.max(Number.parseInt(jumpPage, 10) || page, 1),
      pageCount,
    );
    setJumpPage(String(target));
    router.push(buildPageHref(filters, target), { scroll: false });
  };

  const pageNumbers = visiblePageNumbers(page, pageCount);

  return (
    <TooltipProvider delayDuration={120}>
      <div className="space-y-6">
      <section className="admin-taxonomy-hero rounded-[32px] p-5 sm:p-7 lg:p-9">
        <div className="relative z-[1] max-w-3xl space-y-3">
          <span className="admin-taxonomy-hero-badge inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em]">
            Customers
          </span>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Users dashboard</h1>
          <p className="admin-taxonomy-hero-copy text-sm sm:text-base">
            Understand every customer from account creation through membership, meal-plan setup
            and engagement without opening multiple systems.
          </p>
        </div>
        <div className="relative z-[1] mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Stat icon={UsersRound} label="Registered Users" value={String(stats.total)} />
          <Stat icon={Crown} label="Active Access" value={String(stats.activeMembers)} />
          <Stat icon={ChefHat} label="Personalized" value={String(stats.personalized)} />
          <Stat icon={UserRound} label="Email Verified" value={String(stats.verified)} />
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Customer directory</h2>
            <p className="text-sm text-muted-foreground">
              Plan, preference setup and recent meal-plan status in one view.
            </p>
          </div>
          <form onSubmit={applyFilters} className="flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-[270px]">
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filterValues.search}
                onChange={(event) =>
                  setFilterValues((current) => ({ ...current, search: event.target.value }))
                }
                placeholder="Search customer or membership"
                className="h-12 rounded-2xl pl-11"
              />
            </div>
            <Select
              value={filterValues.segment || "all"}
              onValueChange={(value) =>
                setFilterValues((current) => ({ ...current, segment: value }))
              }
            >
              <SelectTrigger className="!h-12 w-full rounded-2xl px-4 sm:w-[190px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All users</SelectItem>
                <SelectItem value="member">Active access</SelectItem>
                <SelectItem value="personalized">Personalized</SelectItem>
                <SelectItem value="pending">Setup pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <Button type="submit" className="h-12 rounded-2xl sm:size-12" aria-label="Apply filters">
                <SlidersHorizontal />
                <span className="sm:sr-only">Apply</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-2xl sm:size-12"
                aria-label="Clear filters"
                onClick={clearFilters}
              >
                <RotateCcw />
                <span className="sm:sr-only">Clear</span>
              </Button>
            </div>
          </form>
        </div>

        <div className="mt-5 overflow-x-auto rounded-2xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Access</TableHead>
                <TableHead>Preferences</TableHead>
                <TableHead>Meal Plans</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead className="text-right">Manage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const membership = activePlan(user, referenceDate);
                const daysLeft = membership ? remainingDays(membership.endDate, referenceDate) : null;
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Link href={`/admin/users/${user.id}`} className="group flex items-center gap-3">
                        <Avatar size="lg">
                          <AvatarImage src={user.image || undefined} alt="" />
                          <AvatarFallback>{initials(user.name, user.email)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium transition-colors group-hover:text-webprimary">
                            {user.name || "Unnamed user"}
                          </p>
                          <p className="text-xs text-muted-foreground">{user.email || "No email"}</p>
                          {!user.isActive && (
                            <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-destructive">
                              <ShieldBan className="size-3" /> Suspended
                            </span>
                          )}
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="min-w-[210px]">
                      {membership ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="cursor-help space-y-2 py-1">
                              <div className="flex items-center justify-between gap-2">
                                <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                                  {membership.plan.name}
                                </Badge>
                                <span className="text-[11px] font-medium text-muted-foreground">
                                  {daysLeft === null ? "Active" : `${daysLeft}d left`}
                                </span>
                              </div>
                              <Progress
                                value={planProgress(membership.startDate, membership.endDate, referenceDate)}
                                className="h-1.5 bg-emerald-100 [&_[data-slot=progress-indicator]]:bg-emerald-500 dark:bg-emerald-500/15"
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="space-y-1 rounded-xl p-3">
                            <p className="font-semibold">{membership.plan.name} access</p>
                            <p>Started: {date(membership.startDate)}</p>
                            <p>Ends: {date(membership.endDate)}</p>
                            <p className="font-medium">
                              {daysLeft === null ? "No expiry assigned" : `${daysLeft} days remaining`}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Badge variant="outline">No active access</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          user.isPersonalised
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                            : "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                        }
                      >
                        {user.isPersonalised ? "Ready" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.UserMealPlan.length}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {date(user.createdAt)}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{user.Order.length} orders</p>
                      <p className="text-xs text-muted-foreground">{user._count.Favorite} saved dishes</p>
                    </TableCell>
                    <TableCell className="text-right">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button asChild size="icon-sm" variant="outline" className="rounded-xl">
                            <Link href={`/admin/users/${user.id}`} aria-label={`Manage ${user.name || "user"}`}>
                              <Eye />
                            </Link>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent sideOffset={6}>Manage customer</TooltipContent>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!users.length && (
                <TableRow>
                  <TableCell colSpan={7} className="h-28 text-center text-muted-foreground">
                    No customers match this filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>{totalFiltered} matching users</span>
              <Badge variant="secondary">
                Page {page} of {pageCount}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} asChild={page > 1}>
                {page > 1 ? <Link href={buildPageHref(filters, 1)}>First</Link> : "First"}
              </Button>
              <Button variant="outline" size="sm" disabled={page <= 1} asChild={page > 1}>
                {page > 1 ? <Link href={buildPageHref(filters, page - 1)}>Previous</Link> : "Previous"}
              </Button>
              <nav className="flex items-center gap-1" aria-label="User pages">
                {pageNumbers.map((number, index) => (
                  <span key={number} className="flex items-center gap-1">
                    {index > 0 && number - pageNumbers[index - 1] > 1 && (
                      <span className="px-1 text-sm text-muted-foreground">...</span>
                    )}
                    <Button
                      variant={number === page ? "default" : "outline"}
                      size="sm"
                      asChild={number !== page}
                      aria-current={number === page ? "page" : undefined}
                    >
                      {number === page ? (
                        String(number)
                      ) : (
                        <Link href={buildPageHref(filters, number)}>{number}</Link>
                      )}
                    </Button>
                  </span>
                ))}
              </nav>
              <Button variant="outline" size="sm" disabled={page >= pageCount} asChild={page < pageCount}>
                {page < pageCount ? <Link href={buildPageHref(filters, page + 1)}>Next</Link> : "Next"}
              </Button>
              <Button variant="outline" size="sm" disabled={page >= pageCount} asChild={page < pageCount}>
                {page < pageCount ? <Link href={buildPageHref(filters, pageCount)}>Last</Link> : "Last"}
              </Button>
              <form onSubmit={goToPage} className="ml-1 flex items-center gap-2">
                <label htmlFor="user-page-jump" className="sr-only">
                  Go to page
                </label>
                <Input
                  id="user-page-jump"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={jumpPage}
                  onChange={(event) => setJumpPage(event.target.value)}
                  className="h-8 w-20 rounded-lg px-2"
                  aria-label={`Go to page from 1 to ${pageCount}`}
                />
                <Button type="submit" variant="outline" size="sm">
                  Go
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>
      </div>
    </TooltipProvider>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UsersRound;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[#e7c9a4] bg-background/75 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-sm">{label}</span>
        <Icon className="size-5 text-webprimary" />
      </div>
      <p className="mt-4 text-3xl font-semibold">{value}</p>
    </div>
  );
}
