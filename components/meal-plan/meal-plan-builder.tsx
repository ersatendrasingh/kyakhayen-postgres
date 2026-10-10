"use client";

import axios from "axios";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import Container from "@/components/container";
import MealPlanProgressModal from "@/components/meal-plan/meal-plan-progress-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Option = {
  id: string;
  title: string;
  imageUrl: string | null;
};

type MealPlanBuilderProps = {
  foodPreferences: Option[];
  cuisines: Option[];
  exclusions: Option[];
  cookingSkills: Option[];
  activePlanName?: string;
  hasPaidAccess: boolean;
  initialDraft: Draft;
};

type Draft = {
  foodPreference: string | null;
  cuisines: string[];
  exclusions: string[];
  cookingSkill: string | null;
};

const emptyDraft: Draft = {
  foodPreference: null,
  cuisines: [],
  exclusions: [],
  cookingSkill: null,
};
const storageKey = "mealPlanBuilderDraft";
const pendingGenerationKey = "mealPlanPendingGeneration";
const storageVersion = 2;
const generationStallLimitMs = 3 * 60 * 1000;
const genericOptionImage = "/assets/images/meal-plan-choice-fallback.svg";
const fallbackOptionImages: Record<string, string> = {
  mustard: "/assets/images/allergies/mustard.svg",
  sesame: "/assets/images/allergies/sesame.svg",
  shellfish: "/assets/images/allergies/shellfish.svg",
};

type SavedWizard = {
  version: number;
  step: number;
  draft: Draft;
};

const stepDetails = [
  {
    label: "Food style",
    title: "What kind of food fits your table?",
    detail: "Choose one everyday eating preference for your plan.",
  },
  {
    label: "Cuisines",
    title: "Which cuisines do you look forward to?",
    detail:
      "Select one or more. We will use these for variety through the week.",
  },
  {
    label: "Exclusions",
    title: "Anything you want left out?",
    detail:
      "Optional. Select ingredients you do not want included in your planned dishes.",
  },
  {
    label: "Cooking",
    title: "How comfortable are you in the kitchen?",
    detail: "This helps keep the recipes practical for your routine.",
  },
  {
    label: "Review",
    title: "Ready to build your week?",
    detail: "Check your choices before we prepare your personalized plan.",
  },
];

function readWizardState(initialDraft: Draft): { draft: Draft; step: number } {
  if (typeof window === "undefined") return { draft: initialDraft, step: 0 };
  try {
    const value = window.localStorage.getItem(storageKey);
    if (!value) return { draft: initialDraft, step: 0 };
    const saved = JSON.parse(value) as Partial<SavedWizard>;
    if (
      saved.version !== storageVersion ||
      !saved.draft ||
      typeof saved.step !== "number"
    ) {
      return { draft: initialDraft, step: 0 };
    }
    return {
      draft: { ...emptyDraft, ...saved.draft },
      step: Math.min(Math.max(saved.step, 0), stepDetails.length - 1),
    };
  } catch {
    return { draft: initialDraft, step: 0 };
  }
}

const optionImageSrc = (option: Option) => {
  if (option.imageUrl) return option.imageUrl;

  const key = option.title
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return fallbackOptionImages[key] ?? genericOptionImage;
};

