"use client";

import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BookOpen,
  Carrot,
  ChefHat,
  Clock,
  Heart,
  History,
  Loader,
  MapPin,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import {
  GetRecipeSearchSuggestions,
  type RecipeSearchSuggestion,
} from "@/actions/get-searched-recipes";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

type SearchInputProps = {
  onClose?: () => void;
  initialValue?: string;
  autoFocus?: boolean;
  className?: string;
  compact?: boolean;
  dense?: boolean;
};

const searchPrompts = [
  "Search recipes and food stories...",
  "Paneer, breakfast, rajma chawal...",
  "Summer kitchen ideas and guides...",
  "Chicken curry, lunch, dinner ideas...",
  "Easy lunch, dinner, and snack ideas...",
  "Summer smoothies, juices, coolers...",
  "Quick snacks, evening cravings...",
];

const RECENT_SEARCHES_STORAGE_KEY = "kyakhayen:recent-searches";
const MAX_RECENT_SEARCHES = 6;

const suggestionKindIcons: Record<RecipeSearchSuggestion["kind"], LucideIcon> = {
  Dish: ChefHat,
  Ingredient: Carrot,
  Cuisine: MapPin,
  Mealtime: Clock,
  Preference: Heart,
  Collection: Sparkles,
  Story: BookOpen,
};

function normalizeSearchValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ");
}

