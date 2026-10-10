"use client";

import { Skeleton } from "@/components/ui/skeleton";

export const PersonalizationSkelton = () => {
  return (
    <div className="w-full flex items-center justify-between">
      <Skeleton className="h-28 w-28 bg-red-100 rounded-full mx-3" />
      <Skeleton className="h-28 w-28 bg-red-100 rounded-full mx-3" />
      <Skeleton className="h-28 w-28 bg-red-100 rounded-full mx-3 " />
      <Skeleton className="h-28 w-28 bg-red-100 rounded-full mx-3 hidden md:flex" />
      <Skeleton className="h-28 w-28 bg-red-100 rounded-full mx-3 hidden md:flex" />
    </div>
  );
};
