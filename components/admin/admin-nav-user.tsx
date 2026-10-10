"use client";

import Link from "next/link";
import { ChevronsUpDown, House, LogOut, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";

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
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";

function getInitials(name?: string | null) {
  if (!name) return "A";

  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
}

export function AdminNavUser({
  variant = "sidebar",
}: {
  variant?: "sidebar" | "header";
}) {
  const { isMobile, state } = useSidebar();
  const pathname = usePathname();
  const user = useCurrentUser();
  const name = user?.name ?? "Administrator";
  const email = user?.email ?? "admin@kyakhayen.com";
  const headerName = name.split(" ")[0];
  const collapsed = variant === "sidebar" && state === "collapsed" && !isMobile;

  const trigger =
    variant === "sidebar" ? (
      <SidebarMenuButton
        size="lg"
        className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:justify-center"
      >
        <Avatar className="size-8 shrink-0 rounded-full ring-1 ring-sidebar-border">
          <AvatarImage src={user?.image ?? undefined} alt={name} />
          <AvatarFallback className="rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
            {collapsed ? getInitials(name).charAt(0) : getInitials(name)}
          </AvatarFallback>
        </Avatar>
        {!collapsed && (
          <>
            <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{name}</span>
              <span className="max-w-40 truncate text-xs text-muted-foreground">
                {email}
              </span>
            </div>
            <ChevronsUpDown className="ml-auto size-4" />
          </>
        )}
      </SidebarMenuButton>
    ) : (
      <button
        type="button"
        aria-label="Open admin user menu"
        className="admin-header-control flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border p-0 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-10 sm:w-auto sm:gap-2 sm:p-1 sm:pr-2"
      >
        <Avatar className="size-8 shrink-0 rounded-full ring-1 ring-border/70">
          <AvatarImage src={user?.image ?? undefined} alt={name} />
          <AvatarFallback className="rounded-full bg-primary/10 text-primary">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
        <span className="hidden text-sm font-medium sm:block">
          {headerName}
        </span>
        <ChevronsUpDown className="mr-1 hidden size-4 text-muted-foreground md:block" />
      </button>
    );

  const menu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent
        className={cn(
          "min-w-64 rounded-lg",
          variant === "sidebar" && "w-64"
        )}
        side={variant === "header" || isMobile ? "bottom" : "right"}
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 shrink-0 rounded-full">
              <AvatarImage src={user?.image ?? undefined} alt={name} />
              <AvatarFallback className="rounded-full bg-primary/10 text-primary">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
            <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
              <span className="font-medium">{name}</span>
              <span className="break-all pt-0.5 text-xs leading-snug text-muted-foreground">
                {email}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/" className="cursor-pointer">
              <House />
              View Website
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/user/profile" className="cursor-pointer">
              <UserRound />
              My Profile
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogOut />
          <LogoutButton callbackUrl={pathname}>Log out</LogoutButton>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (variant === "header") {
    return menu;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        {menu}
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
