import { CalendarDays } from "lucide-react";

import { formatCurrency } from "@/lib/formatCurrency";

interface ProductItemInCartProps {
  title: string;
  price: number;
  currency: string;
}

export default function ProductItemInCart({
  title,
  price,
  currency,
}: ProductItemInCartProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#ecdeca] bg-[#fffaf2] p-4 dark:border-white/8 dark:bg-[#11251f]">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-[#f5e7d5] text-[#b83c2e] dark:bg-[#19372e] dark:text-[#dfb36c]">
          <CalendarDays className="size-5" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a77838] dark:text-[#d6aa60]">
            Membership
          </p>
          <p className="mt-1 font-semibold text-[#30251e] dark:text-[#edf2ec]">{title}</p>
        </div>
      </div>
      <p className="text-sm font-semibold text-[#30251e] dark:text-[#edf2ec]">
        {formatCurrency(price, currency)}
      </p>
    </div>
  );
}