export const SearchInput = ({
  onClose,
  initialValue = "",
  autoFocus = true,
  className,
  compact = false,
  dense = false,
}: SearchInputProps) => {
  const [value, setValue] = useState(initialValue);
  const [searchResults, setSearchResults] = useState<RecipeSearchSuggestion[]>([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [animatedPlaceholder, setAnimatedPlaceholder] = useState(searchPrompts[0]);
  const [isSuggestionLoading, setIsSuggestionLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const debouncedValue = useDebounce(value, 280);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const outsidePointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastSuggestionQueryRef = useRef("");
  const suggestionRequestIdRef = useRef(0);
  const hasSearchedRef = useRef(false);
  const resultsCountRef = useRef(0);
  const recentSearchesRef = useRef<string[]>([]);
  const [mobileSuggestionsTop, setMobileSuggestionsTop] = useState<number | null>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const storedSearches = window.localStorage.getItem(
          RECENT_SEARCHES_STORAGE_KEY,
        );
        if (!storedSearches) return;

        const parsedSearches: unknown = JSON.parse(storedSearches);
        if (!Array.isArray(parsedSearches)) return;

        setRecentSearches(
          parsedSearches
            .filter((item): item is string => typeof item === "string")
            .map((item) => item.trim())
            .filter(Boolean)
            .slice(0, MAX_RECENT_SEARCHES),
        );
      } catch {
        window.localStorage.removeItem(RECENT_SEARCHES_STORAGE_KEY);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setValue(initialValue);
      setSearchResults([]);
      setSelectedResultIndex(-1);
      setHasSearched(false);
      setIsSuggestionLoading(false);
      lastSuggestionQueryRef.current = "";
      resultsCountRef.current = 0;
      hasSearchedRef.current = false;
    }, 0);

    return () => window.clearTimeout(timer);
  }, [initialValue]);

  useEffect(() => {
    hasSearchedRef.current = hasSearched;
  }, [hasSearched]);

  useEffect(() => {
    resultsCountRef.current = searchResults.length;
  }, [searchResults.length]);

  useEffect(() => {
    recentSearchesRef.current = recentSearches;
  }, [recentSearches]);

  useEffect(() => {
    let promptIndex = 0;
    let characterIndex = searchPrompts[0].length;
    let deleting = true;
    let timer = 0;

    const typeNextCharacter = () => {
      const prompt = searchPrompts[promptIndex];

      if (deleting) {
        characterIndex -= 1;
        setAnimatedPlaceholder(prompt.slice(0, characterIndex));

        if (characterIndex === 0) {
          deleting = false;
          promptIndex = (promptIndex + 1) % searchPrompts.length;
          timer = window.setTimeout(typeNextCharacter, 380);
          return;
        }

        timer = window.setTimeout(typeNextCharacter, 34);
        return;
      }

      characterIndex += 1;
      setAnimatedPlaceholder(searchPrompts[promptIndex].slice(0, characterIndex));

      if (characterIndex === searchPrompts[promptIndex].length) {
        deleting = true;
        timer = window.setTimeout(typeNextCharacter, 1700);
        return;
      }

      timer = window.setTimeout(typeNextCharacter, 68);
    };

    timer = window.setTimeout(typeNextCharacter, 1700);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const isInsideSearchSurface = (target: EventTarget | null) => {
      if (!(target instanceof Node)) return false;

      return (
        formRef.current?.contains(target) ||
        suggestionsRef.current?.contains(target)
      );
    };

    const dismissSuggestions = () => {
      outsidePointerStartRef.current = null;
      inputRef.current?.blur();
      suggestionRequestIdRef.current += 1;
      setShowSuggestions(false);
      setShowRecentSearches(false);
      setIsSuggestionLoading(false);
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (isInsideSearchSurface(event.target)) {
        outsidePointerStartRef.current = null;
        return;
      }

      outsidePointerStartRef.current = {
        x: event.clientX,
        y: event.clientY,
      };
    };

    const handlePointerUp = (event: PointerEvent) => {
      const start = outsidePointerStartRef.current;
      outsidePointerStartRef.current = null;

      if (!start || isInsideSearchSurface(event.target)) return;

      const pointerTravel = Math.hypot(
        event.clientX - start.x,
        event.clientY - start.y,
      );

      if (pointerTravel <= 10) {
        dismissSuggestions();
      }
    };

    const handlePointerCancel = () => {
      outsidePointerStartRef.current = null;
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("pointerup", handlePointerUp);
    document.addEventListener("pointercancel", handlePointerCancel);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("pointercancel", handlePointerCancel);
    };
  }, []);

  useEffect(() => {
    const dismissOnKeyboard = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const target = event.target as Node;

      if (
        formRef.current?.contains(target) ||
        suggestionsRef.current?.contains(target)
      ) {
        suggestionRequestIdRef.current += 1;
        setShowSuggestions(false);
        setShowRecentSearches(false);
        setIsSuggestionLoading(false);
      }
    };

    document.addEventListener("keydown", dismissOnKeyboard);

    return () => document.removeEventListener("keydown", dismissOnKeyboard);
  }, []);

  const updateMobileSuggestionsPosition = useCallback(() => {
    if (!compact) return;

    const fieldRect = formRef.current?.getBoundingClientRect();
    if (!fieldRect) return;

    setMobileSuggestionsTop(Math.max(8, Math.round(fieldRect.bottom + 8)));
  }, [compact]);

  const loadSuggestions = useCallback(
    (rawQuery: string, options: { force?: boolean } = {}) => {
      const cleanQuery = rawQuery.trim();

      if (cleanQuery.length < 2) {
        suggestionRequestIdRef.current += 1;
        lastSuggestionQueryRef.current = "";
        resultsCountRef.current = 0;
        hasSearchedRef.current = false;
        setSearchResults([]);
        setSelectedResultIndex(-1);
        setShowSuggestions(false);
        setShowRecentSearches(
          document.activeElement === inputRef.current &&
            recentSearchesRef.current.length > 0,
        );
        setHasSearched(false);
        setIsSuggestionLoading(false);
        return;
      }

      const normalizedQuery = normalizeSearchValue(cleanQuery);
      const hasFreshResults =
        lastSuggestionQueryRef.current === normalizedQuery && resultsCountRef.current > 0;

      if (!options.force && hasFreshResults) {
        setShowSuggestions(true);
        return;
      }

      const requestId = suggestionRequestIdRef.current + 1;
      suggestionRequestIdRef.current = requestId;
      lastSuggestionQueryRef.current = normalizedQuery;
      resultsCountRef.current = 0;
      hasSearchedRef.current = false;
      setShowSuggestions(true);
      setShowRecentSearches(false);
      setSelectedResultIndex(-1);
      setHasSearched(false);
      setIsSuggestionLoading(true);

      startTransition(async () => {
        try {
          const suggestions = await GetRecipeSearchSuggestions({ k: cleanQuery });

          if (suggestionRequestIdRef.current !== requestId) return;

          resultsCountRef.current = suggestions.length;
          hasSearchedRef.current = true;
          setSearchResults(suggestions);
          setSelectedResultIndex(-1);
          setShowSuggestions(true);
          setHasSearched(true);
        } finally {
          if (suggestionRequestIdRef.current === requestId) {
            setIsSuggestionLoading(false);
          }
        }
      });
    },
    [startTransition],
  );

  const revealSuggestions = useCallback(() => {
    const currentValue = inputRef.current?.value ?? value;

    if (currentValue.trim().length < 2) {
      setShowSuggestions(false);
      setShowRecentSearches(recentSearchesRef.current.length > 0);
      updateMobileSuggestionsPosition();
      return;
    }

    setShowRecentSearches(false);
    if (resultsCountRef.current > 0 || hasSearchedRef.current) {
      setSelectedResultIndex(-1);
      setShowSuggestions(true);
      updateMobileSuggestionsPosition();
      return;
    }

    loadSuggestions(currentValue, { force: true });
  }, [loadSuggestions, updateMobileSuggestionsPosition, value]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    input.addEventListener("click", revealSuggestions);
    input.addEventListener("focus", revealSuggestions);
    input.addEventListener("pointerdown", revealSuggestions);
    input.addEventListener("touchstart", revealSuggestions, { passive: true });

    return () => {
      input.removeEventListener("click", revealSuggestions);
      input.removeEventListener("focus", revealSuggestions);
      input.removeEventListener("pointerdown", revealSuggestions);
      input.removeEventListener("touchstart", revealSuggestions);
    };
  }, [revealSuggestions]);

  useEffect(() => {
    if (!compact) return;

    const revealFocusedSearch = () => {
      if (document.activeElement === inputRef.current) {
        revealSuggestions();
      }
    };

    window.addEventListener("scroll", revealFocusedSearch, { passive: true });

    return () => window.removeEventListener("scroll", revealFocusedSearch);
  }, [compact, revealSuggestions]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadSuggestions(debouncedValue);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [debouncedValue, loadSuggestions]);

  useEffect(() => {
    if (!compact || (!showSuggestions && !showRecentSearches)) return;

    let frame = window.requestAnimationFrame(updateMobileSuggestionsPosition);
    const updateOnNextFrame = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateMobileSuggestionsPosition);
    };

    window.addEventListener("resize", updateOnNextFrame);
    window.addEventListener("scroll", updateOnNextFrame, { passive: true });

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateOnNextFrame);
      window.removeEventListener("scroll", updateOnNextFrame);
    };
  }, [compact, showRecentSearches, showSuggestions, updateMobileSuggestionsPosition]);

  const rememberSearch = useCallback((query: string) => {
    const cleanQuery = query.replace(/\s+/g, " ").trim();
    if (cleanQuery.length < 2) return;

    setRecentSearches((currentSearches) => {
      const normalizedQuery = normalizeSearchValue(cleanQuery);
      const nextSearches = [
        cleanQuery,
        ...currentSearches.filter(
          (item) => normalizeSearchValue(item) !== normalizedQuery,
        ),
      ].slice(0, MAX_RECENT_SEARCHES);

      try {
        window.localStorage.setItem(
          RECENT_SEARCHES_STORAGE_KEY,
          JSON.stringify(nextSearches),
        );
      } catch {
        // Search should keep working even if browser storage is unavailable.
      }

      return nextSearches;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    setShowRecentSearches(false);

    try {
      window.localStorage.removeItem(RECENT_SEARCHES_STORAGE_KEY);
    } catch {
      // Ignore storage failures; the in-memory list is already cleared.
    }
  }, []);

  const removeRecentSearch = useCallback((query: string) => {
    const normalizedQuery = normalizeSearchValue(query);
    const nextSearches = recentSearchesRef.current.filter(
      (item) => normalizeSearchValue(item) !== normalizedQuery,
    );

    setRecentSearches(nextSearches);
    setShowRecentSearches(nextSearches.length > 0);

    try {
      if (nextSearches.length > 0) {
        window.localStorage.setItem(
          RECENT_SEARCHES_STORAGE_KEY,
          JSON.stringify(nextSearches),
        );
      } else {
        window.localStorage.removeItem(RECENT_SEARCHES_STORAGE_KEY);
      }
    } catch {
      // Ignore storage failures; the in-memory list is already updated.
    }
  }, []);

  const runSearch = (query: string) => {
    const cleanQuery = query.trim();
    if (!cleanQuery) return;

    rememberSearch(cleanQuery);
    suggestionRequestIdRef.current += 1;
    lastSuggestionQueryRef.current = "";
    router.push(`/search?k=${encodeURIComponent(cleanQuery)}`);
    setShowSuggestions(false);
    setShowRecentSearches(false);
    setSearchResults([]);
    resultsCountRef.current = 0;
    hasSearchedRef.current = false;
    setHasSearched(false);
    setIsSuggestionLoading(false);
    inputRef.current?.blur();
    onClose?.();
  };

  const exactRecipeResult = (query: string) => {
    const normalizedQuery = normalizeSearchValue(query);

    return searchResults.find(
      (result) =>
        result.kind === "Dish" &&
        result.href &&
        (result.isExact || normalizeSearchValue(result.label) === normalizedQuery),
    );
  };

  const submitSearch = (query: string) => {
    const exactRecipe = exactRecipeResult(query);

    if (exactRecipe) {
      openSuggestion(exactRecipe);
      return;
    }

    runSearch(query);
  };

  const openSuggestion = (suggestion: RecipeSearchSuggestion) => {
    if (suggestion.href) {
      rememberSearch(suggestion.query || suggestion.label);
      suggestionRequestIdRef.current += 1;
      lastSuggestionQueryRef.current = "";
      router.push(suggestion.href);
      setShowSuggestions(false);
      setShowRecentSearches(false);
      setSearchResults([]);
      resultsCountRef.current = 0;
      hasSearchedRef.current = false;
      setHasSearched(false);
      setIsSuggestionLoading(false);
      inputRef.current?.blur();
      onClose?.();
      return;
    }

    runSearch(suggestion.query);
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (selectedResultIndex >= 0) {
        openSuggestion(searchResults[selectedResultIndex]);
      } else {
        submitSearch(value);
      }
    } else if (event.key === "Escape") {
      suggestionRequestIdRef.current += 1;
      setShowSuggestions(false);
      setShowRecentSearches(false);
      setIsSuggestionLoading(false);
      setSelectedResultIndex(-1);
      inputRef.current?.blur();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedResultIndex((previous) =>
        Math.min(previous + 1, searchResults.length - 1),
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedResultIndex((previous) => Math.max(previous - 1, -1));
    }
  };

  const suggestionsPanelClassName = cn(
    "search-suggestions z-[70] flex flex-col overflow-hidden rounded-[1.25rem] border border-[#ead9c2] bg-[#fffdf8] p-2 shadow-[0_24px_62px_-26px_rgba(56,35,19,0.44)]",
    compact
      ? "fixed left-3 right-3 max-h-[min(62svh,28rem)] overflow-y-auto"
      : "absolute top-[calc(100%+0.55rem)] w-full",
  );
  const suggestionsPanelStyle =
    compact && mobileSuggestionsTop !== null
      ? { top: `${mobileSuggestionsTop}px` }
      : undefined;
  const shouldShowRecentSearches =
    showRecentSearches && value.trim().length < 2 && recentSearches.length > 0;

  return (
    <form
      ref={formRef}
      className={cn("relative w-full", className)}
      onSubmit={(event) => {
        event.preventDefault();
        submitSearch(value);
      }}
    >
      <div
        className="search-field-shell relative"
        onMouseDownCapture={revealSuggestions}
        onPointerDownCapture={revealSuggestions}
        onTouchStart={revealSuggestions}
      >
        <Search
          className={cn(
            "search-leading-icon pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[#8c735c]",
            compact || dense ? "size-[18px]" : "size-5",
          )}
        />
        <Input
          ref={inputRef}
          onChange={(event) => {
            const nextValue = event.target.value;
            const hasSearchQuery = nextValue.trim().length >= 2;

            suggestionRequestIdRef.current += 1;
            setValue(nextValue);
            setSearchResults([]);
            resultsCountRef.current = 0;
            hasSearchedRef.current = false;
            setSelectedResultIndex(-1);
            setHasSearched(false);
            setIsSuggestionLoading(false);
            setShowSuggestions(hasSearchQuery);
            setShowRecentSearches(
              !hasSearchQuery && recentSearchesRef.current.length > 0,
            );
            if (!hasSearchQuery) updateMobileSuggestionsPosition();
          }}
          onFocus={() => {
            revealSuggestions();
          }}
          onClick={revealSuggestions}
          onPointerDown={revealSuggestions}
          onKeyDown={handleKeyPress}
          value={value}
          autoComplete="off"
          aria-label="Search recipes, ingredients or food stories"
          className={cn(
            "w-full rounded-full border-[#ead6b9] bg-white pl-14 text-[#34271f] shadow-[0_12px_32px_-24px_rgba(61,37,20,0.48)] placeholder:text-[#968577] focus-visible:border-[#d9a24b] focus-visible:ring-[#d9a24b]/18",
            dense
              ? "h-[42px] pr-[50px] text-[16px] sm:text-sm"
              : compact
              ? "h-[46px] pr-[54px] text-[16px] sm:text-sm"
              : "h-[58px] pr-[110px] text-[16px] sm:h-[66px] sm:pr-28 sm:text-base",
          )}
          placeholder={animatedPlaceholder}
        />
        <button
          type="submit"
          aria-label="Search"
          className={cn(
            "search-submit-button absolute right-1.5 top-1/2 inline-flex -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-primary text-sm font-semibold text-white transition hover:bg-[#a92d20]",
            dense
              ? "size-[34px]"
              : compact
              ? "size-[36px]"
              : "h-[46px] gap-1.5 px-4 sm:h-[52px] sm:px-6",
          )}
        >
          {compact || dense ? (
            <ArrowRight className="size-4" />
          ) : (
            <>
              Search <ArrowRight className="hidden size-4 sm:block" />
            </>
          )}
        </button>
      </div>

      {shouldShowRecentSearches && (
        <div
          ref={suggestionsRef}
          role="listbox"
          aria-label="Recent searches"
          style={suggestionsPanelStyle}
          className={suggestionsPanelClassName}
        >
          <div className="search-recent-header flex items-center justify-between px-3.5 pb-2 pt-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#8b6e49]">
            <span>Recent searches</span>
            <button
              type="button"
              className="search-recent-clear cursor-pointer rounded-full px-2 py-1 text-[11px] font-semibold normal-case tracking-normal text-[#9b3a2f] transition hover:bg-[#f6e4cf] hover:text-primary"
              onClick={clearRecentSearches}
            >
              Clear
            </button>
          </div>
          {recentSearches.map((recentSearch) => (
            <div
              key={recentSearch}
              className="search-recent-item flex items-center gap-1 rounded-xl border border-transparent transition hover:border-[#dfb36a] hover:bg-[#faf1e4]"
            >
              <button
                type="button"
                role="option"
                aria-selected={false}
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 px-3.5 py-3 text-left"
                onClick={() => runSearch(recentSearch)}
              >
                <span className="search-kind-icon flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f1e5d4] text-[#9c6a2e]">
                  <History className="size-4" aria-hidden="true" />
                </span>
                <span className="truncate text-sm font-semibold text-[#372921]">
                  {recentSearch}
                </span>
              </button>
              <button
                type="button"
                aria-label={`Remove ${recentSearch} from recent searches`}
                className="search-recent-remove mr-2 flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#8f7151] transition hover:bg-[#f1e0cb] hover:text-primary"
                onClick={() => removeRecentSearch(recentSearch)}
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showSuggestions &&
        (isPending || isSuggestionLoading || hasSearched || searchResults.length > 0) &&
        value.trim().length >= 2 && (
        <div
          ref={suggestionsRef}
          role="listbox"
          aria-label="Search suggestions"
          style={suggestionsPanelStyle}
          className={suggestionsPanelClassName}
        >
          {(isPending || isSuggestionLoading) && searchResults.length === 0 && (
            <div className="search-loading-state flex items-center justify-center gap-3 px-3.5 py-5 text-sm text-[#75675b]">
              <Loader className="size-4 animate-spin" />
              Swaad dhoondh rahe hain...
            </div>
          )}
          {!isPending && !isSuggestionLoading && hasSearched && searchResults.length === 0 && (
            <div className="search-empty-state px-5 py-6 text-center">
              <p className="search-empty-title text-sm font-semibold text-[#372921]">
                Let&apos;s try another flavour
              </p>
              <p className="search-empty-copy mt-1.5 text-xs leading-5 text-[#75675b]">
                Search paneer, breakfast, rajma or your favourite craving.
              </p>
            </div>
          )}
          {searchResults.map((result, index) => {
            const KindIcon = suggestionKindIcons[result.kind];

            return (
              <button
                type="button"
                role="option"
                aria-selected={selectedResultIndex === index}
                key={`${result.kind}-${result.label}`}
                className={cn(
                  "search-suggestion-item flex w-full cursor-pointer items-center justify-between rounded-xl border border-transparent px-3.5 py-3 text-left transition hover:border-[#dfb36a] hover:bg-[#faf1e4]",
                  selectedResultIndex === index &&
                    "search-suggestion-active border-[#dfb36a] bg-[#faf1e4]",
                )}
                onClick={() => {
                  openSuggestion(result);
                }}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="search-kind-icon relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#f1e5d4] text-[#9c6a2e]">
                    {result.imageUrl ? (
                      <Image
                        src={result.imageUrl}
                        alt=""
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <KindIcon className="size-4" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-[#372921]">
                      {result.label}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a7834d]">
                      <span>{result.kind === "Dish" ? "Recipe" : result.kind}</span>
                      {result.meta && (
                        <>
                          <span className="text-[#d4b58b]">•</span>
                          <span className="max-w-[16rem] truncate normal-case tracking-normal text-[#7c6a5d]">
                            {result.meta}
                          </span>
                        </>
                      )}
                      {result.isExact && (
                        <span className="rounded-full bg-[#eaf2df] px-2 py-0.5 text-[9px] tracking-[0.12em] text-[#315036]">
                          Exact
                        </span>
                      )}
                    </span>
                  </span>
                </span>
                <ArrowRight className="search-suggestion-arrow size-4 text-[#b38b53]" />
              </button>
            );
          })}
          {searchResults.length > 0 && (
            <button
              type="button"
              className="search-view-all-button mt-1 flex w-full cursor-pointer items-center justify-between rounded-xl bg-[#ead8bd] px-3.5 py-3 text-left text-sm font-semibold text-[#3b2719] transition hover:bg-[#dec59d] hover:text-primary"
              onClick={() => runSearch(value)}
            >
              <span className="truncate">See all results for &quot;{value.trim()}&quot;</span>
              <ArrowRight className="size-4 shrink-0" />
            </button>
          )}
        </div>
      )}
    </form>
  );
};
