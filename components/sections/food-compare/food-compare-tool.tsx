"use client";

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Flame,
  Leaf,
  Loader2,
  Search,
  Share2,
  Sparkles,
  Trophy,
  Wheat,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import {
  type FoodCompareResult,
  type FoodCompareSide,
  type FoodCompareSuggestion,
} from "@/components/sections/food-compare/types";
import { cn } from "@/lib/utils";

type FoodCompareToolProps = {
  initialResult: FoodCompareResult | null;
  initialSuggestions: FoodCompareSuggestion[];
};

const sideTheme = {
  left: {
    name: "Food 1",
    dot: "bg-[#0f766e] dark:bg-[#5eead4]",
    text: "text-[#0f766e] dark:text-[#5eead4]",
    border: "border-[#91d1c3] dark:border-[#2dd4bf]/70",
    soft: "bg-[#e8f6f1] dark:bg-[#123b36]",
    bar: "bg-[#0f766e] dark:bg-[#5eead4]",
  },
  right: {
    name: "Food 2",
    dot: "bg-[#b63a29] dark:bg-[#ffb199]",
    text: "text-[#b63a29] dark:text-[#ffb199]",
    border: "border-[#efad96] dark:border-[#ff9f8a]/70",
    soft: "bg-[#fff0e8] dark:bg-[#3a1f1a]",
    bar: "bg-[#b63a29] dark:bg-[#ffb199]",
  },
} satisfies Record<
  FoodCompareSide,
  {
    name: string;
    dot: string;
    text: string;
    border: string;
    soft: string;
    bar: string;
  }
>;

const healthToneTheme = {
  positive:
    "border-[#9ed9ce] bg-[#e8f6f1] text-[#0f766e] dark:border-[#2dd4bf]/60 dark:bg-[#123b36] dark:text-[#8ff4e2]",
  balanced:
    "border-[#d7c59f] bg-[#fff8e6] text-[#8a6b35] dark:border-[#facc15]/50 dark:bg-[#3b2f12] dark:text-[#fde68a]",
  watch:
    "border-[#efc29f] bg-[#fff3e6] text-[#a05516] dark:border-[#fb923c]/55 dark:bg-[#3a2514] dark:text-[#fdba74]",
  occasional:
    "border-[#efad96] bg-[#fff0e8] text-[#b63a29] dark:border-[#fb7185]/55 dark:bg-[#3a1717] dark:text-[#fecaca]",
} satisfies Record<FoodCompareResult["left"]["health"]["tone"], string>;

const accentTextClass = "text-[#0f766e] dark:text-[#5eead4]";
const primaryPillClass =
  "bg-[#173629] text-white dark:bg-[#f4b04d] dark:text-[#20150b]";
const primaryButtonClass =
  "bg-[#173629] text-white transition hover:bg-[#234b3b] dark:bg-[#f4b04d] dark:text-[#20150b] dark:hover:bg-[#ffd27a]";

function resultUrl(
  left: FoodCompareSuggestion | null,
  right: FoodCompareSuggestion | null,
) {
  const params = new URLSearchParams();
  if (left) params.set("leftId", left.id);
  if (right) params.set("rightId", right.id);

  return `/tools/smart-food-compare?${params.toString()}#tool`;
}

function resultFoodToSuggestion(
  result: FoodCompareResult | null,
  side: FoodCompareSide,
) {
  if (!result) return null;
  const food = side === "left" ? result.left : result.right;

  return {
    id: food.id,
    label: food.label,
    href: food.href,
    imageUrl: food.imageUrl,
    category: food.category,
    cuisine: food.cuisine,
    estimatedCostInr: food.estimatedCostInr,
    timeMinutes: food.timeMinutes,
    calories: food.calories,
    protein: food.protein,
    fiber: food.fiber,
  } satisfies FoodCompareSuggestion;
}

function formatNumber(value: number, unit: string) {
  if (unit === "kcal" || unit === "mg" || unit === "min") {
    return `${value.toFixed(0)} ${unit}`;
  }

  return `${value.toFixed(1)} ${unit}`;
}

function formatRecipeCost(value: number | null | undefined) {
  return value ? `Approx Rs ${value}` : null;
}

function playResultChime() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;

    const context = new AudioContextClass();
    const gain = context.createGain();
    const now = context.currentTime;
    const frequencies = [523.25, 659.25, 783.99];

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.06, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.52);
    gain.connect(context.destination);

    frequencies.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, now + index * 0.075);
      oscillator.connect(gain);
      oscillator.start(now + index * 0.075);
      oscillator.stop(now + index * 0.075 + 0.22);
    });

    window.setTimeout(() => void context.close().catch(() => undefined), 720);
  } catch {
    // Browsers may block audio; the visual result still works.
  }
}

