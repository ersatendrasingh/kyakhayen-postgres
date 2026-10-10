"use client";

import axios from "axios";
import { Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";

type ReactionType = "YUMMY" | "LOVE" | "WOW" | "MADE_IT" | "COMFORT";

interface ReactionPayload {
  counts: Record<ReactionType, number>;
  selectedReaction: ReactionType | null;
}

interface RecipeReactionsProps {
  recipeId: string;
}

const reactions: Array<{
  type: ReactionType;
  emoji: string;
  label: string;
  note: string;
}> = [
  { type: "YUMMY", emoji: "😋", label: "Yummy", note: "Looks tasty" },
  { type: "LOVE", emoji: "😍", label: "Love it", note: "My kind of dish" },
  { type: "WOW", emoji: "🤩", label: "Wow", note: "Must try" },
  { type: "MADE_IT", emoji: "👨‍🍳", label: "Made it", note: "Cooked at home" },
  { type: "COMFORT", emoji: "🤗", label: "Comfort", note: "Feels homely" },
];

const emptyCounts: ReactionPayload["counts"] = {
  YUMMY: 0,
  LOVE: 0,
  WOW: 0,
  MADE_IT: 0,
  COMFORT: 0,
};

const RecipeReactions = ({ recipeId }: RecipeReactionsProps) => {
  const user = useCurrentUser();
  const router = useRouter();
  const [payload, setPayload] = useState<ReactionPayload>({
    counts: emptyCounts,
    selectedReaction: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [updating, setUpdating] = useState<ReactionType | null>(null);

  useEffect(() => {
    const loadReactions = async () => {
      try {
        const response = await axios.get<ReactionPayload>(
          `/api/recipe-reactions/${recipeId}`,
        );
        setPayload(response.data);
      } catch {
        toast.error("Could not load reactions right now.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadReactions();
  }, [recipeId]);

  const selectReaction = async (type: ReactionType) => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    try {
      setUpdating(type);
      const response = await axios.post<ReactionPayload>(
        `/api/recipe-reactions/${recipeId}`,
        { type },
      );
      setPayload(response.data);
      if (response.data.selectedReaction === null) {
        toast.success("Reaction removed.");
      } else {
        const selected = reactions.find(
          (reaction) => reaction.type === response.data.selectedReaction,
        );
        toast.success(`${selected?.label || "Reaction"} added to this recipe.`);
      }
    } catch {
      toast.error("Could not save your reaction.");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-[#eadcc8] bg-[#fffdf8] p-5 shadow-sm sm:p-7 dark:border-white/10 dark:bg-[#10221d]">
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#a47a3f] dark:text-[#d6ad63]">
            <Sparkles className="size-3.5" />
            Taste reaction
          </p>
          <h2 className="text-2xl font-semibold text-[#2e251f] dark:text-[#f2f3ed]">
            What did this dish make you feel?
          </h2>
        </div>
        <p className="text-sm text-[#837263] dark:text-[#aab9b2]">
          Tap once to react
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {reactions.map((reaction) => {
          const selected = payload.selectedReaction === reaction.type;

          return (
            <button
              key={reaction.type}
              type="button"
              disabled={isLoading || updating !== null}
              onClick={() => void selectReaction(reaction.type)}
              className={cn(
                "group relative flex min-h-[132px] cursor-pointer flex-col items-center justify-center rounded-2xl border px-3 py-4 text-center transition duration-200 disabled:cursor-wait disabled:opacity-70",
                selected
                  ? "border-[#c89641] bg-[#f8edd4] shadow-[0_12px_28px_-20px_rgba(141,94,31,0.62)] dark:border-[#d4ad62]/70 dark:bg-[#1d382f]"
                  : "border-[#eadfcf] bg-[#fcf7ee] hover:-translate-y-0.5 hover:border-[#dbbd86] hover:bg-white dark:border-white/8 dark:bg-[#152b24] dark:hover:border-[#d3ad63]/35",
              )}
              aria-pressed={selected}
            >
              {updating === reaction.type ? (
                <Loader2 className="mb-2 size-9 animate-spin text-[#b2813c]" />
              ) : (
                <span className="mb-2 text-4xl leading-none transition group-hover:scale-110">
                  {reaction.emoji}
                </span>
              )}
              <span className="text-sm font-semibold text-[#362b22] dark:text-[#eef3ed]">
                {reaction.label}
              </span>
              <span className="mt-1 text-[11px] text-[#897665] dark:text-[#98aaa2]">
                {reaction.note}
              </span>
              <span
                className={cn(
                  "mt-3 min-w-8 rounded-full px-2 py-1 text-xs font-semibold",
                  selected
                    ? "bg-[#c49342] text-white"
                    : "bg-[#f2e8d8] text-[#87633a] dark:bg-white/7 dark:text-[#c9d3cc]",
                )}
              >
                {payload.counts[reaction.type]}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default RecipeReactions;
