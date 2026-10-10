import { cn } from "@/lib/utils";

type RecipeSteamProps = {
  className?: string;
  ambient?: boolean;
};

const HOT_DISH_SIGNALS = [
  "biryani",
  "chole",
  "curry",
  "dal",
  "dosa",
  "fried",
  "grill",
  "halwa",
  "idli",
  "kabab",
  "kadhi",
  "kebab",
  "khichdi",
  "kofta",
  "masala",
  "noodle",
  "pakora",
  "paneer",
  "paratha",
  "pasta",
  "poha",
  "pulao",
  "puri",
  "rajma",
  "rasam",
  "roast",
  "roti",
  "sabzi",
  "sambar",
  "soup",
  "stew",
  "tikka",
  "upma",
];

const COLD_DISH_SIGNALS = [
  "beverage",
  "chaas",
  "cooler",
  "fruit",
  "juice",
  "lassi",
  "raita",
  "salad",
  "shake",
  "smoothie",
  "sprout",
];

export function shouldShowRecipeSteam(title: string) {
  const normalizedTitle = title.toLowerCase();

  if (COLD_DISH_SIGNALS.some((signal) => normalizedTitle.includes(signal))) {
    return false;
  }

  return HOT_DISH_SIGNALS.some((signal) => normalizedTitle.includes(signal));
}

export function RecipeSteam({ className, ambient = false }: RecipeSteamProps) {
  return (
    <span
      aria-hidden="true"
      className={cn("recipe-steam", ambient && "recipe-steam-ambient", className)}
    >
      <span className="recipe-steam-wisp recipe-steam-wisp-1" />
      <span className="recipe-steam-wisp recipe-steam-wisp-2" />
      <span className="recipe-steam-wisp recipe-steam-wisp-3" />
    </span>
  );
}
