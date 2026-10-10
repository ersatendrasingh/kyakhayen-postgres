import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  ChefHat,
  ReceiptIndianRupee,
  ShieldBan,
  Sparkles,
  Star,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { UserAdminControls } from "@/components/admin/users/user-admin-controls";
import type { ManagedUser, UserAdminOptions } from "@/components/admin/users/user-types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function initials(name: string | null, email: string | null) {
  return (name || email || "User").slice(0, 2).toUpperCase();
}

function date(value: Date | null | undefined) {
  return value
    ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value))
    : "-";
}

function dateTime(value: Date | null | undefined) {
  return value
    ? new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
      }).format(new Date(value))
    : "-";
}

function money(amount: number | null, currency: string | null) {
  if (typeof amount !== "number") return "-";
  return new Intl.NumberFormat(currency === "USD" ? "en-US" : "en-IN", {
    style: "currency",
    currency: currency === "USD" ? "USD" : "INR",
  }).format(amount);
}

export function UserDetail({ user, options }: { user: ManagedUser; options: UserAdminOptions }) {
  const now = new Date();
  const activeAccess = user.UserPlan.find(
    (assignment) => !assignment.endDate || new Date(assignment.endDate) >= now,
  );
  const paidOrders = user.Order.filter(
    (order) => order.paymentStatus === "Paid" || order.paymentStatus === "Success",
  );

  return (
    <div className="space-y-6">
      <section className="admin-taxonomy-hero rounded-[32px] p-5 sm:p-7 lg:p-9">
        <div className="relative z-[1]">
          <Button asChild variant="outline" size="sm" className="admin-taxonomy-hero-action mb-6 rounded-xl">
            <Link href="/admin/users">
              <ArrowLeft />
              Customer directory
            </Link>
          </Button>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="size-20 border-4 border-background shadow-sm">
                <AvatarImage src={user.image || undefined} alt="" />
                <AvatarFallback className="text-lg">{initials(user.name, user.email)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{user.name || "Unnamed user"}</h1>
                  <span
                    aria-label={user.isPersonalised ? "Personalization ready" : "Personalization pending"}
                    className="group relative"
                  >
                    <span
                      className={
                        user.isPersonalised
                          ? "flex size-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                          : "flex size-8 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                      }
                    >
                      {user.isPersonalised ? <BadgeCheck className="size-5" /> : <Sparkles className="size-4" />}
                    </span>
                    <span
                      role="tooltip"
                      className={
                        "pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1.5 text-xs font-medium text-background opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                      }
                    >
                      {user.isPersonalised ? "Personalization ready" : "Food choices are not complete"}
                    </span>
                  </span>
                  {!user.isActive && (
                    <Badge variant="destructive" className="gap-1 rounded-full px-3">
                      <ShieldBan className="size-3.5" />
                      Suspended
                    </Badge>
                  )}
                </div>
                <p className="admin-taxonomy-hero-copy mt-1 text-sm">{user.email || "No email available"}</p>
              </div>
            </div>
            <div className="flex flex-col items-start gap-2 lg:items-end">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Manage customer</p>
              <UserAdminControls user={user} options={options} />
            </div>
          </div>
        </div>
        <div className="relative z-[1] mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DetailStat icon={Sparkles} label="Access" value={!user.isActive ? "Suspended" : activeAccess?.plan.name || "Inactive"} />
          <DetailStat icon={CalendarDays} label="Access Until" value={date(activeAccess?.endDate)} />
          <DetailStat icon={ChefHat} label="Meal Plans" value={String(user.UserMealPlan.length)} />
          <DetailStat icon={ReceiptIndianRupee} label="Paid Orders" value={String(paidOrders.length)} />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[28px] border bg-card p-5 shadow-sm sm:p-7">
          <h2 className="text-xl font-semibold">Taste profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Everyday food preferences selected by this customer.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Choice label="Food style" value={user.foodPreference?.name || "Not selected"} image={user.foodPreference?.imageUrl} />
            <Choice label="Cooking comfort" value={user.cookingSkill?.title || "Not selected"} image={user.cookingSkill?.imageUrl} />
          </div>
          <div className="mt-6 space-y-5 border-t pt-5">
            <VisualChoices label="Favourite cuisines" values={user.userCuisines.map(({ cuisine }) => cuisine)} />
            <VisualChoices label="Ingredients to exclude" values={user.UserAllrgies.map(({ allergy }) => allergy)} />
          </div>
        </section>

        <section className="rounded-[28px] border bg-card p-5 shadow-sm sm:p-7">
          <h2 className="text-xl font-semibold">Account and access</h2>
          <div className="mt-6 space-y-4 text-sm">
            <Information label="Joined" value={dateTime(user.createdAt)} />
            <Information
              label="Email verification"
              value={user.emailVerified ? `Verified ${dateTime(user.emailVerified)}` : "Not verified"}
            />
            <Information label="Phone number" value={user.phoneNumber || "Not provided"} />
            <Information label="Role" value={user.role} />
            <Information
              label="Current membership"
              value={activeAccess ? `${activeAccess.plan.name} until ${date(activeAccess.endDate)}` : "No active membership"}
            />
            {!user.isActive ? (
              <Information
                label="Suspension reason"
                value={user.suspensionReason || "No reason recorded"}
              />
            ) : null}
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3 border-t pt-5 text-center">
            <Engagement label="Saved" value={user._count.Favorite} />
            <Engagement label="Reviews" value={user._count.Review} />
            <Engagement label="Comments" value={user._count.Comment} />
          </div>
          <div className="mt-6 border-t pt-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Access history
            </p>
            <div className="space-y-2">
              {user.UserPlan.map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm">
                  <span className="font-medium">{assignment.plan.name}</span>
                  <span className="text-muted-foreground">
                    {date(assignment.startDate)} - {date(assignment.endDate)}
                  </span>
                </div>
              ))}
              {!user.UserPlan.length && <p className="text-sm text-muted-foreground">No membership assigned.</p>}
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-[28px] border bg-card p-5 shadow-sm sm:p-7">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Meal-plan history</h2>
              <p className="mt-1 text-sm text-muted-foreground">Generated week periods retained for reference.</p>
            </div>
            <Star className="size-5 text-webprimary" />
          </div>
          <div className="mt-5 space-y-3">
            {user.UserMealPlan.map((plan, index) => (
              <div key={plan.id} className="flex items-center justify-between rounded-2xl border px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{index === 0 ? "Latest generated plan" : "Previous meal plan"}</p>
                  <p className="text-xs text-muted-foreground">
                    {date(plan.planStartDate)} - {date(plan.planEndDate)}
                  </p>
                </div>
                <Badge variant="outline">{index === 0 ? "Latest" : "History"}</Badge>
              </div>
            ))}
            {!user.UserMealPlan.length && (
              <p className="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">
                No meal plan has been generated for this customer yet.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-[28px] border bg-card p-5 shadow-sm sm:p-7">
          <h2 className="text-xl font-semibold">Purchase history</h2>
          <p className="mt-1 text-sm text-muted-foreground">Checkout payments and membership purchases.</p>
          <div className="mt-5 space-y-3">
            {user.Order.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="flex items-center justify-between rounded-2xl border px-4 py-3 transition-colors hover:bg-muted/40"
              >
                <div>
                  <p className="text-sm font-medium">{order.orderId || "Checkout order"}</p>
                  <p className="text-xs text-muted-foreground">{date(order.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{money(order.totalAmount, order.currency)}</p>
                  <Badge variant="outline">{order.paymentStatus}</Badge>
                </div>
              </Link>
            ))}
            {!user.Order.length && (
              <p className="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">
                No purchase attempts recorded for this customer.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function DetailStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Sparkles;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[#e7c9a4] bg-background/75 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-sm">{label}</span>
        <Icon className="size-5 text-webprimary" />
      </div>
      <p className="mt-4 text-xl font-semibold">{value}</p>
    </div>
  );
}

function Choice({ label, value, image }: { label: string; value: string; image?: string | null }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border p-4">
      <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
        {image ? (
          <Image src={image} alt="" width={48} height={48} className="size-full object-cover" />
        ) : (
          <ChefHat className="size-5 text-webprimary" />
        )}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <p className="mt-1 font-medium">{value}</p>
      </div>
    </div>
  );
}

function VisualChoices({
  label,
  values,
}: {
  label: string;
  values: Array<{ title: string; imageUrl: string | null }>;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {values.length ? (
          values.map((value) => (
            <div key={value.title} className="flex items-center gap-3 rounded-2xl border bg-muted/15 p-3">
              <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
                {value.imageUrl ? (
                  <Image src={value.imageUrl} alt="" width={48} height={48} className="size-full object-cover" />
                ) : (
                  <ChefHat className="size-5 text-webprimary" />
                )}
              </div>
              <p className="text-sm font-medium">{value.title}</p>
            </div>
          ))
        ) : (
          <span className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">No selections</span>
        )}
      </div>
    </div>
  );
}

function Information({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b pb-4 last:border-b-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function Engagement({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-muted/45 p-3">
      <p className="text-xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
