import {
  CalendarDays,
  Heart,
  IndianRupee,
  Refrigerator,
  UsersRound,
} from "lucide-react";

import type { RecipePagination, Situation } from "@/components/sections/situation-tools/types";

export const recipePageSize = 6;

export const emptyPagination: RecipePagination = {
  total: 0,
  page: 0,
  pageSize: recipePageSize,
  hasNext: false,
  hasPrevious: false,
};

export const situations: Situation[] = [
  {
    key: "ingredients",
    title: "Smart Recipe Finder",
    shortTitle: "Recipe Finder",
    prompt: "Cook with what you have",
    icon: Refrigerator,
  },
  {
    key: "daily",
    title: "Smart Daily Menu",
    shortTitle: "Daily Menu",
    prompt: "Plan today's meals",
    icon: CalendarDays,
  },
  {
    key: "guests",
    title: "Smart Guest Menu",
    shortTitle: "Guest Menu",
    prompt: "Serve without stress",
    icon: UsersRound,
  },
  {
    key: "budget",
    title: "Smart Budget Meals",
    shortTitle: "Budget Meals",
    prompt: "Simple recipe picks",
    icon: IndianRupee,
  },
  {
    key: "moms",
    title: "Smart Kids Meals",
    shortTitle: "Kids Meals",
    prompt: "Kids-friendly picks",
    icon: Heart,
  },
];

export const mealFocusOptions = [
  { id: "full-day", label: "Any meal" },
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
];

export const guestPlanOptions = [
  { id: "full-meal", label: "Full meal" },
  { id: "snacks", label: "Snacks" },
  { id: "quick", label: "Quick" },
];

export const foodTypeOptions = [
  { id: "veg", label: "Veg" },
  { id: "non-veg", label: "Non veg" },
  { id: "any", label: "Any" },
];

export const budgetPresetOptions = [75, 100, 150, 250, 500];

export const fridgeHeadlines = [
  "What's in your fridge?",
  "What can you cook today?",
];

export const broadCuisineSlugs = new Set([
  "indian",
  "north-indian",
  "south-indian",
  "international",
  "global",
]);
