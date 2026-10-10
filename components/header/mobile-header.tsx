"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import Container from "@/components/container";
import Logo from "@/components/logo";
import MobileMenuIcon from "@/components/header/mobile-menu-icon";
import { SearchInput } from "@/components/header/search-input";
import Usermenu from "@/components/header/user-menu";
import type {
  CategoryNavItem,
  CuisineNavItem,
  MenuLink,
  NavItem,
  SeasonNavItem,
} from "@/components/header/navbar";

type MobileHeaderProps = {
  currentSeason: SeasonNavItem;
  mealTimes: NavItem[];
  cuisines: CuisineNavItem[];
  categories: CategoryNavItem[];
  recipeTypes: NavItem[];
  drinkItems: MenuLink[];
  dietTypes: NavItem[];
};

function CompactBrandIcon() {
  return (
    <Link
      href="/"
      aria-label="Kya Khayen home"
      className="brand-icon-glow relative flex size-[42px] shrink-0 items-center justify-center overflow-hidden rounded-[13px] border border-[#ead8bd] bg-white p-[3px] shadow-sm"
    >
      <Image
        src="/pwa/icon-192.png"
        alt=""
        width={36}
        height={36}
        className="rounded-[10px] object-cover"
      />
    </Link>
  );
}

export default function MobileHeader({
  currentSeason,
  mealTimes,
  cuisines,
  categories,
  recipeTypes,
  drinkItems,
  dietTypes,
}: MobileHeaderProps) {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 52);

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="site-header fixed inset-x-0 top-0 z-40 border-b border-[#eadbc9]/80 bg-[#fffdf7]/96 backdrop-blur-xl lg:hidden">
      <Container>
        <div
          className={`overflow-hidden transition-all duration-300 ${
            compact ? "max-h-0 opacity-0" : "max-h-[60px] py-1.5 opacity-100"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <MobileMenuIcon
              currentSeason={currentSeason}
              mealTimes={mealTimes}
              cuisines={cuisines}
              categories={categories}
              recipeTypes={recipeTypes}
              drinkItems={drinkItems}
              dietTypes={dietTypes}
            />
            <Logo />
            <Usermenu variant="mobile" />
          </div>
        </div>

        <div
          className={`flex items-center gap-2.5 transition-all duration-300 ${
            compact ? "py-2" : "pb-2 pt-0.5"
          }`}
        >
          {compact && <CompactBrandIcon />}
          <SearchInput autoFocus={false} compact className="min-w-0 flex-1" />
        </div>
      </Container>
    </header>
  );
}
