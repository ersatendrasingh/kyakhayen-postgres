import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface CommunityAuthorAvatarProps {
  image?: string | null;
  name?: string | null;
  className?: string;
}

function getInitials(name?: string | null) {
  const words = name?.trim().split(/\s+/).filter(Boolean) || [];

  if (words.length === 0) {
    return "KK";
  }

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

export function CommunityAuthorAvatar({
  image,
  name,
  className,
}: CommunityAuthorAvatarProps) {
  return (
    <Avatar
      className={cn(
        "shrink-0 rounded-full border border-[#e7d4b5] ring-2 ring-[#f7ecdc] dark:border-white/10 dark:ring-white/5",
        className
      )}
    >
      <AvatarImage src={image ?? undefined} alt={name || "Home cook"} />
      <AvatarFallback className="rounded-full bg-[#f5e4c8] text-xs font-bold tracking-wide text-[#a53327] dark:bg-[#27463a] dark:text-[#f2ce8a]">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
