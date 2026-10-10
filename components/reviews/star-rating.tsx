"use client";

import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  className?: string;
  activeClassName?: string;
}

export default function StarRating({
  value,
  onChange,
  size = 20,
  className,
  activeClassName = "fill-websecondary text-websecondary",
}: StarRatingProps) {
  const roundedValue = Math.round(value);

  return (
    <div
      className={cn("inline-flex items-center gap-0.5", className)}
      aria-label={`${roundedValue} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, index) => {
        const rating = index + 1;
        const star = (
          <Star
            className={cn(
              "text-gray-300",
              rating <= roundedValue && activeClassName
            )}
            style={{ width: size, height: size }}
            aria-hidden="true"
          />
        );

        if (!onChange) {
          return <span key={rating}>{star}</span>;
        }

        return (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-websecondary"
            aria-label={`Rate ${rating} out of 5`}
          >
            {star}
          </button>
        );
      })}
    </div>
  );
}
