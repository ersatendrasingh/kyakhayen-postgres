"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/use-current-user";
import { capitalizeName } from "@/lib/formateName";
import {
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  Settings,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import MenuItem from "./menu-item";

const userMenu = [
  { name: "Home", href: "/user/dashboard", menuIcon: LayoutDashboard },
  { name: "Profile", href: "/user/profile", menuIcon: UserRound },
  { name: "Food choices", href: "/user/preferences", menuIcon: SlidersHorizontal },
  { name: "Membership", href: "/user/subscriptions", menuIcon: CreditCard },
  { name: "Settings", href: "/user/settings", menuIcon: Settings },
];

const StickySidebar = () => {
  const user = useCurrentUser();
  const planDestination = user?.isPersonalised ? "/meal-plan" : "/meal-plan/create";
  const initials =
    user?.name
      ?.split(" ")
      .slice(0, 2)
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase() || "KK";

  return (
    <>
      <div className="min-w-0 overflow-hidden lg:hidden">
        <div className="mb-4 flex items-center justify-between rounded-[1.5rem] border border-[#eadcc9] bg-[#fffdf8] p-4 shadow-[0_12px_28px_-24px_rgba(59,34,18,0.5)] dark:border-white/10 dark:bg-[#10231c]">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="size-11 ring-1 ring-[#ead7be] dark:ring-white/12">
              <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? "Account"} className="object-cover" />
              <AvatarFallback className="bg-[#f3e4ce] font-semibold text-[#b63325]">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium uppercase tracking-[0.16em] text-[#987659] dark:text-[#c5a873]">My kitchen</p>
              <p className="truncate font-semibold text-[#32251d] dark:text-[#f1eee8]">
                {user?.name ? capitalizeName(user.name) : "Your account"}
              </p>
            </div>
          </div>
          <Link href={planDestination} className="rounded-full bg-[#c43829] px-3.5 py-2 text-xs font-semibold text-white">
            {user?.isPersonalised ? "Plan" : "Create"}
          </Link>
        </div>
        <nav className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 pr-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {userMenu.map((item) => (
            <MenuItem key={item.href} label={item.name} href={item.href} menuIcon={item.menuIcon} mobile />
          ))}
        </nav>
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-[124px] space-y-4">
          <div className="overflow-hidden rounded-[1.7rem] border border-[#eadcc9] bg-[#fffdf8] p-5 shadow-[0_22px_45px_-38px_rgba(52,32,18,0.7)] dark:border-white/10 dark:bg-[#10231c]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b17851] dark:text-[#d2b277]">My kitchen</p>
            <div className="mt-5 flex items-center gap-3">
              <Avatar className="size-12 ring-2 ring-[#f2ddc0] dark:ring-[#284238]">
                <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? "Account"} className="object-cover" />
                <AvatarFallback className="bg-[#f3e4ce] font-bold text-[#b63325]">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                {user?.name ? (
                  <p className="truncate font-semibold text-[#34261d] dark:text-[#f3efe8]">{capitalizeName(user.name)}</p>
                ) : (
                  <Skeleton className="mb-2 h-4 w-28" />
                )}
                <p className="truncate text-xs text-[#827063] dark:text-[#aebcb4]">{user?.email ?? "Your food space"}</p>
              </div>
            </div>
            <Link
              href={planDestination}
              className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-[#bd382a] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#a92f23]"
            >
              <CalendarDays className="size-4" />
              {user?.isPersonalised ? "Open meal plan" : "Create meal plan"}
            </Link>
          </div>
          <nav className="space-y-1.5 rounded-[1.7rem] border border-[#eadcc9] bg-[#fffdf8] p-3 dark:border-white/10 dark:bg-[#10231c]">
            {userMenu.map((item) => (
              <MenuItem key={item.href} label={item.name} href={item.href} menuIcon={item.menuIcon} />
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default StickySidebar;
