import LinkifyIt from "linkify-it";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const linkify = new LinkifyIt();

interface LinkedTextProps {
  text: string;
  className?: string;
}

export default function LinkedText({ text, className }: LinkedTextProps) {
  const matches = linkify.match(text);

  if (!matches) {
    return <div className={className}>{text}</div>;
  }

  const parts: ReactNode[] = [];
  let cursor = 0;

  for (const match of matches) {
    if (cursor < match.index) {
      parts.push(text.slice(cursor, match.index));
    }

    parts.push(
      <a
        key={`${match.index}-${match.lastIndex}`}
        href={match.url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="text-red-600 underline hover:text-webprimary"
      >
        {match.text}
      </a>
    );
    cursor = match.lastIndex;
  }

  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }

  return (
    <div className={cn("break-words whitespace-normal", className)}>
      {parts}
    </div>
  );
}
