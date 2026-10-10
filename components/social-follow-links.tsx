import {
  FaFacebook,
  FaInstagram,
  FaPinterest,
  FaYoutube,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import type { IconType } from "react-icons";

import { socialLinks, type SocialPlatform } from "@/lib/social-links";
import { cn } from "@/lib/utils";

const socialIcons = {
  facebook: FaFacebook,
  instagram: FaInstagram,
  x: FaXTwitter,
  pinterest: FaPinterest,
  youtube: FaYoutube,
} satisfies Record<SocialPlatform, IconType>;

const socialIconColors = {
  facebook: "text-[#1877f2]",
  instagram: "text-[#e4405f]",
  x: "text-[#111111] dark:text-white",
  pinterest: "text-[#bd081c]",
  youtube: "text-[#ff0000]",
} satisfies Record<SocialPlatform, string>;

interface SocialFollowLinksProps {
  className?: string;
  linkClassName?: string;
  variant?: "card" | "footer";
}

export function SocialFollowLinks({
  className,
  linkClassName,
  variant = "card",
}: SocialFollowLinksProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {socialLinks.map((link) => {
        const Icon = socialIcons[link.key];

        return (
          <a
            key={link.key}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            aria-label={link.ariaLabel}
            className={cn(
              "inline-flex size-10 items-center justify-center rounded-full transition hover:-translate-y-0.5",
              variant === "footer"
                ? "bg-white text-[#111111] hover:bg-[#f8d18a]"
                : "border border-[#eadcc8] bg-white text-[#111111] shadow-sm hover:border-[#cfa66d] hover:bg-[#fff7ea] dark:border-white/10 dark:bg-white dark:hover:border-[#d8b46b]/60",
              linkClassName,
            )}
          >
            <Icon className={cn("size-4", socialIconColors[link.key])} />
          </a>
        );
      })}
    </div>
  );
}
