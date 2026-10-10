import { ArrowRight, Minus, Plus, Search, X } from "lucide-react";
import { useEffect, useRef } from "react";

import type { IngredientSuggestion } from "@/components/sections/situation-tools/types";
import { formatLabel } from "@/components/sections/situation-tools/recipe-formatters";
import { cn } from "@/lib/utils";

export function ButtonChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "min-h-10 rounded-lg border px-3 py-2 text-center text-xs font-semibold transition sm:text-sm",
        active
          ? "border-[#b63a29] bg-[#b63a29] text-white shadow-sm"
          : "border-[#ead9c3] bg-[#fffdf8] text-[#5f4c3d] hover:border-[#c88b3c] hover:text-[#9a3c2e] dark:border-white/10 dark:bg-white/[0.06] dark:text-white/72",
      )}
    >
      {children}
    </button>
  );
}

export function ControlBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a6730] dark:text-[#efcb83]">
        {title}
      </p>
      {children}
    </div>
  );
}

export function IngredientPicker({
  title,
  input,
  setInput,
  selected,
  labels,
  suggestions,
  isLoading,
  isOpen,
  setOpen,
  placeholder,
  addValue,
  removeValue,
}: {
  title: string;
  input: string;
  setInput: (value: string) => void;
  selected: string[];
  labels: Record<string, string>;
  suggestions: IngredientSuggestion[];
  isLoading: boolean;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  placeholder: string;
  addValue: (value: string, label?: string) => void;
  removeValue: (value: string) => void;
}) {
  const pickerRef = useRef<HTMLDivElement>(null);
  const visibleSuggestions = suggestions.filter(
    (ingredient) => !selected.includes(ingredient.value),
  );
  const hasInput = input.trim().length > 0;
  const showDropdown = isOpen && (isLoading || visibleSuggestions.length > 0 || hasInput);

  const submitValue = () => {
    const first = visibleSuggestions[0];

    if (!hasInput && first) {
      addValue(first.value, first.label);
      setOpen(false);
      return;
    }

    addValue(input);
    setOpen(false);
  };

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeOnOutsidePress);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePress);
    };
  }, [isOpen, setOpen]);

  return (
    <ControlBlock title={title}>
      <div
        ref={pickerRef}
        className="relative"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setOpen(false);
          }
        }}
      >
        <form
          className="relative"
          onSubmit={(event) => {
            event.preventDefault();
            submitValue();
          }}
        >
          <Search className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-[#8c735c]" />
          <input
            value={input}
            onPointerDown={() => setOpen(true)}
            onFocus={() => setOpen(true)}
            onClick={() => setOpen(true)}
            onChange={(event) => {
              setInput(event.target.value);
              setOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setOpen(false);
              }
            }}
            placeholder={placeholder}
            className="h-[46px] w-full rounded-full border border-[#ead6b9] bg-white pl-12 pr-[92px] text-[16px] font-medium text-[#34271f] shadow-[0_12px_32px_-24px_rgba(61,37,20,0.48)] outline-none placeholder:text-[#968577] transition focus:border-[#d9a24b] focus:ring-2 focus:ring-[#d9a24b]/18 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-white/42 sm:text-sm"
          />
          {input && (
            <button
              type="button"
              onClick={() => {
                setInput("");
                setOpen(true);
              }}
              aria-label="Clear ingredient search"
              className="absolute right-[52px] top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-[#806c5d] transition hover:bg-[#f2e4d0] dark:text-white/70 dark:hover:bg-white/10"
            >
              <X className="size-4" />
            </button>
          )}
          <button
            type="submit"
            aria-label="Add item"
            className="absolute right-1.5 top-1/2 inline-flex size-[36px] -translate-y-1/2 items-center justify-center rounded-full bg-primary text-white transition hover:bg-[#a92d20]"
          >
            <Plus className="size-4" />
          </button>
        </form>

        {showDropdown && (
          <div className="home-hide-scrollbar absolute left-0 right-0 z-50 mt-2 flex max-h-[20rem] flex-col overflow-y-auto overscroll-contain rounded-[1.25rem] border border-[#ead9c2] bg-[#fffdf8] p-2 shadow-[0_24px_62px_-26px_rgba(56,35,19,0.44)] dark:border-white/10 dark:bg-[#14251f]">
            {isLoading ? (
              <div className="px-3.5 py-4 text-sm font-medium text-[#75675b] dark:text-white/62">
                Finding items...
              </div>
            ) : visibleSuggestions.length > 0 ? (
              visibleSuggestions.map((ingredient) => (
                <button
                  type="button"
                  key={ingredient.id}
                  onClick={() => {
                    addValue(ingredient.value, ingredient.label);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-3 text-left transition hover:bg-[#faf1e4] dark:hover:bg-white/8"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-[#372921] dark:text-white">
                      {ingredient.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-[#75675b] dark:text-white/60">
                      Tap to add
                    </span>
                  </span>
                  <Plus className="size-4 shrink-0 text-primary" />
                </button>
              ))
            ) : (
              <button
                type="button"
                onClick={() => {
                  addValue(input);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-3 text-left transition hover:bg-[#faf1e4] dark:hover:bg-white/8"
              >
                <span>
                  <span className="block text-sm font-semibold text-[#372921] dark:text-white">
                    Search <span className="text-primary">{input.trim()}</span>
                  </span>
                  <span className="mt-0.5 block text-xs text-[#806c5d] dark:text-white/60">
                    Match this text against recipe ingredients
                  </span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-primary" />
              </button>
            )}
          </div>
        )}
      </div>

      {selected.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selected.map((value) => (
            <button
              type="button"
              key={value}
              onClick={() => removeValue(value)}
              className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#d8bd9a] bg-[#f3e6d2] px-3 py-1.5 text-sm font-semibold text-[#5a4638] transition hover:border-[#b63a29] hover:text-[#9a3c2e] dark:border-white/10 dark:bg-white/8 dark:text-white/76"
            >
              {formatLabel(value, labels)}
              <X className="size-3.5" />
            </button>
          ))}
        </div>
      )}
    </ControlBlock>
  );
}

export function NumberStepper({
  title,
  value,
  setValue,
  min,
  max,
  step,
  prefix = "",
  suffix = "",
}: {
  title: string;
  value: number;
  setValue: (value: number) => void;
  min: number;
  max: number;
  step: number;
  prefix?: string;
  suffix?: string;
}) {
  const updateValue = (nextValue: number) => {
    setValue(Math.min(Math.max(nextValue, min), max));
  };

  return (
    <ControlBlock title={title}>
      <div className="flex h-[46px] items-center overflow-hidden rounded-full border border-[#ead6b9] bg-white shadow-[0_12px_32px_-24px_rgba(61,37,20,0.48)] dark:border-white/10 dark:bg-white/[0.06]">
        <button
          type="button"
          onClick={() => updateValue(value - step)}
          aria-label={`Decrease ${title}`}
          className="inline-flex h-full w-12 items-center justify-center text-[#735f50] transition hover:bg-[#f5ead8] dark:text-white/72 dark:hover:bg-white/10"
        >
          <Minus className="size-4" />
        </button>
        <div className="flex min-w-0 flex-1 items-center justify-center gap-1 text-center">
          {prefix && (
            <span className="text-sm font-semibold text-[#806c5d] dark:text-white/62">
              {prefix}
            </span>
          )}
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(event) => updateValue(Number(event.target.value) || min)}
            className="h-full w-20 bg-transparent text-center text-base font-semibold text-[#34271f] outline-none dark:text-white"
          />
          {suffix && (
            <span className="text-sm font-semibold text-[#806c5d] dark:text-white/62">
              {suffix}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => updateValue(value + step)}
          aria-label={`Increase ${title}`}
          className="inline-flex h-full w-12 items-center justify-center text-[#735f50] transition hover:bg-[#f5ead8] dark:text-white/72 dark:hover:bg-white/10"
        >
          <Plus className="size-4" />
        </button>
      </div>
    </ControlBlock>
  );
}
