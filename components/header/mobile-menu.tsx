"use client";

import { CalendarHeart, CookingPot, Menu, Refrigerator, Soup } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import Usermenu from "@/components/header/user-menu";
import { recipeCollectionHref } from "@/lib/recipe-collection-url";
import { cn } from "@/lib/utils";

const destinations = [
  { label: "Recipes", href: "/recipes", icon: CookingPot },
  { label: "Tools", href: "/tools", icon: Refrigerator },
  {
    label: "Cuisines",
    href: recipeCollectionHref("north-indian"),
    icon: Soup,
  },
  { label: "Plan", href: "/meal-plan", icon: CalendarHeart },
];

const MobileMenu = () => {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Quick discovery"
      className="mobile-quick-dock fixed bottom-3 left-1/2 z-50 -translate-x-1/2 rounded-full border border-[#ebdcc8] bg-[#fffdf8]/96 p-1.5 shadow-[0_18px_42px_-20px_rgba(49,31,20,0.5)] backdrop-blur-xl md:hidden"
    >
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Open discovery menu"
          onClick={() => window.dispatchEvent(new Event("kyakhayen:open-mobile-menu"))}
          className="flex size-11 cursor-pointer items-center justify-center rounded-full text-[#756456] transition hover:bg-[#fbf1e4] hover:text-primary"
        >
          <Menu className="size-5" />
        </button>
        {destinations.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href === "/recipes" && pathname === "/recipes");

          return (
            <Link
              key={label}
              href={href}
              className={cn(
                "flex size-11 cursor-pointer items-center justify-center rounded-full transition",
                active
                  ? "bg-[#fff0da] text-primary"
                  : "text-[#756456] hover:bg-[#fbf1e4] hover:text-primary",
              )}
            >
              <Icon className="size-5" />
              <span className="sr-only">{label}</span>
            </Link>
          );
        })}
        <div className="flex size-11 items-center justify-center text-[#756456]">
          <Usermenu variant="dock" />
        </div>
      </div>
    </nav>
  );
};

export default MobileMenu;
