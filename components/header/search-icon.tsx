"use client";

import { FaSearch } from "react-icons/fa";
import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";

import { SearchInput } from "@/components/header/search-input";
import { recipeCollectionHref } from "@/lib/recipe-collection-url";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const SearchDialog = ({
  trigger,
  triggerClassName,
}: {
  trigger: ReactNode;
  triggerClassName: string;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        aria-label="Search recipes"
        className={triggerClassName}
      >
        {trigger}
      </DialogTrigger>
      <DialogContent className="w-[min(900px,calc(100vw-1.25rem))] gap-0 overflow-visible rounded-[1.6rem] border border-[#efdfcc] bg-[radial-gradient(circle_at_82%_0%,rgba(220,166,70,0.15),transparent_20rem),#fffaf2] p-4 shadow-[0_32px_90px_-28px_rgba(48,31,18,0.46)] sm:max-w-[900px] sm:rounded-[2rem] sm:p-9">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-[#b27c35]">
          Search the kitchen
        </p>
        <DialogTitle className="max-w-xl text-2xl font-semibold text-[#2e241d] sm:text-4xl">
          Search by craving, not exact names.
        </DialogTitle>
        <DialogDescription className="mt-2 mb-5 text-sm text-[#78695c] sm:mb-6">
          Try paneer, breakfast recipes, quick dinner ideas or cooling summer drinks.
        </DialogDescription>
        <div className="relative">
          <SearchInput onClose={() => setOpen(false)} />
        </div>
        <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-[#594637]">
          {[
            ["Paneer", "/search?k=paneer"],
            ["Quick dinner", "/search?k=quick%20dinner"],
            ["Summer drinks", recipeCollectionHref("beveragesmoothie")],
            ["Quick snacks", recipeCollectionHref("snacks")],
          ].map(([label, href]) => (
            <Link
              key={label}
              href={href}
              onClick={() => setOpen(false)}
              className="cursor-pointer rounded-full border border-[#ead9c2] bg-white px-4 py-2 transition hover:border-[#d79b42] hover:text-primary"
            >
              {label}
            </Link>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const SearchIcon = () => (
  <div className="relative">
    <SearchDialog
      trigger={
        <FaSearch className="size-5 text-muted-foreground transition-colors hover:text-foreground" />
      }
      triggerClassName="hidden cursor-pointer flex-col items-center justify-center md:flex"
    />
  </div>
);

export default SearchIcon;
