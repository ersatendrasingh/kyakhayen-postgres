import { cn } from "@/lib/utils";

type FoodPreferenceMarkerProps = {
  name?: string | null;
  className?: string;
};

function markerColors(name: string) {
  const normalized = name.toLowerCase().replaceAll(" ", "-");

  if (normalized === "non-veg" || normalized === "non-vegetarian") {
    return { border: "border-[#ef4444]", dot: "bg-[#ef4444]" };
  }
  if (normalized === "eggetarian" || normalized === "egg") {
    return { border: "border-[#fbbf24]", dot: "bg-[#fbbf24]" };
  }
  if (normalized === "vegan") {
    return { border: "border-[#ec4899]", dot: "bg-[#ec4899]" };
  }
  if (normalized === "pescetarian") {
    return { border: "border-[#0ea5e9]", dot: "bg-[#0ea5e9]" };
  }

  return { border: "border-[#16a34a]", dot: "bg-[#16a34a]" };
}

export function FoodPreferenceMarker({
  name = "Veg",
  className,
}: FoodPreferenceMarkerProps) {
  const label = name || "Veg";
  const colors = markerColors(label);

  return (
    <span
      aria-label={`${label} recipe`}
      title={label}
      className={cn(
        "inline-flex size-[18px] shrink-0 items-center justify-center rounded-[4px] border-[1.5px] bg-white/95",
        colors.border,
        className,
      )}
    >
      <span className={cn("size-[9px] rounded-full", colors.dot)} />
    </span>
  );
}
