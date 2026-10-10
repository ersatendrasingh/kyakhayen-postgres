import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface MenuItemProps {
  label: string;
  href: string;
  menuIcon?: LucideIcon;
  mobile?: boolean;
}

const MenuItem = ({
  label,
  href,
  menuIcon: Icon,
  mobile = false,
}: MenuItemProps) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "group flex cursor-pointer items-center gap-3 rounded-2xl font-medium transition",
        mobile
          ? "shrink-0 border border-[#eadcc9] bg-[#fffdf8] px-4 py-3 text-sm text-[#665244] dark:border-white/10 dark:bg-[#11231d] dark:text-[#c9d5ce]"
          : "px-4 py-3.5 text-sm text-[#655347] hover:bg-[#f7ecdd] hover:text-[#38271b] dark:text-[#b8c7be] dark:hover:bg-white/[0.06] dark:hover:text-white",
        isActive &&
          (mobile
            ? "border-[#c43a2a] bg-[#c43a2a] text-white shadow-sm dark:border-[#d35443] dark:bg-[#bd3e30] dark:text-white"
            : "bg-[#f7e8d5] text-[#b63325] dark:bg-[#1b352c] dark:text-[#ebc786]"),
      )}
    >
      {Icon && (
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-xl bg-[#f3e8da] text-[#86664e] transition dark:bg-white/[0.06] dark:text-[#c6ae80]",
            mobile && "size-7 bg-transparent dark:bg-transparent",
            isActive && mobile && "text-white dark:text-white",
            isActive && !mobile && "bg-white text-[#b63325] dark:bg-[#26463b] dark:text-[#edc783]",
          )}
        >
          <Icon className={mobile ? "size-4" : "size-[18px]"} />
        </span>
      )}
      <span className="whitespace-nowrap">{label}</span>
    </Link>
  );
};

export default MenuItem;