export default function MealPlanBuilder({
  foodPreferences,
  cuisines,
  exclusions,
  cookingSkills,
  activePlanName,
  hasPaidAccess,
  initialDraft,
}: MealPlanBuilderProps) {
  const accessLabel = hasPaidAccess
    ? `${activePlanName || "Membership"} access`
    : "7-day launch access";
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [hydrated, setHydrated] = useState(false);
  const [step, setStep] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [generationModalOpen, setGenerationModalOpen] = useState(false);
  const [generationJobId, setGenerationJobId] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationMessage, setGenerationMessage] = useState(
    "Starting your personalized meal plan",
  );
  const [generationFailed, setGenerationFailed] = useState(false);
  const choiceRailRef = useRef<HTMLDivElement>(null);
  const resumedGenerationRef = useRef(false);
  const router = useRouter();
  const { data: session, update } = useSession();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedWizard = readWizardState(initialDraft);
      setDraft(savedWizard.draft);
      setStep(savedWizard.step);
      setHydrated(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [initialDraft]);

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({ version: storageVersion, draft, step }),
      );
    }
  }, [draft, hydrated, step]);

  useEffect(() => {
    choiceRailRef.current?.scrollTo({ left: 0, behavior: "smooth" });
  }, [searchQuery, step]);

  useEffect(() => {
    if (!generationJobId || generationFailed) return;

    let cancelled = false;
    let lastPercentage = -1;
    let lastMessage = "";
    let lastChangeAt = Date.now();

    const pollStatus = async () => {
      try {
        const response = await axios.get(
          `/api/meal-plan/generation/${generationJobId}`,
        );
        if (cancelled) return;
        const percentage =
          typeof response.data.percentage === "number"
            ? response.data.percentage
            : 0;
        const message =
          typeof response.data.message === "string"
            ? response.data.message
            : "Preparing your meal plan";

        if (percentage !== lastPercentage || message !== lastMessage) {
          lastPercentage = percentage;
          lastMessage = message;
          lastChangeAt = Date.now();
        }

        setGenerationProgress(percentage);
        setGenerationMessage(message);
        if (response.data.state === "completed") {
          window.localStorage.removeItem(storageKey);
          await update();
          window.setTimeout(() => {
            router.push("/meal-plan");
            router.refresh();
          }, 550);
          return;
        }
        if (
          response.data.state === "failed" ||
          response.data.state === "stalled"
        ) {
          setGenerationMessage(
            typeof response.data.error === "string" && response.data.error
              ? response.data.error
              : "We could not finish preparing your plan. Please try again.",
          );
          setGenerationFailed(true);
          return;
        }
        if (Date.now() - lastChangeAt > generationStallLimitMs) {
          setGenerationMessage(
            "This is taking longer than expected. Please try again.",
          );
          setGenerationFailed(true);
          return;
        }
        window.setTimeout(pollStatus, 700);
      } catch {
        if (!cancelled) {
          setGenerationMessage(
            "We lost contact while preparing your plan. Please try again.",
          );
          setGenerationFailed(true);
        }
      }
    };

    void pollStatus();
    return () => {
      cancelled = true;
    };
  }, [generationFailed, generationJobId, router, update]);

  const isValid =
    step === 0
      ? Boolean(draft.foodPreference)
      : step === 1
        ? draft.cuisines.length > 0
        : step === 3
          ? Boolean(draft.cookingSkill)
          : true;

  const toggleMany = (key: "cuisines" | "exclusions", id: string) => {
    setDraft((current) => ({
      ...current,
      [key]: current[key].includes(id)
        ? current[key].filter((value) => value !== id)
        : [...current[key], id],
    }));
  };

  const submit = useCallback(async () => {
    if (!session?.user) {
      window.localStorage.setItem(pendingGenerationKey, "true");
      router.push("/auth/register?callbackUrl=%2Fmeal-plan%2Fcreate");
      return;
    }
    window.localStorage.removeItem(pendingGenerationKey);
    setGenerationModalOpen(true);
    setGenerationJobId(null);
    setSaving(true);
    setGenerationFailed(false);
    setGenerationProgress(2);
    setGenerationMessage("Saving your preferences");
    try {
      const response = await axios.patch("/api/user/personalization", {
        foodPreferences: draft.foodPreference,
        cuisines: draft.cuisines,
        allergies: draft.exclusions,
        cookingSkill: draft.cookingSkill,
      });
      if (response.status === 200 && response.data.generationJobId) {
        setGenerationJobId(response.data.generationJobId);
        setGenerationProgress(4);
        setGenerationMessage("Starting your personalized meal plan");
      } else {
        throw new Error("Meal plan job was not created.");
      }
    } catch {
      setGenerationMessage(
        "We could not start preparing your plan. Please try again.",
      );
      setGenerationFailed(true);
      toast.error("We could not start your meal plan. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [draft, router, session?.user]);

  useEffect(() => {
    if (!hydrated || !session?.user || resumedGenerationRef.current) return;
    if (window.localStorage.getItem(pendingGenerationKey) !== "true") return;

    resumedGenerationRef.current = true;
    const timer = window.setTimeout(() => {
      void submit();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [hydrated, session?.user, submit]);

  const options =
    step === 0
      ? foodPreferences
      : step === 1
        ? cuisines
        : step === 2
          ? exclusions
          : cookingSkills;
  const selected =
    step === 0
      ? draft.foodPreference
      : step === 1
        ? draft.cuisines
        : step === 2
          ? draft.exclusions
          : draft.cookingSkill;
  const browseStep = step === 1 || step === 2;
  const filteredOptions = browseStep
    ? options.filter((option) =>
        option.title.toLowerCase().includes(searchQuery.trim().toLowerCase()),
      )
    : options;
  const selectedBrowseOptions =
    step === 1
      ? cuisines.filter((option) => draft.cuisines.includes(option.id))
      : step === 2
        ? exclusions.filter((option) => draft.exclusions.includes(option.id))
        : [];
  const foodStyleOption = foodPreferences.find(
    (option) => option.id === draft.foodPreference,
  );
  const cookingSkillOption = cookingSkills.find(
    (option) => option.id === draft.cookingSkill,
  );
  const cuisineOptions = cuisines.filter((option) =>
    draft.cuisines.includes(option.id),
  );
  const exclusionOptions = exclusions.filter((option) =>
    draft.exclusions.includes(option.id),
  );
  const centerChoices = filteredOptions.length <= 7;
  const scrollChoices = (direction: "left" | "right") => {
    choiceRailRef.current?.scrollBy({
      left: direction === "left" ? -460 : 460,
      behavior: "smooth",
    });
  };
  const changeStep = (nextStep: number) => {
    setSearchQuery("");
    setStep(nextStep);
  };

  return (
    <main className="min-h-screen bg-[#fffaf2] py-10 text-[#2c2118] dark:bg-[#091712] dark:text-[#eef2ec] sm:py-14">
      <MealPlanProgressModal
        open={generationModalOpen}
        percentage={generationProgress}
        message={generationMessage}
        failed={generationFailed}
        progressLabel={
          hasPaidAccess
            ? "Preparing your membership plan"
            : "Preparing seven days"
        }
        onRetry={() => {
          setGenerationJobId(null);
          setGenerationFailed(false);
          void submit();
        }}
      />
      <Container>
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <Badge className="mb-4 bg-[#f7e7c5] px-4 py-2 text-[#7d4d1c] hover:bg-[#f7e7c5] dark:bg-[#17362d] dark:text-[#e1b366] dark:hover:bg-[#17362d]">
                <Sparkles className="size-3.5" /> {accessLabel}
              </Badge>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Create your meal plan
              </h1>
              <p className="mt-3 text-sm text-[#695b4e] dark:text-[#aab8b0]">
                Everyday food preferences only. No health or medical profiling.
              </p>
            </div>
            <p className="text-sm font-medium text-[#8b5530] dark:text-[#e0b36c]">
              Step {step + 1} of {stepDetails.length}
            </p>
          </div>

          <div className="mb-8 flex gap-2">
            {stepDetails.map((item, index) => (
              <div key={item.label} className="flex-1">
                <div
                  className={cn(
                    "h-1.5 rounded-full bg-[#eadcc8] dark:bg-white/10",
                    index <= step && "bg-primary dark:bg-primary",
                  )}
                />
                <p className="mt-2 hidden text-xs font-medium text-[#695b4e] dark:text-[#aab8b0] sm:block">
                  {item.label}
                </p>
              </div>
            ))}
          </div>

          <section className="rounded-[2rem] border border-[#eadcc8] bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#10241e] dark:shadow-none sm:p-10">
            <h2 className="text-2xl font-semibold">
              {stepDetails[step].title}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#695b4e] dark:text-[#aab8b0]">
              {stepDetails[step].detail}
            </p>

            {step < 4 ? (
              <div className="mt-7">
                {browseStep && (
                  <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <label className="relative block sm:w-80">
                      <span className="sr-only">
                        {step === 1
                          ? "Search cuisines"
                          : "Search ingredients to leave out"}
                      </span>
                      <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#8b7a69] dark:text-[#91a198]" />
                      <input
                        type="search"
                        aria-label={
                          step === 1
                            ? "Search cuisines"
                            : "Search ingredients to leave out"
                        }
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder={
                          step === 1
                            ? "Search cuisines"
                            : "Search ingredients to leave out"
                        }
                        className="h-12 w-full rounded-full border border-[#eadcc8] bg-[#fffaf2] pl-11 pr-4 text-sm outline-none transition placeholder:text-[#988a7c] focus:border-primary dark:border-white/10 dark:bg-[#142b23] dark:text-[#eef2ec] dark:placeholder:text-[#81938a] dark:focus:border-[#d9a556]"
                      />
                    </label>
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-xs font-medium text-[#8b7a69] dark:text-[#9eaea6]">
                        {filteredOptions.length} of {options.length} choices
                      </p>
                      <div className="hidden gap-2 sm:flex">
                        <button
                          type="button"
                          aria-label="Previous choices"
                          className="flex size-9 cursor-pointer items-center justify-center rounded-full border border-[#eadcc8] text-[#695b4e] transition hover:border-primary hover:bg-[#fff2ec] hover:text-primary dark:border-white/12 dark:text-[#b5c1bb] dark:hover:border-[#d9a556] dark:hover:bg-[#19372d] dark:hover:text-[#e1b366]"
                          onClick={() => scrollChoices("left")}
                        >
                          <ChevronLeft className="size-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="Next choices"
                          className="flex size-9 cursor-pointer items-center justify-center rounded-full border border-[#eadcc8] text-[#695b4e] transition hover:border-primary hover:bg-[#fff2ec] hover:text-primary dark:border-white/12 dark:text-[#b5c1bb] dark:hover:border-[#d9a556] dark:hover:bg-[#19372d] dark:hover:text-[#e1b366]"
                          onClick={() => scrollChoices("right")}
                        >
                          <ChevronRight className="size-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                <div
                  ref={choiceRailRef}
                  className={cn(
                    "flex snap-x gap-5 overflow-x-auto rounded-[1.5rem] bg-[#fffdf9] px-5 py-4 [scrollbar-width:thin] dark:border dark:border-white/[0.05] dark:bg-[#142920]",
                    centerChoices && "sm:justify-center",
                  )}
                >
                  {filteredOptions.map((option) => {
                    const active = Array.isArray(selected)
                      ? selected.includes(option.id)
                      : selected === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        aria-pressed={active}
                        className="group relative flex w-24 shrink-0 snap-start cursor-pointer flex-col items-center text-center focus-visible:outline-none"
                        onClick={() => {
                          if (step === 0) {
                            setDraft((value) => ({
                              ...value,
                              foodPreference: option.id,
                            }));
                          } else if (step === 1) {
                            toggleMany("cuisines", option.id);
                          } else if (step === 2) {
                            toggleMany("exclusions", option.id);
                          } else {
                            setDraft((value) => ({
                              ...value,
                              cookingSkill: option.id,
                            }));
                          }
                        }}
                      >
                        <span
                          className={cn(
                            "relative block size-20 overflow-hidden rounded-full border-2 border-transparent bg-[#f6eadb] shadow-sm transition group-hover:-translate-y-0.5 group-hover:shadow-md dark:bg-[#20382f] dark:shadow-none sm:size-24",
                            active &&
                              "border-primary shadow-[0_0_0_3px_#fff2ec] dark:border-[#d7a45d] dark:shadow-[0_0_0_3px_rgba(218,174,98,0.18)]",
                          )}
                        >
                          <Image
                            src={optionImageSrc(option)}
                            alt=""
                            fill
                            sizes="(max-width: 640px) 80px, 96px"
                            className="object-cover"
                          />
                        </span>
                        <span
                          className={cn(
                            "mt-3 text-sm font-medium text-[#514136] dark:text-[#e6e8e2]",
                            active &&
                              "font-semibold text-primary dark:text-[#e3b56b]",
                          )}
                        >
                          {option.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {filteredOptions.length === 0 && options.length > 0 && (
                  <p className="-mt-[9rem] flex h-[9rem] items-center justify-center text-sm text-[#695b4e] dark:text-[#aab8b0]">
                    No matching choices found. Try another search.
                  </p>
                )}
                {browseStep && selectedBrowseOptions.length > 0 && (
                  <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1">
                    <span className="shrink-0 text-xs font-medium text-[#8b7a69] dark:text-[#9eaea6]">
                      Selected:
                    </span>
                    {selectedBrowseOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-[#fff2ec] px-3 py-2 text-xs font-semibold text-[#73422c] transition hover:bg-[#ffe7de] dark:bg-[#1c382e] dark:text-[#e2b36d] dark:hover:bg-[#24453a]"
                        onClick={() =>
                          toggleMany(
                            step === 1 ? "cuisines" : "exclusions",
                            option.id,
                          )
                        }
                      >
                        {option.title}
                        <X className="size-3.5" />
                      </button>
                    ))}
                  </div>
                )}
                {step === 2 && exclusions.length === 0 && (
                  <p className="text-sm text-[#695b4e] dark:text-[#aab8b0]">
                    No exclusions available. You can continue.
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-7">
                <div className="rounded-[1.35rem] bg-[#2c2118] px-5 py-5 text-white sm:rounded-[1.6rem] sm:px-7 sm:py-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#f7cf8a] sm:text-xs">
                        {hasPaidAccess
                          ? "Your meal palette"
                          : "Your weekly palette"}
                      </p>
                      <h3 className="mt-2 max-w-[19rem] text-[1.45rem] font-semibold leading-[1.18] sm:text-2xl">
                        {hasPaidAccess
                          ? "Planned meals shaped around your table"
                          : "Seven days shaped around your table"}
                      </h3>
                    </div>
                    <span className="w-fit shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-[#f7cf8a] sm:py-2 sm:text-xs">
                      {accessLabel}
                    </span>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    {
                      label: "Food style",
                      items: foodStyleOption ? [foodStyleOption] : [],
                      empty: "Not selected",
                    },
                    {
                      label: "Cuisines",
                      items: cuisineOptions,
                      empty: "Not selected",
                    },
                    {
                      label: "Leave out",
                      items: exclusionOptions,
                      empty: "Nothing selected",
                    },
                    {
                      label: "Cooking",
                      items: cookingSkillOption ? [cookingSkillOption] : [],
                      empty: "Not selected",
                    },
                  ].map((summary) => (
                    <div
                      key={summary.label}
                      className="min-h-32 rounded-2xl border border-[#f0e5d6] bg-[#fffaf2] p-3 dark:border-white/8 dark:bg-[#142b23]"
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9a6b42] dark:text-[#d6aa60]">
                        {summary.label}
                      </p>
                      {summary.items.length > 0 ? (
                        <>
                          <div className="mt-3 flex -space-x-3">
                            {summary.items.slice(0, 3).map((option) => (
                              <span
                                key={option.id}
                                className="relative block size-10 overflow-hidden rounded-full border-2 border-white bg-[#f6eadb] dark:border-[#142b23] dark:bg-[#20382f]"
                              >
                                <Image
                                  src={optionImageSrc(option)}
                                  alt=""
                                  fill
                                  sizes="40px"
                                  className="object-cover"
                                />
                              </span>
                            ))}
                            {summary.items.length > 3 && (
                              <span className="flex size-10 items-center justify-center rounded-full border-2 border-white bg-[#f1dfc7] text-[11px] font-semibold text-[#73422c] dark:border-[#142b23] dark:bg-[#24453a] dark:text-[#e2b36d]">
                                +{summary.items.length - 3}
                              </span>
                            )}
                          </div>
                          <p className="mt-3 line-clamp-2 text-xs font-medium text-[#44372d] dark:text-[#e4eae5]">
                            {summary.items.map((item) => item.title).join(", ")}
                          </p>
                        </>
                      ) : (
                        <p className="mt-7 text-xs text-[#8b7a69] dark:text-[#9eaea6]">
                          {summary.empty}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 border-t border-[#f0e5d6] pt-6 dark:border-white/8">
              {step < 4 ? (
                <div className="flex items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    className={cn(step === 0 && "invisible")}
                    onClick={() => changeStep(step - 1)}
                  >
                    <ArrowLeft className="size-4" /> Back
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    className="rounded-full px-7"
                    disabled={!isValid}
                    onClick={() => changeStep(step + 1)}
                  >
                    Continue <ArrowRight className="size-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-10 w-fit px-2 text-sm"
                    onClick={() => changeStep(step - 1)}
                  >
                    <ArrowLeft className="size-4" /> Back
                  </Button>
                  <div className="flex w-full flex-col items-stretch gap-1.5 sm:w-auto sm:items-end">
                    <Button
                      type="button"
                      size="lg"
                      className="h-11 rounded-full px-5 text-[13px] sm:h-12 sm:px-7 sm:text-sm"
                      disabled={saving}
                      onClick={submit}
                    >
                      {saving && <Loader2 className="size-4 animate-spin" />}
                      {session?.user
                        ? "Generate my meal plan"
                        : "Create account & generate"}
                    </Button>
                    {!session?.user && (
                      <button
                        type="button"
                        onClick={() => {
                          window.localStorage.setItem(
                            pendingGenerationKey,
                            "true",
                          );
                          router.push(
                            "/auth/login?callbackUrl=%2Fmeal-plan%2Fcreate",
                          );
                        }}
                        className="cursor-pointer self-center text-[11px] font-medium leading-5 text-primary underline decoration-primary/30 underline-offset-4 sm:self-end sm:text-xs"
                      >
                        Already have an account? Sign in
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </Container>
    </main>
  );
}
