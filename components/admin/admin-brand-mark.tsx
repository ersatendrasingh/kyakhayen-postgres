import Image from "next/image";

import { cn } from "@/lib/utils";

export function AdminBrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative block size-8 shrink-0 overflow-hidden rounded-xl bg-primary/5",
        className
      )}
    >
      <Image
        src="/assets/images/kyakhayen-logo.png"
        alt=""
        width={103}
        height={32}
        className="absolute top-1/2 left-1/2 h-8 w-auto max-w-none -translate-x-[13px] -translate-y-1/2 object-contain object-left"
      />
    </span>
  );
}
