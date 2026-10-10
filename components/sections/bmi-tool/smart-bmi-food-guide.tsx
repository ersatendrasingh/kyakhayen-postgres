"use client";

import {
  Activity,
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Clipboard,
  LineChart,
  Ruler,
  Scale,
  Share2,
  Utensils,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { shouldServeDirectMediaImage } from "@/lib/direct-media-image";

export type BmiToolRecipe = {
  id: string;
  title: string;
  href: string;
  imageUrl: string;
  category: string | null;
  totalMinutes: number | null;
  ingredients: string[];
  recipeTypes: string[];
  mealTimes: string[];
  dietTypes: string[];
  nutrients: string[];
  views: number;
};

type UnitSystem = "metric" | "imperial";
type BmiMode = "south-asian" | "standard";
type StapleChoice = "roti" | "rice" | "both";
type FoodPreference = "any" | "veg" | "non-veg";
type SexContext = "skip" | "female" | "male";
type AgeContext = "under-20" | "adult" | "older";
type BmiBand = "underweight" | "healthy" | "overweight" | "obese";

type CheckIn = {
  date: string;
  weightKg: number;
  bmi: number;
};

type BmiResult = {
  bmi: number;
  band: BmiBand;
  label: string;
  tone: string;
  healthyMinKg: number;
  healthyMaxKg: number;
  deltaKg: number;
  targetKg: number;
  timeline: string;
  waistRatio: number | null;
  waistLabel: string | null;
};

const modeCopy = {
  "south-asian": {
    title: "Indian / South Asian range",
    body: "Uses lower BMI action points commonly discussed for South Asian adults.",
    healthyMax: 22.9,
  },
  standard: {
    title: "Standard adult range",
    body: "Uses the general adult BMI range used by many public calculators.",
    healthyMax: 24.9,
  },
} satisfies Record<BmiMode, { title: string; body: string; healthyMax: number }>;

const foodPreferences = [
  { value: "any", label: "Any food" },
  { value: "veg", label: "Vegetarian" },
  { value: "non-veg", label: "Non veg ok" },
] satisfies Array<{ value: FoodPreference; label: string }>;

const stapleChoices = [
  { value: "roti", label: "Mostly roti" },
  { value: "rice", label: "Mostly rice" },
  { value: "both", label: "Roti + rice" },
] satisfies Array<{ value: StapleChoice; label: string }>;

const sexChoices = [
  { value: "skip", label: "Skip" },
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
] satisfies Array<{ value: SexContext; label: string }>;

const ageChoices = [
  { value: "under-20", label: "Under 20" },
  { value: "adult", label: "20-59" },
  { value: "older", label: "60+" },
] satisfies Array<{ value: AgeContext; label: string }>;

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function lbToKg(value: number) {
  return value / 2.20462;
}

function inToCm(value: number) {
  return value * 2.54;
}

function totalHeightInches(feet: number, inches: number) {
  return feet * 12 + inches;
}

function categoryForBmi(bmi: number, mode: BmiMode): Pick<BmiResult, "band" | "label" | "tone"> {
  if (bmi < 18.5) {
    return {
      band: "underweight",
      label: "Below the healthy range",
      tone: "from-[#7c5a22] to-[#9a6b23]",
    };
  }

  if (mode === "south-asian") {
    if (bmi <= 22.9) {
      return {
        band: "healthy",
        label: "Within the Indian/South Asian healthy range",
        tone: "from-[#176b4d] to-[#1c7f5c]",
      };
    }
    if (bmi < 27.5) {
      return {
        band: "overweight",
        label: "Above the healthy range",
        tone: "from-[#a05a20] to-[#b56b24]",
      };
    }
    return {
      band: "obese",
      label: "Well above the healthy range",
      tone: "from-[#9b312b] to-[#b63b32]",
    };
  }

  if (bmi < 25) {
    return {
      band: "healthy",
      label: "Within the standard healthy range",
      tone: "from-[#176b4d] to-[#1c7f5c]",
    };
  }
  if (bmi < 30) {
    return {
      band: "overweight",
      label: "Above the standard healthy range",
      tone: "from-[#a05a20] to-[#b56b24]",
    };
  }

  return {
    band: "obese",
    label: "Well above the standard healthy range",
    tone: "from-[#9b312b] to-[#b63b32]",
  };
}

function resultFor({
  heightCm,
  weightKg,
  waistCm,
  mode,
}: {
  heightCm: number;
  weightKg: number;
  waistCm: number | null;
  mode: BmiMode;
}): BmiResult | null {
  if (!heightCm || !weightKg || heightCm < 90 || weightKg < 20) return null;

  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  const category = categoryForBmi(bmi, mode);
  const healthyMinKg = 18.5 * heightM * heightM;
  const healthyMaxKg = modeCopy[mode].healthyMax * heightM * heightM;
  const deltaKg =
    weightKg < healthyMinKg ? weightKg - healthyMinKg : weightKg > healthyMaxKg ? weightKg - healthyMaxKg : 0;
  const targetKg =
    deltaKg < 0 ? healthyMinKg : deltaKg > 0 ? healthyMaxKg : Math.min(Math.max(weightKg, healthyMinKg), healthyMaxKg);
  const absDelta = Math.abs(deltaKg);
  const timeline =
    absDelta < 0.4
      ? "You are already inside the selected healthy range."
      : `${Math.max(1, Math.ceil(absDelta / 0.5))}-${Math.max(2, Math.ceil(absDelta / 0.25))} weeks at a steady pace.`;
  const waistRatio = waistCm && waistCm > 20 ? waistCm / heightCm : null;
  const waistLabel = waistRatio
    ? waistRatio < 0.5
      ? "Waist-to-height looks in a balanced zone."
      : waistRatio < 0.6
        ? "Waist-to-height is worth watching with food and activity habits."
        : "Waist-to-height is high, so use the result as a reason to review habits with a qualified professional."
    : null;

  return {
    bmi,
    ...category,
    healthyMinKg,
    healthyMaxKg,
    deltaKg,
    targetKg,
    timeline,
    waistRatio,
    waistLabel,
  };
}

function foodMoves(result: BmiResult, staple: StapleChoice, preference: FoodPreference) {
  const protein = preference === "non-veg" ? "protein like dal, paneer, curd, eggs, fish or chicken" : "protein like dal, paneer, chana, sprouts or curd";

  if (result.band === "underweight") {
    return [
      `Add one steady energy support to meals: ${protein}, plus a little ghee, nuts, curd or milk when it suits you.`,
      staple === "rice"
        ? "Keep rice, but make it a complete plate with dal or rajma, vegetables and curd instead of plain rice alone."
        : "With roti, add a richer side like paneer, dal, chana, curd or a peanut-based chutney.",
      "Use breakfast as a real meal: poha with peanuts, paneer paratha, besan chilla with curd, smoothie or milk-based options.",
    ];
  }

  if (result.band === "healthy") {
    return [
      `Keep every main meal anchored around ${protein}, vegetables and a familiar carb instead of changing everything at once.`,
      staple === "roti"
        ? "A practical plate can be 2 roti, dal or paneer, sabzi and salad."
        : staple === "rice"
          ? "A practical plate can be 1 cup rice, dal or curry, sabzi and curd."
          : "When taking both roti and rice, keep both smaller and let dal, sabzi and salad fill the plate.",
      "Use snacks intentionally: fruit, chaas, sprouts, roasted chana, dhokla or a small homemade snack works better than random fried bites.",
    ];
  }

  return [
    staple === "roti"
      ? "For dinner, start with 2 roti, dal or paneer, sabzi and salad. Add more only if still hungry after 10 minutes."
      : staple === "rice"
        ? "For rice meals, keep rice measured and add dal, curd, vegetables or protein so the plate is not mostly rice."
        : "If eating roti and rice together, reduce both portions and keep protein plus vegetables as the main part of the plate.",
    "Keep creamy, fried or very buttery dishes for planned meals, not daily defaults. Pair richer curries with salad and controlled roti or rice.",
    `Choose higher-satiety meals more often: ${protein}, lentils, vegetables, soups, khichdi, grilled or roasted options.`,
  ];
}

function portionGuide(result: BmiResult, staple: StapleChoice) {
  if (result.band === "underweight") {
    if (staple === "rice") {
      return {
        breakfast: "Poha or upma with peanuts + curd, milk or a banana",
        lunch: "1.25 cups rice + dal or rajma + sabzi + curd",
        dinner: "Rice or khichdi + paneer/curd support + vegetables",
      };
    }
    return {
      breakfast: "Paneer paratha, besan chilla with curd, or smoothie + nuts",
      lunch: "2-3 roti + dal/paneer/chana + sabzi + curd",
      dinner: "2 roti + protein-rich curry + salad + small ghee finish",
    };
  }

  if (result.band === "healthy") {
    if (staple === "rice") {
      return {
        breakfast: "Idli, poha or upma + curd, fruit or sprouts",
        lunch: "1 cup rice + dal + sabzi + curd",
        dinner: "3/4-1 cup rice + curry + salad",
      };
    }
    if (staple === "both") {
      return {
        breakfast: "Besan chilla, oats, poha or 1 stuffed roti + curd",
        lunch: "1 roti + 1/2 cup rice + dal + sabzi",
        dinner: "Choose either 2 roti or 1 cup rice with protein and salad",
      };
    }
    return {
      breakfast: "Besan chilla, stuffed roti, oats or sprouts + curd",
      lunch: "2 roti + dal + sabzi + curd",
      dinner: "2 roti + lighter curry + salad",
    };
  }

  if (staple === "rice") {
    return {
      breakfast: "Besan chilla, sprouts, curd bowl or lighter poha with peanuts",
      lunch: "3/4-1 cup rice + dal/protein + double vegetables",
      dinner: "1/2-3/4 cup rice or khichdi + salad + curd",
    };
  }
  if (staple === "both") {
    return {
      breakfast: "Besan chilla, sprouts, curd or oats before roti/rice-heavy meals",
      lunch: "1 roti + 1/3-1/2 cup rice + dal + sabzi",
      dinner: "Pick roti or rice, not both, and add salad first",
    };
  }
  return {
    breakfast: "Besan chilla, sprouts, curd or stuffed roti with less oil",
    lunch: "2 roti + dal/protein + sabzi + salad",
    dinner: "1-2 roti + lighter sabzi/curry + salad",
  };
}

function recipeText(recipe: BmiToolRecipe) {
  return [
    recipe.title,
    recipe.category,
    ...recipe.ingredients,
    ...recipe.recipeTypes,
    ...recipe.mealTimes,
    ...recipe.dietTypes,
    ...recipe.nutrients,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function scoreRecipe(recipe: BmiToolRecipe, result: BmiResult, preference: FoodPreference) {
  const text = recipeText(recipe);
  let score = recipe.views / 250;

  if (preference === "veg" && /\b(chicken|mutton|fish|egg|prawn|meat)\b/.test(text)) score -= 80;
  if (preference === "non-veg" && /\b(chicken|fish|egg|mutton|prawn)\b/.test(text)) score += 8;

  if (result.band === "underweight") {
    ["paneer", "dal", "chana", "rajma", "khichdi", "milk", "smoothie", "lassi", "peanut", "nuts", "paratha", "curd"].forEach((term) => {
      if (text.includes(term)) score += 8;
    });
  } else if (result.band === "healthy") {
    ["dal", "sabzi", "paneer", "curd", "poha", "idli", "khichdi", "veg", "rice", "roti", "breakfast", "lunch"].forEach((term) => {
      if (text.includes(term)) score += 6;
    });
  } else {
    ["salad", "soup", "dal", "sprouts", "roasted", "grilled", "oats", "lauki", "bottle gourd", "khichdi", "chilla", "protein", "fiber"].forEach((term) => {
      if (text.includes(term)) score += 9;
    });
    ["fried", "poori", "butter", "cream", "paratha", "dessert", "halwa", "pakora"].forEach((term) => {
      if (text.includes(term)) score -= 5;
    });
  }

  if (recipe.totalMinutes && recipe.totalMinutes <= 35) score += 3;
  if (recipe.imageUrl) score += 2;

  return score;
}

function recipeReason(result: BmiResult) {
  if (result.band === "underweight") return "Useful when you want meals with more steady energy and protein support.";
  if (result.band === "healthy") return "Fits a balanced everyday plate without making the meal feel like a diet.";
  return "A better fit for lighter, higher-satiety meals and portion-controlled plates.";
}

function contextNotes(ageContext: AgeContext, sexContext: SexContext) {
  const notes = [
    "For adults, BMI uses the same height and weight formula for male and female users. Sex context helps explain the result; it does not change the BMI number.",
  ];

  if (ageContext === "under-20") {
    notes.push(
      "Under 20: use this only as a rough screen. Children and teens need BMI-for-age percentile charts that include age and sex.",
    );
  } else if (ageContext === "older") {
    notes.push(
      "Age 60+: BMI can still be a screen, but weight goals should be gentler and checked with strength, appetite, health conditions and a qualified professional.",
    );
  } else {
    notes.push("Age 20-59: adult BMI categories can be used as a screening range along with waist, food habits and health context.");
  }

  if (sexContext === "female") {
    notes.push("Female context: pregnancy, postpartum phase, PCOS, menopause and iron needs can change the right food plan even when BMI is the same.");
  } else if (sexContext === "male") {
    notes.push("Male context: BMI is the same formula, but waist size, muscle mass and activity level can change how the result should be interpreted.");
  }

  return notes;
}

export default function SmartBmiFoodGuide({ recipes }: { recipes: BmiToolRecipe[] }) {
  const [unit, setUnit] = useState<UnitSystem>("metric");
  const [mode, setMode] = useState<BmiMode>("south-asian");
  const [foodPreference, setFoodPreference] = useState<FoodPreference>("veg");
  const [staple, setStaple] = useState<StapleChoice>("both");
  const [sexContext, setSexContext] = useState<SexContext>("skip");
  const [ageContext, setAgeContext] = useState<AgeContext>("adult");
  const [heightCm, setHeightCm] = useState(170);
  const [weightKg, setWeightKg] = useState(72);
  const [waistCm, setWaistCm] = useState(86);
  const [heightFt, setHeightFt] = useState(5);
  const [heightIn, setHeightIn] = useState(7);
  const [weightLb, setWeightLb] = useState(159);
  const [waistIn, setWaistIn] = useState(34);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [shareState, setShareState] = useState("");

  const computedHeightCm = unit === "metric" ? heightCm : inToCm(totalHeightInches(heightFt, heightIn));
  const computedWeightKg = unit === "metric" ? weightKg : lbToKg(weightLb);
  const computedWaistCm = unit === "metric" ? waistCm : inToCm(waistIn);
  const result = useMemo(
    () =>
      resultFor({
        heightCm: computedHeightCm,
        weightKg: computedWeightKg,
        waistCm: computedWaistCm,
        mode,
      }),
    [computedHeightCm, computedWeightKg, computedWaistCm, mode],
  );
  const moves = result ? foodMoves(result, staple, foodPreference) : [];
  const portions = result ? portionGuide(result, staple) : null;
  const notes = contextNotes(ageContext, sexContext);
  const recommendedRecipes = useMemo(() => {
    if (!result) return [];
    return recipes
      .map((recipe) => ({
        recipe,
        score: scoreRecipe(recipe, result, foodPreference),
      }))
      .filter((item) => item.score > -30)
      .sort((left, right) => right.score - left.score)
      .slice(0, 6)
      .map((item) => item.recipe);
  }, [foodPreference, recipes, result]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem("kya-khayen-bmi-checkins");
        if (stored) setCheckIns(JSON.parse(stored) as CheckIn[]);
      } catch {
        setCheckIns([]);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const previousCheckIn = checkIns.find((item) => item.date !== new Date().toISOString().slice(0, 10));
  const changeKg = previousCheckIn ? round1(computedWeightKg - previousCheckIn.weightKg) : null;
  const changeBmi = previousCheckIn && result ? round1(result.bmi - previousCheckIn.bmi) : null;

  const saveCheckIn = () => {
    if (!result) return;
    const today = new Date().toISOString().slice(0, 10);
    const next = [
      { date: today, weightKg: round1(computedWeightKg), bmi: round1(result.bmi) },
      ...checkIns.filter((item) => item.date !== today),
    ].slice(0, 8);
    setCheckIns(next);
    window.localStorage.setItem("kya-khayen-bmi-checkins", JSON.stringify(next));
  };

  const reportText = result
    ? [
        "Smart BMI & Food Guide - Kya Khayen",
        `BMI: ${round1(result.bmi)} (${result.label})`,
        `Healthy weight range: ${round1(result.healthyMinKg)}-${round1(result.healthyMaxKg)} kg`,
        `Target guide: ${round1(result.targetKg)} kg`,
        `Age and sex context: ${ageChoices.find((item) => item.value === ageContext)?.label ?? "20-59"}, ${sexChoices.find((item) => item.value === sexContext)?.label ?? "Skip"}`,
        `Food focus: ${moves[0]}`,
        `Recipes: ${recommendedRecipes.slice(0, 3).map((recipe) => recipe.title).join(", ")}`,
      ].join("\n")
    : "";

  const shareReport = async () => {
    if (!reportText) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Smart BMI & Food Guide",
          text: reportText,
          url: window.location.href,
        });
        setShareState("Report shared.");
      } else {
        await navigator.clipboard.writeText(`${reportText}\n${window.location.href}`);
        setShareState("Report copied.");
      }
    } catch {
      setShareState("Could not share right now.");
    }
  };

  return (
    <div id="tool" className="space-y-8">
      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[1.5rem] border border-[#e4d3be] bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.05] sm:p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a36d2e] dark:text-[#f3ca7a]">
                Your inputs
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-[#2e241c] dark:text-white">
                Calculate once, then plan the plate.
              </h2>
            </div>
            <Scale className="size-6 text-[#a36d2e] dark:text-[#f3ca7a]" />
          </div>

          <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-[#f8efe2] p-1 dark:bg-white/[0.06]">
            {(["metric", "imperial"] as UnitSystem[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setUnit(item)}
                className={`min-h-11 rounded-lg px-3 text-sm font-semibold transition ${
                  unit === item
                    ? "bg-white text-[#9d3429] shadow-sm dark:bg-[#19372d] dark:text-[#f3ca7a]"
                    : "text-[#6f5d4c] dark:text-white/62"
                }`}
              >
                {item === "metric" ? "cm / kg" : "ft / lb"}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {unit === "metric" ? (
              <>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#806b58] dark:text-white/58">
                    Height
                  </span>
                  <input
                    type="number"
                    min={90}
                    max={230}
                    value={heightCm}
                    onChange={(event) => setHeightCm(Number(event.target.value))}
                    className="h-12 w-full rounded-xl border border-[#e6d3bd] bg-white px-4 text-sm font-semibold text-[#2e241c] outline-none focus:border-[#c84737] dark:border-white/10 dark:bg-[#10241e] dark:text-white"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#806b58] dark:text-white/58">
                    Weight
                  </span>
                  <input
                    type="number"
                    min={20}
                    max={250}
                    value={weightKg}
                    onChange={(event) => setWeightKg(Number(event.target.value))}
                    className="h-12 w-full rounded-xl border border-[#e6d3bd] bg-white px-4 text-sm font-semibold text-[#2e241c] outline-none focus:border-[#c84737] dark:border-white/10 dark:bg-[#10241e] dark:text-white"
                  />
                </label>
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#806b58] dark:text-white/58">
                    Waist optional
                  </span>
                  <input
                    type="number"
                    min={30}
                    max={180}
                    value={waistCm}
                    onChange={(event) => setWaistCm(Number(event.target.value))}
                    className="h-12 w-full rounded-xl border border-[#e6d3bd] bg-white px-4 text-sm font-semibold text-[#2e241c] outline-none focus:border-[#c84737] dark:border-white/10 dark:bg-[#10241e] dark:text-white"
                  />
                </label>
              </>
            ) : (
              <>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#806b58] dark:text-white/58">
                    Height feet
                  </span>
                  <input
                    type="number"
                    min={3}
                    max={8}
                    value={heightFt}
                    onChange={(event) => setHeightFt(Number(event.target.value))}
                    className="h-12 w-full rounded-xl border border-[#e6d3bd] bg-white px-4 text-sm font-semibold text-[#2e241c] outline-none focus:border-[#c84737] dark:border-white/10 dark:bg-[#10241e] dark:text-white"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#806b58] dark:text-white/58">
                    Inches
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={11}
                    value={heightIn}
                    onChange={(event) => setHeightIn(Number(event.target.value))}
                    className="h-12 w-full rounded-xl border border-[#e6d3bd] bg-white px-4 text-sm font-semibold text-[#2e241c] outline-none focus:border-[#c84737] dark:border-white/10 dark:bg-[#10241e] dark:text-white"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#806b58] dark:text-white/58">
                    Weight lb
                  </span>
                  <input
                    type="number"
                    min={45}
                    max={550}
                    value={weightLb}
                    onChange={(event) => setWeightLb(Number(event.target.value))}
                    className="h-12 w-full rounded-xl border border-[#e6d3bd] bg-white px-4 text-sm font-semibold text-[#2e241c] outline-none focus:border-[#c84737] dark:border-white/10 dark:bg-[#10241e] dark:text-white"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#806b58] dark:text-white/58">
                    Waist in
                  </span>
                  <input
                    type="number"
                    min={12}
                    max={72}
                    value={waistIn}
                    onChange={(event) => setWaistIn(Number(event.target.value))}
                    className="h-12 w-full rounded-xl border border-[#e6d3bd] bg-white px-4 text-sm font-semibold text-[#2e241c] outline-none focus:border-[#c84737] dark:border-white/10 dark:bg-[#10241e] dark:text-white"
                  />
                </label>
              </>
            )}
          </div>

          <div className="mt-5 grid gap-3">
            <div className="grid gap-2 sm:grid-cols-2">
              {(["south-asian", "standard"] as BmiMode[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMode(item)}
                  className={`rounded-xl border p-4 text-left transition ${
                    mode === item
                      ? "border-[#c84737] bg-[#fff3e7] text-[#2e241c] dark:border-[#f3ca7a] dark:bg-[#1a342b] dark:text-white"
                      : "border-[#ead9c3] bg-white text-[#6f5d4c] dark:border-white/10 dark:bg-white/[0.03] dark:text-white/62"
                  }`}
                >
                  <span className="block text-sm font-semibold">{modeCopy[item].title}</span>
                  <span className="mt-1 block text-xs leading-5 opacity-75">{modeCopy[item].body}</span>
                </button>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <fieldset className="rounded-xl border border-[#ead9c3] p-3 dark:border-white/10">
                <legend className="px-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#806b58] dark:text-white/58">
                  Age
                </legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {ageChoices.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setAgeContext(item.value)}
                      className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                        ageContext === item.value
                          ? "bg-[#17372b] text-white dark:bg-[#f3ca7a] dark:text-[#20150c]"
                          : "bg-[#f5ead8] text-[#6f5d4c] dark:bg-white/10 dark:text-white/68"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="rounded-xl border border-[#ead9c3] p-3 dark:border-white/10">
                <legend className="px-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#806b58] dark:text-white/58">
                  Sex context
                </legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {sexChoices.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setSexContext(item.value)}
                      className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                        sexContext === item.value
                          ? "bg-[#17372b] text-white dark:bg-[#f3ca7a] dark:text-[#20150c]"
                          : "bg-[#f5ead8] text-[#6f5d4c] dark:bg-white/10 dark:text-white/68"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="rounded-xl border border-[#ead9c3] p-3 dark:border-white/10">
                <legend className="px-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#806b58] dark:text-white/58">
                  Food style
                </legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {foodPreferences.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setFoodPreference(item.value)}
                      className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                        foodPreference === item.value
                          ? "bg-[#17372b] text-white dark:bg-[#f3ca7a] dark:text-[#20150c]"
                          : "bg-[#f5ead8] text-[#6f5d4c] dark:bg-white/10 dark:text-white/68"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="rounded-xl border border-[#ead9c3] p-3 dark:border-white/10">
                <legend className="px-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#806b58] dark:text-white/58">
                  Plate habit
                </legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {stapleChoices.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setStaple(item.value)}
                      className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                        staple === item.value
                          ? "bg-[#17372b] text-white dark:bg-[#f3ca7a] dark:text-[#20150c]"
                          : "bg-[#f5ead8] text-[#6f5d4c] dark:bg-white/10 dark:text-white/68"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>
          </div>
        </div>

        {result && (
          <div className={`overflow-hidden rounded-[1.5rem] bg-gradient-to-br ${result.tone} p-5 text-white shadow-[0_30px_80px_-48px_rgba(29,19,11,0.65)] sm:p-6`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
                  Your result
                </p>
                <div className="mt-4 flex items-end gap-3">
                  <span className="text-7xl font-semibold leading-none">{round1(result.bmi)}</span>
                  <span className="pb-2 text-lg font-semibold text-white/78">BMI</span>
                </div>
                <p className="mt-4 max-w-xl text-2xl font-semibold leading-tight">{result.label}</p>
              </div>
              <button
                type="button"
                onClick={shareReport}
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#2d241c] transition hover:bg-[#fff8e9]"
              >
                <Share2 className="size-4" />
                Share report
              </button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/13 p-4 backdrop-blur">
                <Ruler className="mb-3 size-5 text-white/80" />
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/62">
                  Healthy range
                </p>
                <p className="mt-2 text-lg font-semibold">
                  {round1(result.healthyMinKg)}-{round1(result.healthyMaxKg)} kg
                </p>
              </div>
              <div className="rounded-2xl bg-white/13 p-4 backdrop-blur">
                <Activity className="mb-3 size-5 text-white/80" />
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/62">
                  Target guide
                </p>
                <p className="mt-2 text-lg font-semibold">{round1(result.targetKg)} kg</p>
              </div>
              <div className="rounded-2xl bg-white/13 p-4 backdrop-blur">
                <LineChart className="mb-3 size-5 text-white/80" />
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/62">
                  Timeline
                </p>
                <p className="mt-2 text-lg font-semibold">{result.timeline}</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-[#1b1712]/22 p-4 text-sm leading-7 text-white/78">
              {Math.abs(result.deltaKg) < 0.4
                ? "You are within the selected healthy range. Use the food guide for maintenance and better meal balance."
                : result.deltaKg > 0
                  ? `You are about ${round1(result.deltaKg)} kg above this selected range. Use this as a food-planning signal, not a diagnosis.`
                  : `You are about ${round1(Math.abs(result.deltaKg))} kg below this selected range. Focus on steady meals, protein and enough energy.`}
              {result.waistRatio ? (
                <span className="mt-2 block">
                  Waist-to-height ratio: {round1(result.waistRatio)}. {result.waistLabel}
                </span>
              ) : null}
              <span className="mt-2 block">{notes[0]}</span>
              <span className="mt-2 block">{notes[1]}</span>
              {notes[2] ? <span className="mt-2 block">{notes[2]}</span> : null}
            </div>
            {shareState && <p className="mt-3 text-sm font-semibold text-white/78">{shareState}</p>}
          </div>
        )}
      </section>

      {result && portions && (
        <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[1.5rem] border border-[#ead9c3] bg-white p-5 dark:border-white/10 dark:bg-white/[0.05] sm:p-6">
            <p className="inline-flex items-center gap-2 rounded-full bg-[#f5ead8] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#9d6a2b] dark:bg-[#f3ca7a]/12 dark:text-[#f3ca7a]">
              <Utensils className="size-3.5" />
              Next 3 food moves
            </p>
            <div className="mt-5 grid gap-3">
              {moves.map((move, index) => (
                <div
                  key={move}
                  className="grid gap-3 rounded-2xl border border-[#ead9c3] bg-[#fffaf2] p-4 dark:border-white/10 dark:bg-white/[0.04] sm:grid-cols-[auto_1fr]"
                >
                  <span className="flex size-9 items-center justify-center rounded-full bg-[#17372b] text-sm font-semibold text-white dark:bg-[#f3ca7a] dark:text-[#20150c]">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-7 text-[#5f5145] dark:text-white/68">{move}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#ead9c3] bg-[#fffaf2] p-5 dark:border-white/10 dark:bg-white/[0.04] sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a36d2e] dark:text-[#f3ca7a]">
              Roti / rice helper
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[#2e241c] dark:text-white">
              Keep the plate practical.
            </h2>
            <div className="mt-5 grid gap-3">
              {[
                { label: "Breakfast", value: portions.breakfast },
                { label: "Lunch", value: portions.lunch },
                { label: "Dinner", value: portions.dinner },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-white p-4 dark:bg-white/[0.05]">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8b735f] dark:text-white/50">
                    {item.label}
                  </p>
                  <p className="mt-2 text-base font-semibold leading-7 text-[#2e241c] dark:text-white">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {result && (
        <section className="rounded-[1.5rem] border border-[#d9e4d9] bg-white p-5 dark:border-white/10 dark:bg-white/[0.05] sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0f766e] dark:text-[#5eead4]">
                Recipes from Kya Khayen
              </p>
              <h2 className="mt-2 text-3xl font-semibold leading-tight text-[#2e241c] dark:text-white">
                Recipe ideas matched to this result.
              </h2>
            </div>
            <Link
              href="/meal-plan/create"
              className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-[#17372b] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#214f3e] dark:bg-[#f3ca7a] dark:text-[#20150c]"
            >
              Create 7-day meal plan <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {recommendedRecipes.map((recipe) => (
              <Link
                key={recipe.id}
                href={recipe.href}
                className="group overflow-hidden rounded-[1.15rem] border border-[#d9e4d9] bg-[#fffdf8] transition hover:-translate-y-0.5 hover:border-[#0f766e]/50 hover:shadow-xl hover:shadow-[#17372b]/10 dark:border-white/10 dark:bg-white/[0.04]"
              >
                <span className="relative block aspect-[1.45] overflow-hidden bg-[#f1e4cf]">
                  <Image
                    src={recipe.imageUrl}
                    alt={recipe.title}
                    fill
                    unoptimized={shouldServeDirectMediaImage(recipe.imageUrl)}
                    sizes="(min-width: 1280px) 28vw, (min-width: 768px) 45vw, 100vw"
                    className="object-cover transition duration-700 group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-white/94 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0f766e]">
                    {recipe.totalMinutes ? `${recipe.totalMinutes} min` : recipe.category || "Recipe"}
                  </span>
                </span>
                <span className="block p-4">
                  <span className="line-clamp-2 text-lg font-semibold leading-tight text-[#2e241c] transition group-hover:text-[#0f766e] dark:text-white">
                    {recipe.title}
                  </span>
                  <span className="mt-2 block text-sm leading-6 text-[#756354] dark:text-white/62">
                    {recipeReason(result)}
                  </span>
                  <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#0f766e] dark:text-[#5eead4]">
                    Open recipe <ArrowRight className="size-4" />
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {result && (
        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[1.5rem] border border-[#ead9c3] bg-white p-5 dark:border-white/10 dark:bg-white/[0.05] sm:p-6">
            <p className="inline-flex items-center gap-2 rounded-full bg-[#f5ead8] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#9d6a2b] dark:bg-[#f3ca7a]/12 dark:text-[#f3ca7a]">
              <CalendarCheck className="size-3.5" />
              Weekly check-in
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-[#2e241c] dark:text-white">
              Come back once a week.
            </h2>
            <p className="mt-2 text-sm leading-7 text-[#756354] dark:text-white/62">
              Save your current weight on this device and compare next week. This is a habit tracker, not a medical record.
            </p>
            <button
              type="button"
              onClick={saveCheckIn}
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#c84737] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#a9342a]"
            >
              <CheckCircle2 className="size-4" />
              Save today&apos;s check-in
            </button>
            {previousCheckIn && changeKg !== null && changeBmi !== null ? (
              <p className="mt-4 rounded-2xl bg-[#fff7e8] p-4 text-sm leading-7 text-[#5f5145] dark:bg-white/[0.05] dark:text-white/68">
                Since {previousCheckIn.date}: weight {changeKg === 0 ? "is unchanged" : `${Math.abs(changeKg)} kg ${changeKg > 0 ? "up" : "down"}`}, BMI {changeBmi === 0 ? "unchanged" : `${Math.abs(changeBmi)} ${changeBmi > 0 ? "up" : "down"}`}.
              </p>
            ) : null}
          </div>

          <div className="rounded-[1.5rem] border border-[#ead9c3] bg-[#fffaf2] p-5 dark:border-white/10 dark:bg-white/[0.04] sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a36d2e] dark:text-[#f3ca7a]">
              Shareable report card
            </p>
            <div className="mt-4 rounded-[1.15rem] bg-white p-4 dark:bg-[#10241e]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[#8b735f] dark:text-white/54">
                    Smart BMI & Food Guide
                  </p>
                  <p className="mt-2 text-4xl font-semibold text-[#2e241c] dark:text-white">
                    {round1(result.bmi)}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#0f766e] dark:text-[#5eead4]">
                    {result.label}
                  </p>
                </div>
                <Clipboard className="size-5 text-[#a36d2e] dark:text-[#f3ca7a]" />
              </div>
              <div className="mt-4 grid gap-2 text-sm text-[#5f5145] dark:text-white/68">
                <p>Healthy range: {round1(result.healthyMinKg)}-{round1(result.healthyMaxKg)} kg</p>
                <p>Target guide: {round1(result.targetKg)} kg</p>
                <p>Food focus: {moves[0]}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={shareReport}
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-[#d9c2a5] bg-white px-4 py-2 text-sm font-semibold text-[#2e241c] transition hover:border-[#c84737] hover:text-[#c84737] dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
            >
              <Share2 className="size-4" />
              Share or copy report
            </button>
          </div>
        </section>
      )}

      <section className="rounded-[1.5rem] border border-[#ead9c3] bg-[#fffaf2] p-5 dark:border-white/10 dark:bg-white/[0.04] sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a36d2e] dark:text-[#f3ca7a]">
          Important note
        </p>
        <p className="mt-3 text-sm leading-7 text-[#67584b] dark:text-white/64">
          This BMI calculator is for general wellness and educational use only. It is not a medical diagnosis, treatment plan or guarantee. BMI does not directly measure body fat or overall health. Please consult a qualified doctor or dietitian before making major diet, exercise or weight-loss decisions, especially if you are pregnant, under 18, elderly or have any medical condition.
        </p>
      </section>
    </div>
  );
}
