"use client";

import {
  Bookmark,
  BookOpen,
  Clock3,
  Minus,
  Pause,
  Play,
  Plus,
  Printer,
  RotateCcw,
  Share2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

interface RecipeCookingDockProps {
  title: string;
  defaultTimerMinutes: number;
}

const RecipeCookingDock = ({
  title,
  defaultTimerMinutes,
}: RecipeCookingDockProps) => {
  const initialMinutes = Math.max(defaultTimerMinutes || 10, 1);
  const [minutes, setMinutes] = useState(initialMinutes);
  const [remaining, setRemaining] = useState(initialMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isPastCookingContent, setIsPastCookingContent] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const relatedRecipes = document.getElementById("recipe-related-recipes");
      const relatedIsClose =
        relatedRecipes !== null &&
        relatedRecipes.getBoundingClientRect().top <= window.innerHeight + 140;

      setIsVisible(window.scrollY > 420);
      setIsPastCookingContent(relatedIsClose);
    };
    const handleFavoriteState = (event: Event) => {
      const customEvent = event as CustomEvent<{ isFavorited: boolean }>;
      setIsSaved(Boolean(customEvent.detail?.isFavorited));
    };

    handleScroll();
    queueMicrotask(() => {
      const favoriteButton = document.getElementById("recipe-save-toggle");
      setIsSaved(favoriteButton?.dataset.favorited === "true");
    });
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("recipe-favorite-state", handleFavoriteState);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("recipe-favorite-state", handleFavoriteState);
    };
  }, []);

  useEffect(() => {
    if (!isRunning || remaining <= 0) return;

    const interval = window.setInterval(() => {
      if (remaining <= 1) {
        setRemaining(0);
        setIsRunning(false);
        toast.success(`${title} timer done. Serve it hot!`);
        return;
      }

      setRemaining(remaining - 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isRunning, remaining, title]);

  const updateMinutes = (nextMinutes: number) => {
    const safeMinutes = Math.max(1, Math.min(nextMinutes, 180));
    setMinutes(safeMinutes);
    setRemaining(safeMinutes * 60);
    setIsRunning(false);
  };

  const resetTimer = () => {
    setRemaining(minutes * 60);
    setIsRunning(false);
  };

  const triggerAction = (id: string) => {
    document.getElementById(id)?.click();
  };

  const formattedRemaining = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;

  return (
    <aside
      className={cn(
        "fixed bottom-5 left-1/2 z-40 hidden -translate-x-1/2 items-center gap-2 rounded-2xl border border-[#e3d0af] bg-[#fffaf0]/96 p-2 shadow-[0_18px_52px_-20px_rgba(40,28,18,0.6)] backdrop-blur-xl transition duration-300 lg:flex dark:border-white/10 dark:bg-[#101f1b]/96",
        isVisible && !isPastCookingContent
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-8 opacity-0",
      )}
    >
      <button
        type="button"
        onClick={() =>
          document
            .getElementById("recipe-methods")
            ?.scrollIntoView({ behavior: "smooth", block: "start" })
        }
        className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-xl bg-[#b63225] px-4 text-sm font-semibold text-white transition hover:bg-[#9f291e]"
      >
        <BookOpen className="size-4" />
        Cooking steps
      </button>
      <button
        type="button"
        onClick={() => triggerAction("recipe-print-toggle")}
        className="inline-flex size-12 cursor-pointer items-center justify-center rounded-xl border border-[#eadcc5] text-[#5a4b3f] transition hover:bg-[#f4eadb] dark:border-white/10 dark:text-[#dae3dd] dark:hover:bg-white/7"
        aria-label="Print recipe"
      >
        <Printer className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => triggerAction("recipe-share-toggle")}
        className="inline-flex size-12 cursor-pointer items-center justify-center rounded-xl border border-[#eadcc5] text-[#5a4b3f] transition hover:bg-[#f4eadb] dark:border-white/10 dark:text-[#dae3dd] dark:hover:bg-white/7"
        aria-label="Share recipe"
      >
        <Share2 className="size-4" />
      </button>

      <div className="mx-1 h-9 w-px bg-[#ebdfcb] dark:bg-white/10" />
      <div className="flex items-center gap-1 rounded-xl bg-[#f5ead7] p-1 dark:bg-[#172d26]">
        <Clock3 className="ml-2 size-4 text-[#a57436] dark:text-[#dfb96d]" />
        <button
          type="button"
          onClick={() => updateMinutes(minutes - 5)}
          className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-[#70563d] transition hover:bg-white dark:text-[#dce4de] dark:hover:bg-white/8"
          aria-label="Reduce timer by 5 minutes"
        >
          <Minus className="size-3.5" />
        </button>
        <span className="min-w-[58px] text-center text-sm font-semibold tabular-nums text-[#342a21] dark:text-[#edf2ec]">
          {formattedRemaining}
        </span>
        <button
          type="button"
          onClick={() => updateMinutes(minutes + 5)}
          className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-[#70563d] transition hover:bg-white dark:text-[#dce4de] dark:hover:bg-white/8"
          aria-label="Add 5 minutes to timer"
        >
          <Plus className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setIsRunning((running) => !running)}
          className="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg bg-[#18382d] text-white transition hover:bg-[#244d40] dark:bg-[#d1aa62] dark:text-[#102019]"
          aria-label={isRunning ? "Pause timer" : "Start timer"}
        >
          {isRunning ? <Pause className="size-4" /> : <Play className="size-4" />}
        </button>
        <button
          type="button"
          onClick={resetTimer}
          className="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg text-[#70563d] transition hover:bg-white dark:text-[#dce4de] dark:hover:bg-white/8"
          aria-label="Reset timer"
        >
          <RotateCcw className="size-3.5" />
        </button>
      </div>
      <button
        type="button"
        onClick={() => triggerAction("recipe-save-toggle")}
        className="inline-flex h-12 cursor-pointer items-center gap-2 whitespace-nowrap rounded-xl border border-[#dfc79f] bg-[#fbf1df] px-4 text-sm font-semibold text-[#48382b] transition hover:bg-white dark:border-white/10 dark:bg-[#18382d] dark:text-[#ebf0ea] dark:hover:bg-[#224638]"
      >
        <Bookmark className="size-4 text-[#af7736] dark:text-[#e1bb6f]" />
        {isSaved ? "In collection" : "Save"}
      </button>
    </aside>
  );
};

export default RecipeCookingDock;