function FoodImage({
  src,
  title,
  className,
}: {
  src: string | null;
  title: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#eef1e8] text-[#667465]",
        className,
      )}
    >
      {src ? (
        <Image src={src} alt={title} fill sizes="160px" className="object-cover" />
      ) : (
        <Leaf className="size-5" />
      )}
    </span>
  );
}

function SuggestionLine({ item }: { item: FoodCompareSuggestion }) {
  const bits = [
    item.cuisine ?? item.category,
    formatRecipeCost(item.estimatedCostInr),
    item.timeMinutes ? `${item.timeMinutes} min` : null,
    `${item.calories.toFixed(0)} kcal`,
    `${item.protein.toFixed(1)}g protein`,
  ].filter(Boolean);

  return (
    <span className="mt-0.5 block truncate text-xs text-[#75675b] dark:text-white/60">
      {bits.join(" · ")}
    </span>
  );
}

function FoodPicker({
  side,
  selected,
  disabledId,
  contextId,
  suggestions,
  onSelect,
}: {
  side: FoodCompareSide;
  selected: FoodCompareSuggestion | null;
  disabledId?: string | null;
  contextId?: string | null;
  suggestions: FoodCompareSuggestion[];
  onSelect: (food: FoodCompareSuggestion | null) => void;
}) {
  const theme = sideTheme[side];
  const pickerRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState(suggestions);
  const visibleItems = items.filter((item) => item.id !== disabledId);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);

      try {
        const params = new URLSearchParams();
        if (input.trim()) params.set("q", input.trim());
        if (contextId) params.set("contextId", contextId);
        params.set("limit", "18");
        const response = await fetch(
          `/api/tools/food-compare/suggestions?${params.toString()}`,
          {
            cache: "no-store",
            headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
            signal: controller.signal,
          },
        );

        if (!response.ok) throw new Error("Unable to load food suggestions");
        const payload = (await response.json()) as {
          suggestions?: FoodCompareSuggestion[];
        };
        setItems(payload.suggestions ?? []);
      } catch {
        if (!controller.signal.aborted) setItems([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, input.trim() ? 180 : 0);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [contextId, input]);

  useEffect(() => {
    if (!open) return;

    const close = (event: PointerEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  const choose = (item: FoodCompareSuggestion) => {
    onSelect(item);
    setInput("");
    setOpen(false);
  };

  return (
    <div ref={pickerRef} className="relative min-w-0">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#796858] dark:text-white/60">
          <span className={cn("size-2 rounded-full", theme.dot)} />
          {theme.name}
        </p>
        {selected && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            aria-label={`Clear ${theme.name}`}
            className="inline-flex size-8 items-center justify-center rounded-full border border-[#ead9c3] bg-white text-[#7a6252] transition hover:border-[#b63a29] hover:text-[#b63a29] dark:border-white/10 dark:bg-white/[0.06] dark:text-white/70"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {selected && (
        <div
          className={cn(
            "mb-3 flex min-h-[5.75rem] items-center gap-3 rounded-lg border bg-white p-3 dark:bg-white/[0.05]",
            theme.border,
          )}
        >
          <FoodImage src={selected.imageUrl} title={selected.label} className="size-16" />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-[#2f241d] dark:text-white">
              {selected.label}
            </p>
            <SuggestionLine item={selected} />
          </div>
        </div>
      )}

      <form
        className="relative"
        onSubmit={(event) => {
          event.preventDefault();
          if (visibleItems[0]) choose(visibleItems[0]);
        }}
      >
        <Search className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-[#8c735c]" />
        <input
          value={input}
          onFocus={() => setOpen(true)}
          onPointerDown={() => setOpen(true)}
          onChange={(event) => {
            setInput(event.target.value);
            setOpen(true);
          }}
          placeholder="Search food, dish or recipe..."
          className="h-[46px] w-full rounded-full border border-[#ead6b9] bg-white pl-12 pr-12 text-[16px] font-medium text-[#34271f] shadow-[0_12px_32px_-24px_rgba(61,37,20,0.48)] outline-none placeholder:text-[#968577] transition focus:border-[#d9a24b] focus:ring-2 focus:ring-[#d9a24b]/18 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-white/42 sm:text-sm"
        />
        <button
          type="submit"
          aria-label={`Choose ${theme.name}`}
          disabled={visibleItems.length === 0}
          className={cn(
            "absolute right-1.5 top-1/2 inline-flex size-[36px] -translate-y-1/2 items-center justify-center rounded-full text-white transition disabled:cursor-not-allowed disabled:opacity-40",
            theme.dot,
          )}
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
        </button>
      </form>

      {open && (
        <div className="home-hide-scrollbar absolute left-0 right-0 z-50 mt-2 max-h-[22rem] overflow-y-auto rounded-[1.1rem] border border-[#ead9c2] bg-[#fffdf8] p-2 shadow-[0_24px_62px_-26px_rgba(56,35,19,0.44)] dark:border-white/10 dark:bg-[#14251f]">
          {loading ? (
            <div className="px-3.5 py-4 text-sm font-medium text-[#75675b] dark:text-white/62">
              Finding foods...
            </div>
          ) : visibleItems.length > 0 ? (
            visibleItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => choose(item)}
                className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left transition hover:bg-[#f2efe4] dark:hover:bg-white/8"
              >
                <FoodImage src={item.imageUrl} title={item.label} className="size-12" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[#372921] dark:text-white">
                    {item.label}
                  </span>
                  <SuggestionLine item={item} />
                </span>
              </button>
            ))
          ) : (
            <div className="px-3.5 py-4 text-sm font-medium text-[#75675b] dark:text-white/62">
              No matching food found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FoodFactCard({
  side,
  food,
  active,
}: {
  side: FoodCompareSide;
  food: FoodCompareResult["left"];
  active: boolean;
}) {
  const theme = sideTheme[side];
  const facts = [
    { label: "Calories", value: `${food.calories.toFixed(0)} kcal`, icon: Flame },
    { label: "Protein", value: `${food.protein.toFixed(1)} g`, icon: Leaf },
    { label: "Fiber", value: `${food.fiber.toFixed(1)} g`, icon: Wheat },
    {
      label: "Time",
      value: food.timeMinutes ? `${food.timeMinutes} min` : "Check recipe",
      icon: Clock,
    },
  ];

  return (
    <article
      className={cn(
        "rounded-lg border bg-white p-3 dark:bg-white/[0.05] sm:p-4",
        active ? `${theme.border} shadow-[0_18px_44px_-34px_rgba(15,37,29,0.55)]` : "border-[#ead9c3] dark:border-white/10",
      )}
    >
      <div className="flex gap-3">
        <FoodImage src={food.imageUrl} title={food.label} className="size-24 rounded-lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className={cn("text-xs font-semibold uppercase tracking-[0.16em]", theme.text)}>
              {theme.name}
            </p>
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                healthToneTheme[food.health.tone],
              )}
            >
              {food.health.label}
            </span>
          </div>
          <h3 className="mt-1 line-clamp-2 text-lg font-semibold leading-6 text-[#2f241d] dark:text-white">
            {food.label}
          </h3>
          <p className="mt-1 text-xs font-semibold text-[#806c5d] dark:text-white/60">
            {[food.cuisine ?? food.category ?? "Food", formatRecipeCost(food.estimatedCostInr)]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {facts.map((fact) => {
          const Icon = fact.icon;

          return (
            <div
              key={fact.label}
              className="rounded-lg border border-[#eee0cf] bg-[#fffaf1] p-3 dark:border-white/10 dark:bg-white/[0.04]"
            >
              <Icon className={cn("mb-2 size-4", theme.text)} />
              <p className="text-xs text-[#806c5d] dark:text-white/58">
                {fact.label}
              </p>
              <p className="mt-1 text-sm font-semibold text-[#2f241d] dark:text-white">
                {fact.value}
              </p>
            </div>
          );
        })}
      </div>

      <Link
        href={food.href}
        className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#dfc6a8] bg-white px-4 py-2 text-sm font-semibold text-[#3f3027] transition hover:border-primary hover:text-primary dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
      >
        Open recipe
        <ArrowRight className="size-4" />
      </Link>
    </article>
  );
}

function ReasonBox({
  result,
}: {
  result: FoodCompareResult;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {result.keyPoints.map((point) => {
        const iconColor =
          point.side === "left"
            ? "text-[#0f766e] dark:text-[#5eead4]"
            : point.side === "right"
              ? "text-[#b63a29] dark:text-[#ffb199]"
              : "text-[#8a6b35] dark:text-[#fde68a]";

        return (
          <div
            key={`${point.title}-${point.body}`}
            className="rounded-lg border border-[#ead9c3] bg-white p-3 dark:border-white/10 dark:bg-white/[0.04]"
          >
            <CheckCircle2 className={cn("mb-2 size-4", iconColor)} />
            <p className="text-sm font-semibold text-[#2f241d] dark:text-white">
              {point.title}
            </p>
            <p className="mt-1 text-sm leading-6 text-[#756354] dark:text-white/62">
              {point.body}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function FoodInsightCard({ result }: { result: FoodCompareResult }) {
  return (
    <section className="mt-4 rounded-lg border border-[#d9e4d9] bg-white p-4 dark:border-white/10 dark:bg-white/[0.04] sm:p-5">
      <p className={cn("mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]", accentTextClass)}>
        <Leaf className="size-4" />
        Food note
      </p>
      <h3 className="text-lg font-semibold leading-6 text-[#2f241d] dark:text-white">
        {result.healthInsight.title}
      </h3>
      <p className="mt-2 text-sm leading-7 text-[#756354] dark:text-white/64">
        {result.healthInsight.body}
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {(["left", "right"] as const).map((side) => {
          const food = side === "left" ? result.left : result.right;
          const theme = sideTheme[side];

          return (
            <div
              key={side}
              className="rounded-lg border border-[#ead9c3] bg-[#fffaf1] p-3 dark:border-white/10 dark:bg-white/[0.035]"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 truncate text-sm font-semibold text-[#2f241d] dark:text-white">
                  {food.label}
                </p>
                <span
                  className={cn(
                    "shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                    healthToneTheme[food.health.tone],
                  )}
                >
                  {food.health.label}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-[#756354] dark:text-white/58">
                {food.health.summary}
              </p>
              {(food.health.watchouts[0] || food.health.positives[0]) && (
                <p className={cn("mt-2 text-xs font-semibold", theme.text)}>
                  {food.health.watchouts[0] ?? food.health.positives[0]}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function MobileFoodSummary({ result }: { result: FoodCompareResult }) {
  return (
    <div className="grid gap-3">
      {(["left", "right"] as const).map((side) => {
        const food = side === "left" ? result.left : result.right;
        const theme = sideTheme[side];
        const isWinner = result.winner === side;
        const stats = [
          `${food.calories.toFixed(0)} kcal`,
          `${food.protein.toFixed(1)}g protein`,
          `${food.fiber.toFixed(1)}g fiber`,
          food.timeMinutes ? `${food.timeMinutes} min` : null,
        ].filter((item): item is string => Boolean(item));

        return (
          <article
            key={side}
            className={cn(
              "rounded-lg border bg-white p-3 dark:bg-white/[0.04]",
              isWinner ? theme.border : "border-[#ead9c3] dark:border-white/10",
            )}
          >
            <div className="flex gap-3">
              <FoodImage src={food.imageUrl} title={food.label} className="size-20 rounded-lg" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className={cn("text-xs font-semibold uppercase tracking-[0.14em]", theme.text)}>
                    {theme.name}
                  </p>
                  {isWinner && (
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", primaryPillClass)}>
                      Better
                    </span>
                  )}
                </div>
                <h3 className="mt-1 line-clamp-2 text-base font-semibold leading-5 text-[#2f241d] dark:text-white">
                  {food.label}
                </h3>
                <p className="mt-1 text-xs font-semibold text-[#806c5d] dark:text-white/60">
                  {[food.cuisine ?? food.category ?? "Food", formatRecipeCost(food.estimatedCostInr)]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <span
                  className={cn(
                    "mt-2 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                    healthToneTheme[food.health.tone],
                  )}
                >
                  {food.health.label}
                </span>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {stats.map((stat) => (
                <span
                  key={stat}
                  className="rounded-lg border border-[#eee0cf] bg-[#fffaf1] px-2.5 py-2 text-sm font-semibold text-[#2f241d] dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                >
                  {stat}
                </span>
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function MetricTable({ result }: { result: FoodCompareResult }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[#ead9c3] bg-white dark:border-white/10 dark:bg-white/[0.04]">
      <div className="min-w-[620px]">
        <div className="grid grid-cols-[0.72fr_1fr_1fr] bg-[#f5ead8] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#7b6250] dark:bg-white/[0.06] dark:text-white/58">
          <span>Item</span>
          <span
            className="min-w-0 text-right normal-case leading-5 tracking-normal"
            title={result.left.label}
          >
            {result.left.label}
          </span>
          <span
            className="min-w-0 text-right normal-case leading-5 tracking-normal"
            title={result.right.label}
          >
            {result.right.label}
          </span>
        </div>
        {result.metrics.map((metric) => (
          <div
            key={metric.key}
            className="grid grid-cols-[0.72fr_1fr_1fr] border-t border-[#efe0ce] px-3 py-3 text-sm dark:border-white/10"
          >
            <span className="font-semibold text-[#2f241d] dark:text-white">
              {metric.label}
            </span>
            <span
              className={cn(
                "text-right font-semibold",
                metric.winner === "left" ? sideTheme.left.text : "text-[#5f5044] dark:text-white/72",
              )}
            >
              {formatNumber(metric.leftValue, metric.unit)}
            </span>
            <span
              className={cn(
                "text-right font-semibold",
                metric.winner === "right" ? sideTheme.right.text : "text-[#5f5044] dark:text-white/72",
              )}
            >
              {formatNumber(metric.rightValue, metric.unit)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MobileMetricCards({ result }: { result: FoodCompareResult }) {
  return (
    <div className="grid gap-3">
      {result.metrics.map((metric) => {
        const winnerFood =
          metric.winner === "left"
            ? result.left
            : metric.winner === "right"
              ? result.right
              : null;
        const winnerTheme =
          metric.winner === "left"
            ? sideTheme.left
            : metric.winner === "right"
              ? sideTheme.right
              : null;
        const metricHint = metric.lowerIsBetter ? "Lower is better" : "Higher is better";

        return (
          <article
            key={metric.key}
            className="rounded-lg border border-[#ead9c3] bg-white p-3 dark:border-white/10 dark:bg-white/[0.04]"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[#2f241d] dark:text-white">
                  {metric.label}
                </h3>
                <p className="mt-0.5 text-xs font-medium text-[#7b6757] dark:text-white/58">
                  {metricHint}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
                  winnerTheme
                    ? `${winnerTheme.soft} ${winnerTheme.text}`
                    : "bg-[#f5ead8] text-[#8a6b35] dark:bg-[#3b2f12] dark:text-[#fde68a]",
                )}
              >
                {winnerFood ? winnerFood.label : "Close"}
              </span>
            </div>

            <div className="grid gap-2">
              {(["left", "right"] as const).map((side) => {
                const food = side === "left" ? result.left : result.right;
                const value =
                  side === "left" ? metric.leftValue : metric.rightValue;
                const isWinner = metric.winner === side;
                const theme = sideTheme[side];

                return (
                  <div
                    key={`${metric.key}-${side}`}
                    className={cn(
                      "rounded-lg border px-3 py-2",
                      isWinner
                        ? `${theme.border} ${theme.soft}`
                        : "border-[#efe0ce] bg-[#fffaf1] dark:border-white/10 dark:bg-white/[0.03]",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="min-w-0 truncate text-xs font-semibold uppercase tracking-[0.12em] text-[#7b6757] dark:text-white/58">
                        {food.label}
                      </span>
                      {isWinner && (
                        <CheckCircle2 className={cn("size-4 shrink-0", theme.text)} />
                      )}
                    </div>
                    <p
                      className={cn(
                        "mt-1 text-lg font-semibold",
                        isWinner ? theme.text : "text-[#2f241d] dark:text-white",
                      )}
                    >
                      {formatNumber(value, metric.unit)}
                    </p>
                  </div>
                );
              })}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function CautionList({ result }: { result: FoodCompareResult }) {
  return (
    <div className="rounded-lg border border-[#ead9c3] bg-[#fffaf1] p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#2f241d] dark:text-white">
        <AlertTriangle className="size-4 text-[#a46d2d]" />
        Keep in mind
      </p>
      <div className="grid gap-2">
        {result.cautions.map((item) => (
          <p
            key={`${item.title}-${item.body}`}
            className="text-sm leading-6 text-[#756354] dark:text-white/62"
          >
            <span className="font-semibold text-[#403126] dark:text-white">
              {item.title}:
            </span>{" "}
            {item.body}
          </p>
        ))}
      </div>
    </div>
  );
}

function ResultPanel({
  result,
}: {
  result: FoodCompareResult | null;
}) {
  if (!result) {
    return (
      <div className="rounded-lg border border-dashed border-[#d8bd9a] bg-white p-8 text-center dark:border-white/14 dark:bg-white/[0.04]">
        <Sparkles className={cn("mx-auto size-8", accentTextClass)} />
        <h2 className="mt-4 text-2xl font-semibold text-[#2f241d] dark:text-white">
          Choose two foods.
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-[#756354] dark:text-white/62">
          Search both foods, then tap Compare for a clear result.
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-w-0">
      <section className="rounded-lg border border-[#d9e4d9] bg-[#f7fbf5] p-4 dark:border-white/10 dark:bg-white/[0.04] sm:p-5">
        <p className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold", primaryPillClass)}>
          <Trophy className="size-3.5" />
          Better choice
        </p>
        <h2 className="mt-3 text-2xl font-semibold leading-tight text-[#2f241d] dark:text-white sm:text-3xl">
          {result.verdictTitle}
        </h2>
        <p className="mt-2 text-sm leading-7 text-[#756354] dark:text-white/64">
          {result.verdictBody}
        </p>
        <p className="mt-3 inline-flex rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#5f5044] dark:bg-white/[0.08] dark:text-white/70">
          Nutrition shown approx per eating portion
        </p>
      </section>

      <FoodInsightCard result={result} />

      <section className="mt-4 md:hidden">
        <MobileFoodSummary result={result} />
      </section>

      <section className="mt-4 hidden gap-4 md:grid lg:grid-cols-2">
        <FoodFactCard
          side="left"
          food={result.left}
          active={result.winner === "left"}
        />
        <FoodFactCard
          side="right"
          food={result.right}
          active={result.winner === "right"}
        />
      </section>

      <section className="mt-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#7a6a5c] dark:text-white/60">
          Clear reasons
        </p>
        <ReasonBox result={result} />
      </section>

      <section className="mt-4">
        <div className="md:hidden">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#7a6a5c] dark:text-white/60">
            Side-by-side numbers
          </p>
          <MobileMetricCards result={result} />
        </div>
        <div className="hidden md:block">
          <MetricTable result={result} />
        </div>
      </section>

      <section className="mt-4">
        <CautionList result={result} />
      </section>
    </div>
  );
}

function WinnerModal({
  result,
  onClose,
  onViewReport,
}: {
  result: FoodCompareResult;
  onClose: () => void;
  onViewReport: () => void;
}) {
  const winnerFood =
    result.winner === "left"
      ? result.left
      : result.winner === "right"
        ? result.right
        : null;
  const otherFood =
    result.winner === "left"
      ? result.right
      : result.winner === "right"
        ? result.left
        : null;
  const heroFood = winnerFood ?? result.left;
  const heroHealth = heroFood.health;
  const visibleReasons = result.keyPoints.slice(0, 2);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#16110d]/62 px-3 py-[calc(env(safe-area-inset-top)+0.75rem)] pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur-sm sm:px-4 sm:py-8">
      <div className="relative flex max-h-[86dvh] w-full max-w-[36rem] flex-col overflow-hidden rounded-[1rem] border border-[#ead9c3] bg-[#fffdf8] shadow-[0_32px_100px_-26px_rgba(27,17,10,0.66)] dark:border-white/10 dark:bg-[#12211c] sm:max-h-[calc(100dvh-4rem)] sm:rounded-[1.15rem]">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-[#173629] dark:bg-[#f4b04d]" />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close result"
          className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full border border-[#ead9c3] bg-white text-[#6f5d4f] shadow-sm transition hover:border-[#b63a29] hover:text-[#b63a29] dark:border-white/10 dark:bg-white/[0.06] dark:text-white/70 sm:right-4 sm:top-4 sm:size-9"
        >
          <X className="size-4" />
        </button>

        <div className="overflow-y-auto px-4 pb-4 pt-5 text-center sm:px-7 sm:pb-7 sm:pt-8">
          <div className="relative mx-auto flex size-14 items-center justify-center sm:size-20">
            <span className="absolute inset-0 rounded-full bg-[#0f766e]/18 motion-safe:animate-ping dark:bg-[#f4b04d]/22" />
            <span className={cn("relative flex size-11 items-center justify-center rounded-full shadow-[0_20px_54px_-24px_rgba(23,54,41,0.9)] motion-safe:animate-pulse sm:size-16", primaryPillClass)}>
              <Trophy className="size-5 sm:size-7" />
            </span>
          </div>

          <p className={cn("mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] sm:mt-3 sm:text-xs", accentTextClass)}>
            Better pick
          </p>
          <h3 className="mx-auto mt-1 max-w-lg text-xl font-semibold leading-tight text-[#2f241d] dark:text-white sm:mt-2 sm:text-3xl">
            {winnerFood ? winnerFood.label : "Both foods are close"}
          </h3>

          <div className="mx-auto mt-3 flex max-w-lg items-center justify-center gap-3 rounded-lg border border-[#ead9c3] bg-white p-2.5 text-left dark:border-white/10 dark:bg-white/[0.05] sm:mt-4 sm:p-3">
            <FoodImage
              src={heroFood.imageUrl}
              title={heroFood.label}
              className="size-14 rounded-lg sm:size-20"
            />
            <div className="min-w-0 flex-1">
              <span
                className={cn(
                  "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
                  healthToneTheme[heroHealth.tone],
                )}
              >
                {heroHealth.label}
              </span>
              <p className="mt-1.5 text-xs leading-5 text-[#756354] dark:text-white/64 sm:mt-2 sm:text-sm sm:leading-6">
                {result.healthInsight.title}
              </p>
            </div>
          </div>

          <p className="mx-auto mt-3 max-w-lg text-xs leading-6 text-[#756354] dark:text-white/64 sm:mt-4 sm:text-sm sm:leading-7">
            {result.healthInsight.body}
          </p>

          {otherFood && (
            <p className="mx-auto mt-2 max-w-lg text-[11px] font-semibold text-[#8a6b35] dark:text-white/58 sm:text-xs">
              Compared with {otherFood.label}
            </p>
          )}

          {visibleReasons.length > 0 && (
            <div className="mt-3 grid gap-2 sm:mt-4 sm:grid-cols-2">
              {visibleReasons.map((point, index) => (
                <div
                  key={`${point.title}-${point.body}`}
                  className={cn(
                    "rounded-lg border border-[#ead9c3] bg-[#fffaf1] p-3 text-left dark:border-white/10 dark:bg-white/[0.035]",
                    index > 0 && "hidden sm:block",
                  )}
                >
                  <p className={cn("text-[11px] font-semibold uppercase tracking-[0.14em] sm:text-xs", accentTextClass)}>
                    {point.title}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#5f5044] dark:text-white/64 sm:text-sm sm:leading-6">
                    {point.body}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-[#ead9c3] bg-[#fffaf1] p-3 dark:border-white/10 dark:bg-white/[0.035] sm:flex-row sm:p-5">
          <button
            type="button"
            onClick={onViewReport}
            className={cn("inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold", primaryButtonClass)}
          >
            See full report
            <ArrowRight className="size-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="hidden min-h-11 flex-1 items-center justify-center rounded-lg border border-[#dfc6a8] bg-white px-4 py-2 text-sm font-semibold text-[#3f3027] transition hover:border-primary hover:text-primary dark:border-white/10 dark:bg-white/[0.06] dark:text-white sm:inline-flex"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FoodCompareTool({
  initialResult,
  initialSuggestions,
}: FoodCompareToolProps) {
  const [leftFood, setLeftFood] = useState<FoodCompareSuggestion | null>(
    resultFoodToSuggestion(initialResult, "left"),
  );
  const [rightFood, setRightFood] = useState<FoodCompareSuggestion | null>(
    resultFoodToSuggestion(initialResult, "right"),
  );
  const [result, setResult] = useState(initialResult);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shareStatus, setShareStatus] = useState("Share");
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const canCompare = Boolean(
    leftFood && rightFood && leftFood.id !== rightFood.id && !loading,
  );
  const visibleError =
    leftFood && rightFood && leftFood.id === rightFood.id
      ? "Choose two different foods."
      : error;

  const clearReportForNewChoice = () => {
    setResult(null);
    setError("");
    setShowWinnerModal(false);
  };

  const runComparison = async () => {
    if (!leftFood || !rightFood) {
      setError("Choose two foods to compare.");
      return;
    }

    if (leftFood.id === rightFood.id) {
      setError("Choose two different foods.");
      return;
    }

    setLoading(true);
    setError("");
    setShowWinnerModal(false);

    try {
      const params = new URLSearchParams({
        leftId: leftFood.id,
        rightId: rightFood.id,
      });
      const responsePromise = fetch(`/api/tools/food-compare?${params.toString()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
      });
      const delayPromise = new Promise((resolve) => window.setTimeout(resolve, 1200));
      const [response] = await Promise.all([responsePromise, delayPromise]);

      if (!response.ok) throw new Error("Unable to compare foods");
      const payload = (await response.json()) as {
        result?: FoodCompareResult | null;
      };

      if (!payload.result) {
        setResult(null);
        setError("These foods cannot be compared yet.");
        return;
      }

      setResult(payload.result);
      playResultChime();
      setShowWinnerModal(true);
      window.history.replaceState(null, "", resultUrl(leftFood, rightFood));
    } catch {
      setResult(null);
      setError("Comparison could not load right now.");
    } finally {
      setLoading(false);
    }
  };

  const viewReport = () => {
    setShowWinnerModal(false);
    window.setTimeout(() => {
      document
        .getElementById("food-compare-report")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const handleShare = async () => {
    setShareStatus("Sharing");

    try {
      const url = `${window.location.origin}${resultUrl(leftFood, rightFood)}`;
      const text = result
        ? `${result.verdictTitle}\n${result.keyPoints
            .map((item) => `- ${item.body}`)
            .join("\n")}\n\nFood note: ${result.healthInsight.body}`
        : "Compare foods on Kya Khayen.";

      if (navigator.share) {
        await navigator.share({ title: "Smart Food Compare", text, url });
      } else {
        await navigator.clipboard.writeText(`${text}\n${url}`);
      }

      setShareStatus("Copied");
      window.setTimeout(() => setShareStatus("Share"), 1400);
    } catch {
      setShareStatus("Share");
    }
  };

  return (
    <div
      id="tool"
      className="scroll-mt-28 overflow-visible rounded-[1.15rem] border border-[#d9e4d9] bg-[#f7fbf5] shadow-[0_28px_80px_-44px_rgba(28,62,46,0.36)] dark:border-white/10 dark:bg-white/[0.04]"
    >
      {showWinnerModal && result && (
        <WinnerModal
          result={result}
          onClose={() => setShowWinnerModal(false)}
          onViewReport={viewReport}
        />
      )}

      <div className="border-b border-[#d9e4d9] bg-white/82 p-4 dark:border-white/10 dark:bg-white/[0.035] sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className={cn("text-xs font-semibold uppercase tracking-[0.22em]", accentTextClass)}>
              Food compare
            </p>
            <h2 className="mt-1 text-xl font-semibold text-[#2f241d] dark:text-white">
              {leftFood?.label ?? "Food 1"} vs {rightFood?.label ?? "Food 2"}
            </h2>
          </div>
          <p className={cn("rounded-lg border border-[#d9e4d9] bg-white px-3 py-2 text-sm font-semibold dark:border-white/10 dark:bg-[#123b36]", accentTextClass)}>
            Simple comparison
          </p>
        </div>
      </div>

      <div className="grid gap-0 xl:grid-cols-[0.78fr_1.22fr]">
        <aside className="relative z-30 border-b border-[#d9e4d9] bg-[#fffdf8]/74 p-4 dark:border-white/10 dark:bg-white/[0.03] sm:p-5 xl:border-b-0 xl:border-r">
          <div className="mb-4">
            <h1 className="text-2xl font-semibold leading-tight text-[#2f241d] dark:text-white">
              Select two foods.
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#786859] dark:text-white/66">
              Search real recipes and get a clear result.
            </p>
          </div>

          <div className="grid gap-5">
            <FoodPicker
              side="left"
              selected={leftFood}
              disabledId={rightFood?.id}
              contextId={rightFood?.id}
              suggestions={initialSuggestions}
              onSelect={(food) => {
                setLeftFood(food);
                clearReportForNewChoice();
              }}
            />
            <FoodPicker
              side="right"
              selected={rightFood}
              disabledId={leftFood?.id}
              contextId={leftFood?.id}
              suggestions={initialSuggestions}
              onSelect={(food) => {
                setRightFood(food);
                clearReportForNewChoice();
              }}
            />
          </div>

          <button
            type="button"
            onClick={runComparison}
            disabled={!canCompare}
            className={cn("mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45", primaryButtonClass)}
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            Compare foods
          </button>
          {result && (
            <button
              type="button"
              onClick={handleShare}
              className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#dfc6a8] bg-white px-4 py-2 text-sm font-semibold text-[#3f3027] transition hover:border-primary hover:text-primary dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
            >
              <Share2 className="size-4" />
              {shareStatus}
            </button>
          )}
        </aside>

        <main id="food-compare-report" className="min-w-0 scroll-mt-28 p-4 sm:p-5">
          {visibleError && (
            <div className="mb-4 rounded-lg border border-[#efb097] bg-[#fff0e8] px-4 py-3 text-sm font-semibold text-[#9c3426]">
              {visibleError}
            </div>
          )}
          <ResultPanel result={result} />
        </main>
      </div>
    </div>
  );
}
