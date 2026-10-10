export const foodCompareGoals = [
  {
    id: "balanced",
    label: "Overall better",
    shortLabel: "Overall",
    description: "Protein, fiber, calories, fat, and sodium together.",
  },
  {
    id: "protein",
    label: "More protein",
    shortLabel: "Protein",
    description: "When the meal should keep you fuller.",
  },
  {
    id: "lighter",
    label: "Lighter meal",
    shortLabel: "Light",
    description: "Lower calories with decent nutrition.",
  },
  {
    id: "fiber",
    label: "More fiber",
    shortLabel: "Fiber",
    description: "When fullness and roughage matter.",
  },
  {
    id: "quick",
    label: "Quick to cook",
    shortLabel: "Quick",
    description: "When time matters more than macros.",
  },
] as const;

export type FoodCompareGoalId = (typeof foodCompareGoals)[number]["id"];
export type FoodCompareSide = "left" | "right";
export type FoodCompareWinner = FoodCompareSide | "tie";
export type FoodCompareHealthTone = "positive" | "balanced" | "watch" | "occasional";

export type FoodCompareSuggestion = {
  id: string;
  label: string;
  href: string;
  imageUrl: string | null;
  category: string | null;
  cuisine: string | null;
  estimatedCostInr: number | null;
  timeMinutes: number | null;
  calories: number;
  protein: number;
  fiber: number;
};

export type FoodCompareNutrition = {
  calories: number;
  protein: number;
  carbohydrate: number;
  totalFat: number;
  dietaryFiber: number;
  sodium: number;
  potassium: number;
  calcium: number;
  iron: number;
};

export type FoodCompareFood = FoodCompareSuggestion & {
  description: string | null;
  estimatedServings: number;
  cookingMethods: string[];
  health: {
    label: string;
    tone: FoodCompareHealthTone;
    summary: string;
    positives: string[];
    watchouts: string[];
    score: number;
  };
  nutrients: FoodCompareNutrition;
  missingData: string[];
};

export type FoodCompareMetric = {
  key: keyof FoodCompareNutrition | "timeMinutes";
  label: string;
  unit: string;
  leftValue: number;
  rightValue: number;
  winner: FoodCompareWinner;
  lowerIsBetter: boolean;
};

export type FoodComparePoint = {
  side: FoodCompareSide | "both";
  title: string;
  body: string;
};

export type FoodCompareResult = {
  goal: FoodCompareGoalId;
  left: FoodCompareFood;
  right: FoodCompareFood;
  winner: FoodCompareWinner;
  verdictTitle: string;
  verdictBody: string;
  healthInsight: FoodComparePoint;
  keyPoints: FoodComparePoint[];
  cautions: FoodComparePoint[];
  metrics: FoodCompareMetric[];
  generatedAt: string;
};
