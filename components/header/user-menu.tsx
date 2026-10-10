"use client";

import {
  BookHeart,
  CreditCard,
  ChevronDown,
  Heart,
  LogOut,
  Settings,
  SlidersHorizontal,
  CircleUserRound,
  UserRound,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { LoginButton } from "@/components/auth/login-button";
import { LogoutButton } from "@/components/auth/logout-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type WebsiteNavUserProps = {
  variant?: "header" | "mobile" | "dock";
};

function getInitials(name?: string | null) {
  if (!name) return "KK";

  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
}

const Usermenu = ({ variant = "header" }: WebsiteNavUserProps) => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;
  const name = user?.name ?? "Kya Khayen account";
  const email = user?.email ?? "Sign in for personalised recipes";
  const compact = variant !== "header";

  const trigger = (
    <button
      type="button"
      aria-label={user ? "Open account menu" : "Sign in to Kya Khayen"}
      className={cn(
        "website-user-trigger flex cursor-pointer items-center rounded-full border border-[#e7d6c2] bg-white text-[#48372c] shadow-sm transition hover:border-[#d6aa64] hover:bg-[#fffaf1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ddab53]/30",
        compact ? "size-10 justify-center p-0" : "h-12 gap-2.5 py-1 pl-1 pr-3",
      )}
    >
      {user ? (
        <Avatar className={cn("shrink-0 ring-1 ring-[#efdabe]", compact ? "size-8" : "size-10")}>
          <AvatarImage src={user.image ?? undefined} alt={name} />
          <AvatarFallback className="bg-[#f7e6cc] text-xs font-bold text-primary">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
      ) : (
        <CircleUserRound className={cn("shrink-0 text-[#b83c2e]", compact ? "size-7" : "size-8")} />
      )}
      {!compact && (
        <>
          <span className="max-w-24 truncate text-sm font-semibold">
            {user?.name?.split(" ")[0] ?? "Sign in"}
          </span>
          <ChevronDown className="size-3.5 text-[#897666]" />
        </>
      )}
    </button>
  );

  if (!user) {
    return (
      <LoginButton>
        {trigger}
      </LoginButton>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent
        side={variant === "dock" ? "top" : "bottom"}
        align="end"
        sideOffset={10}
        className="website-user-dropdown w-72 rounded-2xl border-[#eadbc8] bg-[#fffdf8] p-2 shadow-[0_22px_60px_-24px_rgba(45,29,18,0.45)]"
      >
        <DropdownMenuLabel className="px-2 py-2 font-normal">
          <div className="flex items-center gap-3">
            <Avatar className="size-10 ring-1 ring-[#eadbc8]">
              <AvatarImage src={user.image ?? undefined} alt={name} />
              <AvatarFallback className="bg-[#f7e6cc] font-semibold text-primary">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#352820]">{name}</p>
              <p className="truncate text-xs text-[#7b6a5d]">{email}</p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-[#eee0cd]" />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5 focus:bg-[#faf0e2]">
            <Link href="/user/dashboard">
              <BookHeart /> My kitchen
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5 focus:bg-[#faf0e2]">
            <Link href="/user/profile">
              <UserRound /> My profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5 focus:bg-[#faf0e2]">
            <Link href="/user/preferences">
              <SlidersHorizontal /> Food preferences
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5 focus:bg-[#faf0e2]">
            <Link href="/user/subscriptions">
              <CreditCard /> Membership
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5 focus:bg-[#faf0e2]">
            <Link href="/user/dashboard">
              <Heart /> Saved recipes
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5 focus:bg-[#faf0e2]">
            <Link href="/user/settings">
              <Settings /> Settings
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-[#eee0cd]" />
        <DropdownMenuItem className="rounded-xl px-3 py-2.5 focus:bg-[#faf0e2]">
          <LogOut />
          <LogoutButton callbackUrl={pathname}>Log out</LogoutButton>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Usermenu;
