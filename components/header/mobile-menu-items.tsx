"use client";

import {
  ChevronDown,
  CloudRain,
  CakeSlice,
  Leaf,
  Refrigerator,
  Snowflake,
  Sparkles,
  SunMedium,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import Logo from "@/components/logo";
import Usermenu from "@/components/header/user-menu";
import { ModeToggle } from "@/components/mode-toggle";
import { SheetClose } from "@/components/ui/sheet";
import type {
  CategoryNavItem,
  CuisineNavItem,
  MenuLink,
  NavItem,
  SeasonNavItem,
} from "@/components/header/navbar";
import { getIngredientCollectionHubLinks } from "@/lib/ingredient-collection-hubs";
import { recipeCollectionHref } from "@/lib/recipe-collection-url";

type MobileMenuItemsProps = {
  currentSeason: SeasonNavItem;
  mealTimes: NavItem[];
  cuisines: CuisineNavItem[];
  categories: CategoryNavItem[];
  recipeTypes: NavItem[];
  drinkItems: MenuLink[];
  dietTypes: NavItem[];
};

type DrawerLink = {
  label: string;
  href: string;
};

type DrawerImageLink = DrawerLink & {
  imageUrl: string;
};

function DrawerGroup({
  label,
  kicker,
  links,
}: {
  label: string;
  kicker: string;
  links: DrawerLink[];
}) {
  return (
    <details className="group border-b border-[#eadbc8]">
      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-semibold text-[#45362c] marker:content-none [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block text-[10px] uppercase tracking-[0.2em] text-[#a2773d]">
            {kicker}
          </span>
          <span className="mt-1 block">{label}</span>
        </span>
        <ChevronDown className="size-4 text-[#997c5c] transition group-open:rotate-180" />
      </summary>
      <div className="grid grid-cols-2 gap-2 px-4 pb-4">
        {links.map((link) => (
          <SheetClose asChild key={link.href}>
            <Link
              href={link.href}
              className="cursor-pointer rounded-xl border border-[#eadbc8] bg-white px-3 py-3 text-xs font-medium text-[#59483c] transition hover:border-[#daa64f] hover:text-primary"
            >
              {link.label}
            </Link>
          </SheetClose>
        ))}
      </div>
    </details>
  );
}

function DrawerImageGroup({
  label,
  kicker,
  links,
}: {
  label: string;
  kicker: string;
  links: DrawerImageLink[];
}) {
  return (
    <details className="group border-b border-[#eadbc8]">
      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-semibold text-[#45362c] marker:content-none [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block text-[10px] uppercase tracking-[0.2em] text-[#a2773d]">
            {kicker}
          </span>
          <span className="mt-1 block">{label}</span>
        </span>
        <ChevronDown className="size-4 text-[#997c5c] transition group-open:rotate-180" />
      </summary>
      <div className="grid grid-cols-2 gap-2 px-4 pb-4">
        {links.map((link) => (
          <SheetClose asChild key={link.href}>
            <Link
              href={link.href}
              className="group relative h-[104px] cursor-pointer overflow-hidden rounded-xl border border-[#eadbc8] bg-[#17372b]"
            >
              <Image
                src={link.imageUrl}
                alt=""
                fill
                sizes="45vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-[#140f0a]/84 via-transparent to-transparent" />
              <span className="absolute inset-x-3 bottom-3 text-xs font-semibold text-white">
                {link.label}
              </span>
            </Link>
          </SheetClose>
        ))}
      </div>
    </details>
  );
}

function MobileSeasonIcon({ slug }: { slug: SeasonNavItem["slug"] }) {
  const Icon = slug === "rainy" ? CloudRain : slug === "winter" ? Snowflake : SunMedium;

  return (
    <span className="relative inline-flex size-5 items-center justify-center rounded-full bg-white/70">
      <span className="absolute inline-flex size-5 animate-ping rounded-full bg-[#e7a93f]/35 motion-reduce:animate-none" />
      <Icon className="relative size-4" />
    </span>
  );
}

export const MobileMenuItems = ({
  currentSeason,
  mealTimes,
  cuisines,
  categories,
  recipeTypes,
  drinkItems,
  dietTypes,
}: MobileMenuItemsProps) => {
  const ingredientGuides = getIngredientCollectionHubLinks();

  return (
    <nav className="mobile-discovery-drawer flex h-full flex-col overflow-y-auto">
      <div className="border-b border-[#eadbc8] px-5 pb-4 pt-5">
        <Logo />
        <p className="mt-3 text-xs leading-5 text-[#79695e]">
          Beautiful everyday food, chosen around your taste.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 border-b border-[#eadbc8] p-4">
        <SheetClose asChild>
          <Link
            href={currentSeason.href}
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#edf3df] px-3 py-3 text-xs font-semibold text-[#315036]"
          >
            <MobileSeasonIcon slug={currentSeason.slug} /> {currentSeason.title}
          </Link>
        </SheetClose>
        <SheetClose asChild>
          <Link
            href="/blog"
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#f7e9db] px-3 py-3 text-xs font-semibold text-primary"
          >
            <Sparkles className="size-4" /> Journal
          </Link>
        </SheetClose>
      </div>

      <DrawerGroup
        label="Recipes"
        kicker="Choose your plate"
        links={[
          { label: "All recipes", href: "/recipes" },
          ...categories.slice(0, 5).map((category) => ({
            label: category.name,
            href: recipeCollectionHref(category.slug),
          })),
        ]}
      />
      <DrawerGroup
        label="Mealtimes"
        kicker="Cook by moment"
        links={mealTimes.slice(0, 6).map((mealTime) => ({
          label: mealTime.title,
          href: recipeCollectionHref(mealTime.slug),
        }))}
      />
      <DrawerGroup
        label="Cuisines"
        kicker="Taste across regions"
        links={cuisines.slice(0, 8).map((cuisine) => ({
          label: cuisine.title,
          href: recipeCollectionHref(cuisine.slug),
        }))}
      />
      <DrawerImageGroup
        label="Pantry"
        kicker="Kitchen staples"
        links={ingredientGuides.map((item) => ({
          label: item.label,
          href: item.href,
          imageUrl: item.imageUrl,
        }))}
      />
      <DrawerGroup
        label="Collections"
        kicker="Browse by craving"
        links={[
          {
            label: "Vegetarian",
            href: recipeCollectionHref("veg"),
          },
          ...recipeTypes.slice(0, 5).map((type) => ({
            label: type.title,
            href: recipeCollectionHref(type.slug),
          })),
        ]}
      />
      <DrawerGroup
        label="Wellness Goals"
        kicker="Eat your way"
        links={dietTypes.slice(0, 6).map((dietType) => ({
          label: dietType.title,
          href: recipeCollectionHref(dietType.slug),
        }))}
      />
      <DrawerGroup
        label="Drinks"
        kicker="Teas and coolers"
        links={drinkItems.map((item) => ({
          label: item.count ? `${item.title} (${item.count})` : item.title,
          href: item.href,
        }))}
      />

      <SheetClose asChild>
        <Link
          href={recipeCollectionHref("desserts")}
          className="mx-4 mt-4 flex cursor-pointer items-center justify-between rounded-2xl border border-[#eadbc8] bg-white px-4 py-4 text-sm font-semibold text-[#45362c]"
        >
          <span className="inline-flex items-center gap-2">
            <CakeSlice className="size-4 text-[#bd8030]" /> Desserts
          </span>
          <span aria-hidden="true">-&gt;</span>
        </Link>
      </SheetClose>

      <SheetClose asChild>
        <Link
          href={recipeCollectionHref("veg")}
          className="mx-4 mt-4 flex cursor-pointer items-center justify-between rounded-2xl bg-[#17372b] px-4 py-4 text-sm font-semibold text-white"
        >
          <span className="inline-flex items-center gap-2">
            <Leaf className="size-4 text-[#d8edc4]" /> Explore vegetarian
          </span>
          <span aria-hidden="true">-&gt;</span>
        </Link>
      </SheetClose>

      <SheetClose asChild>
        <Link
          href="/tools"
          className="mx-4 mt-4 flex cursor-pointer items-center justify-between rounded-2xl border border-[#eadbc8] bg-white px-4 py-4 text-sm font-semibold text-[#45362c]"
        >
          <span className="inline-flex items-center gap-2">
            <Refrigerator className="size-4 text-[#bd8030]" /> Cooking tools
          </span>
          <span aria-hidden="true">-&gt;</span>
        </Link>
      </SheetClose>

      <div className="mt-auto border-t border-[#eadbc8] bg-[#fff7ec] p-4">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a2773d]">
          Your kitchen
        </p>
        <div className="flex items-center justify-between rounded-2xl border border-[#eadbc8] bg-white p-3">
          <div className="flex items-center gap-2.5">
            <Usermenu variant="mobile" />
            <span className="text-xs font-semibold text-[#504035]">
              Account & preferences
            </span>
          </div>
          <div className="flex items-center text-[#7c6756]">
            <ModeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
};
