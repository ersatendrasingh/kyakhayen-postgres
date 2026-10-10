import { readFile } from "node:fs/promises";
import path from "node:path";

import { format } from "date-fns";
import { jsPDF } from "jspdf";

import type { RecipeWithCategory } from "@/types/recipe";
import { pdfColours, pdfToAttachment } from "@/lib/pdf-brand";
import {
  sortRoutineSlots,
  type MealPlanRoutineSlot,
} from "@/lib/meal-plan-routine";
import { absoluteUrl, recipeHref as publicRecipeHref } from "@/lib/seo";

export type PdfMealPlanDay = {
  date: Date;
  mealsByTime: Record<string, RecipeWithCategory[]>;
  routineSlots?: MealPlanRoutineSlot[];
};

export type PdfMealPlanProfile = {
  name: string;
  email?: string | null;
  accessLabel?: string;
  foodStyle?: string | null;
  cuisines?: string[];
  exclusions?: string[];
  cookingComfort?: string | null;
};

const pageWidth = 210;
const pageHeight = 297;
const margin = 16;
const contentWidth = pageWidth - margin * 2;
const mealTimeOrder = [
  "early-morning",
  "breakfast",
  "mid-morning",
  "lunch",
  "evening",
  "dinner",
];

function plainText(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function recipeHref(recipe: RecipeWithCategory) {
  return absoluteUrl(publicRecipeHref(recipe));
}

function totalMinutes(recipe: RecipeWithCategory) {
  if (!recipe.recipeCookingTime) return null;
  const { prepTime, cookTime, restTime } = recipe.recipeCookingTime;
  return prepTime + cookTime + restTime;
}

function nutrientLabel(recipe: RecipeWithCategory) {
  return recipe.recipeNutrient?.[0]?.nutrient.title || "";
}

function displayMealTime(slug: string) {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

async function imageDataUrl(source: string | null | undefined) {
  if (!source) return null;
  if (source.startsWith("data:image/")) return source;

  try {
    const response = await fetch(source);
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/")) return null;
    const bytes = Buffer.from(await response.arrayBuffer()).toString("base64");
    return `data:${contentType};base64,${bytes}`;
  } catch {
    return null;
  }
}

async function logoDataUrl() {
  try {
    const bytes = await readFile(
      path.join(process.cwd(), "public/assets/images/kyakhayen-logo.png"),
    );
    return `data:image/png;base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

function addSafeImage(
  document: jsPDF,
  image: string | null | undefined,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  if (!image) return false;

  try {
    const imageFormat = image.startsWith("data:image/png")
      ? "PNG"
      : image.startsWith("data:image/webp")
        ? "WEBP"
        : "JPEG";
    document.addImage(image, imageFormat, x, y, width, height, undefined, "FAST");
    return true;
  } catch {
    return false;
  }
}

function fillPage(document: jsPDF, colour: [number, number, number] = pdfColours.cream) {
  document.setFillColor(...colour);
  document.rect(0, 0, pageWidth, pageHeight, "F");
}

function blendColour(
  start: [number, number, number],
  end: [number, number, number],
  ratio: number,
): [number, number, number] {
  return start.map((channel, index) =>
    Math.round(channel + (end[index] - channel) * ratio),
  ) as [number, number, number];
}

function fillGradient(
  document: jsPDF,
  y: number,
  height: number,
  start: [number, number, number],
  end: [number, number, number],
) {
  const bands = 48;
  for (let index = 0; index < bands; index += 1) {
    const colour = blendColour(start, end, index / (bands - 1));
    document.setFillColor(...colour);
    document.rect(0, y + (height / bands) * index, pageWidth, height / bands + 0.3, "F");
  }
}

function addFooter(document: jsPDF, pageNumber: number) {
  document.setDrawColor(...pdfColours.line);
  document.setLineWidth(0.25);
  document.line(margin, 279, pageWidth - margin, 279);
  document.setFont("helvetica", "normal");
  document.setFontSize(7.4);
  document.setTextColor(...pdfColours.copy);
  document.text(
    "Kya Khayen is a KASA product | Everyday meal inspiration only, not medical or allergy advice.",
    margin,
    286,
  );
  document.text(`${pageNumber}`, pageWidth - margin, 286, { align: "right" });
}

function addLogoOrWordmark(document: jsPDF, logo: string | null, x: number, y: number) {
  if (!addSafeImage(document, logo, x, y, 43, 13)) {
    document.setFont("helvetica", "bold");
    document.setFontSize(15);
    document.setTextColor(...pdfColours.accent);
    document.text("Kya Khayen?", x, y + 9);
  }
}

function addPageHeader(document: jsPDF, logo: string | null, label: string) {
  fillPage(document);
  addLogoOrWordmark(document, logo, margin, 13);
  document.setFont("helvetica", "bold");
  document.setFontSize(7.5);
  document.setCharSpace(0.8);
  document.setTextColor(...pdfColours.gold);
  document.text(label.toUpperCase(), pageWidth - margin - 4, 21, { align: "right" });
  document.setCharSpace(0);
  document.setDrawColor(...pdfColours.line);
  document.line(margin, 33, pageWidth - margin, 33);
}

function drawPill(
  document: jsPDF,
  text: string,
  x: number,
  y: number,
  fill: [number, number, number] = [242, 230, 208],
) {
  document.setFont("helvetica", "bold");
  document.setFontSize(8);
  const width = document.getTextWidth(text) + 11;
  document.setFillColor(...fill);
  document.roundedRect(x, y, width, 9, 4.5, 4.5, "F");
  document.setTextColor(123, 87, 47);
  document.text(text, x + 5.5, y + 6);
  return width;
}

function addCoverPage(
  document: jsPDF,
  profile: PdfMealPlanProfile,
  days: PdfMealPlanDay[],
  deliveryLabel: string,
  logo: string | null,
  images: Map<string, string | null>,
) {
  fillPage(document);
  fillGradient(document, 0, 185, [13, 34, 29], [53, 66, 42]);
  document.setFillColor(30, 70, 58);
  document.circle(188, 8, 74, "F");
  document.setFillColor(63, 83, 49);
  document.circle(22, 174, 44, "F");

  addLogoOrWordmark(document, logo, margin, 18);
  document.setFont("helvetica", "bold");
  document.setFontSize(8);
  document.setCharSpace(1.5);
  document.setTextColor(232, 196, 126);
  document.text("A KASA PRODUCT", margin, 44);
  document.setCharSpace(0);
  document.setFontSize(31);
  document.setTextColor(255, 253, 247);
  document.text(["Your personalised", "meal plan"], margin, 70);
  document.setFont("helvetica", "normal");
  document.setFontSize(11);
  document.setTextColor(223, 228, 218);
  document.text(
    document.splitTextToSize(
      "Beautiful everyday meal inspiration shaped from your food choices, favourite cuisines and cooking comfort.",
      97,
    ),
    margin,
    103,
  );

  const coverRecipe = days
    .flatMap((day) => Object.values(day.mealsByTime).flat())
    .find((recipe) => images.get(recipe.imageUrl || ""));
  const coverImage = coverRecipe?.imageUrl
    ? images.get(coverRecipe.imageUrl)
    : null;
  document.setFillColor(236, 223, 199);
  document.roundedRect(122, 43, 72, 99, 8, 8, "F");
  if (addSafeImage(document, coverImage, 126, 47, 64, 91)) {
    document.setFillColor(12, 26, 22);
    document.roundedRect(130, 124, 54, 10, 5, 5, "F");
    document.setFont("helvetica", "bold");
    document.setFontSize(7.2);
    document.setTextColor(255, 253, 247);
    document.text("Made for your table", 157, 130.5, { align: "center" });
  } else {
    document.setFillColor(48, 78, 62);
    document.roundedRect(126, 47, 64, 91, 6, 6, "F");
  }

  const strengths = [
    "Taste-led choices",
    "Clickable recipes",
    "Practical daily plan",
  ];
  strengths.forEach((strength, index) => {
    const x = margin + index * 35.5;
    document.setFillColor(37, 65, 53);
    document.roundedRect(x, 151, 33, 18, 4, 4, "F");
    document.setFont("helvetica", "bold");
    document.setFontSize(6.3);
    document.setTextColor(234, 205, 145);
    document.text(document.splitTextToSize(strength, 27), x + 4, 158);
  });

  drawPill(document, deliveryLabel, margin, 200);
  document.setFont("helvetica", "bold");
  document.setFontSize(17);
  document.setTextColor(...pdfColours.ink);
  document.text(`Prepared for ${profile.name}`, margin, 225);
  document.setFont("helvetica", "normal");
  document.setFontSize(10);
  document.setTextColor(...pdfColours.copy);
  const dateRange =
    days.length > 1
      ? `${format(days[0].date, "dd MMM")} - ${format(days[days.length - 1].date, "dd MMM yyyy")}`
      : format(days[0].date, "EEEE, dd MMMM yyyy");
  document.text(dateRange, margin, 236);
  document.setFillColor(255, 253, 248);
  document.setDrawColor(...pdfColours.line);
  document.roundedRect(margin, 246, contentWidth, 27, 4, 4, "FD");
  document.setFont("helvetica", "bold");
  document.setFontSize(8);
  document.setCharSpace(0.9);
  document.setTextColor(...pdfColours.gold);
  document.text("ABOUT KYA KHAYEN", margin + 7, 256);
  document.setCharSpace(0);
  document.setFont("helvetica", "normal");
  document.setFontSize(7.7);
  document.setTextColor(...pdfColours.copy);
  document.text(
    document.splitTextToSize(
      "A KASA product helping you discover recipes and arrange everyday meals around taste, time and cooking comfort.",
      145,
    ),
    margin + 7,
    264,
  );
  addFooter(document, 1);
}

function addProfilePage(
  document: jsPDF,
  profile: PdfMealPlanProfile,
  days: PdfMealPlanDay[],
  logo: string | null,
  pageNumber: number,
) {
  document.addPage();
  addPageHeader(document, logo, "Your food choices");
  document.setFont("helvetica", "bold");
  document.setFontSize(25);
  document.setTextColor(...pdfColours.ink);
  document.text("Made around your table", margin, 56);
  document.setFont("helvetica", "normal");
  document.setFontSize(10.5);
  document.setTextColor(...pdfColours.copy);
  document.text(
    "A quick record of the everyday choices used to shape this meal plan.",
    margin,
    67,
  );

  document.setFillColor(...pdfColours.forest);
  document.roundedRect(margin, 80, contentWidth, 38, 5, 5, "F");
  document.setFont("helvetica", "bold");
  document.setFontSize(8);
  document.setCharSpace(1.2);
  document.setTextColor(230, 193, 123);
  document.text("PREPARED FOR", margin + 9, 94);
  document.setCharSpace(0);
  document.setFontSize(17);
  document.setTextColor(255, 253, 247);
  document.text(profile.name, margin + 9, 106);
  document.setFont("helvetica", "normal");
  document.setFontSize(9);
  document.setTextColor(215, 222, 212);
  if (profile.email) document.text(profile.email, 116, 94);
  document.text(
    profile.accessLabel || `${days.length}-day plan`,
    116,
    106,
  );

  const details = [
    { label: "FOOD STYLE", value: profile.foodStyle || "Not selected" },
    { label: "COOKING COMFORT", value: profile.cookingComfort || "Not selected" },
    {
      label: "FAVOURITE CUISINES",
      value: profile.cuisines?.join(", ") || "No cuisines selected",
    },
    {
      label: "INGREDIENTS TO LEAVE OUT",
      value: profile.exclusions?.join(", ") || "No exclusions selected",
    },
  ];
  details.forEach(({ label, value }, index) => {
    const x = margin + (index % 2) * 91;
    const y = 133 + Math.floor(index / 2) * 46;
    document.setFillColor(255, 253, 248);
    document.setDrawColor(...pdfColours.line);
    document.roundedRect(x, y, 87, 37, 4, 4, "FD");
    document.setFont("helvetica", "bold");
    document.setFontSize(7.5);
    document.setCharSpace(0.8);
    document.setTextColor(...pdfColours.gold);
    document.text(label, x + 6, y + 11);
    document.setCharSpace(0);
    document.setFont("helvetica", "normal");
    document.setFontSize(9);
    document.setTextColor(...pdfColours.ink);
    const lines = document.splitTextToSize(value, 74).slice(0, 2);
    document.text(lines, x + 6, y + 23);
  });

  document.setFillColor(246, 234, 212);
  document.roundedRect(margin, 235, contentWidth, 27, 4, 4, "F");
  document.setFont("helvetica", "bold");
  document.setFontSize(9);
  document.setTextColor(...pdfColours.ink);
  document.text("Everyday food inspiration only", margin + 8, 247);
  document.setFont("helvetica", "normal");
  document.setFontSize(8.2);
  document.setTextColor(...pdfColours.copy);
  document.text(
    "Selected exclusions are your choices, not allergy verification or medical guidance. Check ingredients before cooking.",
    margin + 8,
    255,
  );
  addFooter(document, pageNumber);
}

function orderedMeals(day: PdfMealPlanDay) {
  if (day.routineSlots?.length) {
    return sortRoutineSlots(day.routineSlots).flatMap((slot) => {
      const recipes = day.mealsByTime[slot.slug] || [];
      return recipes.length || slot.optional
        ? [[slot.slug, recipes, slot] as const]
        : [];
    });
  }

  const used = new Set<string>();
  const ordered = mealTimeOrder.flatMap((slug) => {
    used.add(slug);
    const recipes = day.mealsByTime[slug] || [];
    return recipes.length ? [[slug, recipes, null] as const] : [];
  });
  Object.entries(day.mealsByTime).forEach(([slug, recipes]) => {
    if (!used.has(slug) && recipes.length) ordered.push([slug, recipes, null]);
  });
  return ordered;
}

function drawRecipeCard(
  document: jsPDF,
  recipe: RecipeWithCategory,
  image: string | null,
  x: number,
  y: number,
  width: number,
) {
  const height = 22;
  document.setFillColor(255, 253, 249);
  document.setDrawColor(...pdfColours.line);
  document.roundedRect(x, y, width, height, 3, 3, "FD");
  document.setFillColor(245, 237, 222);
  document.roundedRect(x + 2, y + 2, 20, height - 4, 2, 2, "F");
  addSafeImage(document, image, x + 2, y + 2, 20, height - 4);
  const textX = x + 26;
  document.setFont("helvetica", "bold");
  document.setFontSize(8.2);
  document.setTextColor(...pdfColours.ink);
  const title = document
    .splitTextToSize(plainText(recipe.title), width - 31)
    .slice(0, 2);
  document.text(title, textX, y + 7);
  const minutes = totalMinutes(recipe);
  const tag = nutrientLabel(recipe);
  const meta = [minutes ? `${minutes} min` : "", tag].filter(Boolean).join("  |  ");
  document.setFont("helvetica", "normal");
  document.setFontSize(6.8);
  document.setTextColor(...pdfColours.copy);
  document.text(meta || "Open recipe online", textX, y + 18);
  document.setFont("helvetica", "bold");
  document.setFontSize(7);
  document.setTextColor(...pdfColours.accent);
  document.text("View >", x + width - 4, y + 18, { align: "right" });
  document.link(x, y, width, height, { url: recipeHref(recipe) });
  return height;
}

function addDayPages(
  document: jsPDF,
  day: PdfMealPlanDay,
  logo: string | null,
  images: Map<string, string | null>,
  firstPageNumber: number,
) {
  let pageNumber = firstPageNumber;
  let pageForDay = 0;
  let columnsY = [61, 61];
  const columnWidth = 85.5;
  const columnX = [margin, margin + 92.5];
  const groups = orderedMeals(day);

  const startPage = () => {
    document.addPage();
    pageForDay += 1;
    addPageHeader(
      document,
      logo,
      pageForDay > 1 ? "Daily table continued" : "Your daily table",
    );
    document.setFont("helvetica", "bold");
    document.setFontSize(22);
    document.setTextColor(...pdfColours.ink);
    document.text(format(day.date, "EEEE"), margin, 49);
    document.setFont("helvetica", "normal");
    document.setFontSize(10);
    document.setTextColor(...pdfColours.copy);
    document.text(format(day.date, "dd MMMM yyyy"), margin + 38, 49);
    const dishCount = Object.values(day.mealsByTime).reduce(
      (total, recipes) => total + recipes.length,
      0,
    );
    const countLabel = `${dishCount} dishes`;
    document.setFont("helvetica", "bold");
    document.setFontSize(8);
    const pillWidth = document.getTextWidth(countLabel) + 11;
    drawPill(document, countLabel, pageWidth - margin - pillWidth, 41);
    columnsY = [61, 61];
    addFooter(document, pageNumber);
    pageNumber += 1;
  };

  startPage();

  groups.forEach(([slug, recipes, slot]) => {
    const guidanceLines = slot?.guidance
      ? document.splitTextToSize(slot.guidance, columnWidth - 2).slice(0, 3)
      : [];
    const headerHeight = slot ? 18 + guidanceLines.length * 4 : 12;
    const requiredHeight = headerHeight + recipes.length * 25 + 5;
    let column = columnsY[0] <= columnsY[1] ? 0 : 1;
    if (columnsY[column] + requiredHeight > 268) {
      const alternative = column === 0 ? 1 : 0;
      if (columnsY[alternative] + requiredHeight <= 268) {
        column = alternative;
      } else {
        startPage();
        column = 0;
      }
    }

    const x = columnX[column];
    let y = columnsY[column];
    document.setFont("helvetica", "bold");
    document.setFontSize(9);
    document.setCharSpace(0.7);
    document.setTextColor(...pdfColours.accent);
    document.text((slot?.title || displayMealTime(slug)).toUpperCase(), x, y + 6);
    document.setCharSpace(0);
    document.setDrawColor(...pdfColours.line);
    document.line(x + 32, y + 4.5, x + columnWidth, y + 4.5);
    if (slot?.timeRange) {
      document.setFont("helvetica", "normal");
      document.setFontSize(7.2);
      document.setTextColor(...pdfColours.copy);
      document.text(slot.timeRange, x, y + 11);
    }
    if (guidanceLines.length > 0) {
      document.setFont("helvetica", "normal");
      document.setFontSize(7.3);
      document.setTextColor(...pdfColours.copy);
      document.text(guidanceLines, x, y + 16);
    }
    y += headerHeight;

    recipes.forEach((recipe) => {
      drawRecipeCard(
        document,
        recipe,
        recipe.imageUrl ? images.get(recipe.imageUrl) || null : null,
        x,
        y,
        columnWidth,
      );
      y += 25;
    });
    columnsY[column] = y + 5;
  });

  return pageNumber;
}

function addClosingPage(
  document: jsPDF,
  profile: PdfMealPlanProfile,
  logo: string | null,
  pageNumber: number,
) {
  document.addPage();
  fillGradient(document, 0, pageHeight, [15, 37, 32], [54, 61, 39]);
  document.setFillColor(35, 78, 64);
  document.circle(196, 14, 78, "F");
  addLogoOrWordmark(document, logo, margin, 22);
  document.setFont("helvetica", "bold");
  document.setFontSize(29);
  document.setTextColor(255, 253, 247);
  document.text(["Enjoy your", "next table."], margin, 91);
  document.setFont("helvetica", "normal");
  document.setFontSize(11);
  document.setTextColor(219, 228, 217);
  document.text(
    document.splitTextToSize(
      `Thank you, ${profile.name}. Keep discovering new dishes and return whenever you want to refresh upcoming meals.`,
      108,
    ),
    margin,
    124,
  );
  document.setFillColor(244, 224, 181);
  document.roundedRect(margin, 169, 76, 15, 7.5, 7.5, "F");
  document.setFont("helvetica", "bold");
  document.setFontSize(10);
  document.setTextColor(...pdfColours.forest);
  document.text("Explore recipes online", margin + 10, 178.5);
  document.link(margin, 169, 76, 15, { url: absoluteUrl("/recipes") });
  document.setFont("helvetica", "normal");
  document.setFontSize(9);
  document.setTextColor(213, 222, 212);
  document.text("www.kyakhayen.com  |  A KASA Product", margin, 252);
  document.setDrawColor(77, 105, 91);
  document.line(margin, 271, pageWidth - margin, 271);
  document.setFontSize(7.5);
  document.text(
    "Food inspiration only. Please verify ingredients wherever dietary safety matters.",
    margin,
    279,
  );
  document.text(String(pageNumber), pageWidth - margin, 279, { align: "right" });
}

export async function generateMealPlanPdf(
  profile: PdfMealPlanProfile,
  days: PdfMealPlanDay[],
  deliveryLabel = "Your selected week",
) {
  if (days.length === 0) {
    throw new Error("A meal-plan PDF requires at least one day.");
  }

  const document = new jsPDF({ format: "a4", unit: "mm" });
  const logo = await logoDataUrl();
  const imageUrls = Array.from(
    new Set(
      days
        .flatMap((day) => Object.values(day.mealsByTime).flat())
        .map((recipe) => recipe.imageUrl)
        .filter((url): url is string => Boolean(url)),
    ),
  );
  const images = new Map(
    await Promise.all(
      imageUrls.map(async (url) => [url, await imageDataUrl(url)] as const),
    ),
  );

  addCoverPage(document, profile, days, deliveryLabel, logo, images);
  addProfilePage(document, profile, days, logo, 2);
  let nextPageNumber = 3;
  days.forEach((day) => {
    nextPageNumber = addDayPages(document, day, logo, images, nextPageNumber);
  });
  addClosingPage(document, profile, logo, nextPageNumber);

  const suffix =
    days.length > 1
      ? `${format(days[0].date, "yyyy-MM-dd")}-week`
      : format(days[0].date, "yyyy-MM-dd");
  return pdfToAttachment(document, `kya-khayen-meal-plan-${suffix}.pdf`);
}
