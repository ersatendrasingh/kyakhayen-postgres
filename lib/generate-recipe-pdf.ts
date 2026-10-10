"use client";

export type RecipePdfNutrition = {
  calories: number;
  protein: number;
  carbohydrate: number;
  totalFat: number;
  dietaryFiber: number;
  vitaminA?: number;
  vitaminD?: number;
  vitaminK?: number;
  ascorbicAcids?: number;
  calcium?: number;
  iron?: number;
  potassium?: number;
  sodium?: number;
};

export type RecipePdfData = {
  title: string;
  description: string;
  overview?: string;
  imageUrl?: string;
  url: string;
  ingredients?: string[];
  steps?: string[];
  totalMinutes?: number;
  prepMinutes?: number;
  cookMinutes?: number;
  restMinutes?: number;
  category?: string;
  cuisine?: string;
  difficulty?: string;
  tags?: string[];
  nutrition?: RecipePdfNutrition;
};

type RecipePdfMode = "download" | "print";

const logoPath = "/assets/images/kyakhayen-logo.png";

const loadAsDataUrl = async (src: string) => {
  const response = await fetch(src);
  if (!response.ok) {
    throw new Error("Could not load PDF branding.");
  }

  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read PDF branding."));
    reader.readAsDataURL(blob);
  });
};

const plainText = (value: string) =>
  value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

export async function generateRecipePdf(
  data: RecipePdfData,
  mode: RecipePdfMode,
) {
  const printWindow = mode === "print" ? window.open("", "_blank") : null;
  if (mode === "print" && !printWindow) {
    throw new Error("Please allow popups to print this recipe.");
  }

  const [{ jsPDF, GState }, logo, coverImage] = await Promise.all([
    import("jspdf"),
    loadAsDataUrl(logoPath),
    data.imageUrl
      ? loadAsDataUrl(data.imageUrl).catch(() => null)
      : Promise.resolve(null),
  ]);
  const document = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });
  const margin = 18;
  const pageWidth = document.internal.pageSize.getWidth();
  const pageHeight = document.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  const addBranding = () => {
    document.setDrawColor(230, 211, 180);
    document.setLineWidth(0.35);
    document.roundedRect(margin - 6, 12, contentWidth + 12, pageHeight - 25, 4, 4);

    document.addImage(logo, "PNG", margin, 18, 45, 14);
    document.setFont("helvetica", "normal");
    document.setFontSize(9);
    document.setTextColor(135, 113, 91);
    document.text("DISCOVER. COOK. SHARE.", pageWidth - margin, 26, {
      align: "right",
    });
    document.setDrawColor(238, 224, 202);
    document.line(margin, 38, pageWidth - margin, 38);

    document.setGState(new GState({ opacity: 0.045 }));
    document.addImage(logo, "PNG", 37, 128, 136, 42);
    document.setGState(new GState({ opacity: 1 }));

    document.setFontSize(8);
    document.setTextColor(143, 127, 111);
    document.text("Kya Khayen?  |  Beautiful everyday recipes", margin, pageHeight - 18);
    document.text(
      String(document.getNumberOfPages()),
      pageWidth - margin,
      pageHeight - 18,
      { align: "right" },
    );
    y = 48;
  };

  const newPageIfNeeded = (requiredHeight: number) => {
    if (y + requiredHeight < pageHeight - 27) return;
    document.addPage();
    addBranding();
  };

  const addSectionHeading = (heading: string) => {
    newPageIfNeeded(15);
    document.setFont("helvetica", "bold");
    document.setFontSize(10);
    document.setTextColor(160, 112, 47);
    document.text(heading.toUpperCase(), margin, y);
    y += 8;
  };

  const addParagraph = (text: string, fontSize = 10, leading = 5.4) => {
    const lines = document.splitTextToSize(plainText(text), contentWidth);
    newPageIfNeeded(lines.length * leading + 3);
    document.setFont("helvetica", "normal");
    document.setFontSize(fontSize);
    document.setTextColor(73, 62, 51);
    document.text(lines, margin, y);
    y += lines.length * leading + 3;
  };

  addBranding();
  document.setFont("helvetica", "bold");
  document.setFontSize(25);
  document.setTextColor(40, 32, 26);
  const titleLines = document.splitTextToSize(data.title, contentWidth);
  document.text(titleLines, margin, y);
  y += titleLines.length * 11 + 3;

  const facts = [
    data.totalMinutes ? `${data.totalMinutes} min total` : "",
    data.prepMinutes ? `${data.prepMinutes} min prep` : "",
    data.cookMinutes ? `${data.cookMinutes} min cook` : "",
    data.category || "",
    data.cuisine || "",
  ].filter(Boolean);
  if (facts.length > 0) {
    document.setFillColor(250, 241, 224);
    document.roundedRect(margin, y, contentWidth, 12, 3, 3, "F");
    document.setFont("helvetica", "bold");
    document.setFontSize(9);
    document.setTextColor(111, 82, 47);
    document.text(facts.join("   |   "), margin + 5, y + 7.5);
    y += 19;
  }

  if (coverImage) {
    newPageIfNeeded(47);
    document.addImage(coverImage, "JPEG", margin, y, contentWidth, 42, undefined, "FAST");
    y += 49;
  }

  addSectionHeading("About this recipe");
  addParagraph(data.overview || data.description);

  const recipeNotes = [
    data.difficulty ? `Skill level: ${data.difficulty}` : "",
    data.restMinutes ? `Resting time: ${data.restMinutes} minutes` : "",
    data.tags?.length ? `Cooking style: ${data.tags.join(", ")}` : "",
  ].filter(Boolean);
  if (recipeNotes.length > 0) {
    addSectionHeading("Kitchen notes");
    addParagraph(recipeNotes.join("   |   "), 9, 4.8);
  }

  addSectionHeading("Ingredients");
  (data.ingredients || []).forEach((ingredient) => {
    const lines = document.splitTextToSize(plainText(ingredient), contentWidth - 7);
    newPageIfNeeded(lines.length * 5 + 2);
    document.setFillColor(184, 51, 36);
    document.circle(margin + 1.5, y - 1.2, 1, "F");
    document.setFont("helvetica", "normal");
    document.setFontSize(10);
    document.setTextColor(63, 53, 45);
    document.text(lines, margin + 7, y);
    y += lines.length * 5 + 2;
  });
  y += 3;

  addSectionHeading("Method");
  (data.steps || []).forEach((step, index) => {
    const lines = document.splitTextToSize(plainText(step), contentWidth - 13);
    newPageIfNeeded(lines.length * 5.3 + 5);
    document.setFillColor(23, 56, 45);
    document.circle(margin + 4, y + 0.3, 4, "F");
    document.setFont("helvetica", "bold");
    document.setFontSize(8);
    document.setTextColor(255, 250, 239);
    document.text(String(index + 1), margin + 4, y + 1.5, { align: "center" });
    document.setFont("helvetica", "normal");
    document.setFontSize(10);
    document.setTextColor(63, 53, 45);
    document.text(lines, margin + 13, y + 1.5);
    y += lines.length * 5.3 + 6;
  });

  if (data.nutrition) {
    addSectionHeading("Nutrition per serving");
    newPageIfNeeded(26);
    const metrics = [
      ["Energy", `${data.nutrition.calories.toFixed(0)} kcal`],
      ["Protein", `${data.nutrition.protein.toFixed(1)} g`],
      ["Carbs", `${data.nutrition.carbohydrate.toFixed(1)} g`],
      ["Fat", `${data.nutrition.totalFat.toFixed(1)} g`],
      ["Fiber", `${data.nutrition.dietaryFiber.toFixed(1)} g`],
    ];
    const cellWidth = contentWidth / metrics.length;
    metrics.forEach(([label, value], index) => {
      const x = margin + cellWidth * index;
      document.setFillColor(245, 237, 222);
      document.roundedRect(x + 1, y, cellWidth - 2, 20, 2, 2, "F");
      document.setFont("helvetica", "normal");
      document.setFontSize(7.5);
      document.setTextColor(117, 100, 82);
      document.text(label, x + cellWidth / 2, y + 7, { align: "center" });
      document.setFont("helvetica", "bold");
      document.setFontSize(9);
      document.setTextColor(43, 35, 28);
      document.text(value, x + cellWidth / 2, y + 14, { align: "center" });
    });
    y += 25;
    const nutritionalHighlights = [
      data.nutrition.protein >= 10 ? "Good protein support" : "",
      data.nutrition.dietaryFiber >= 3 ? "Source of dietary fiber" : "",
      (data.nutrition.calories ?? 0) < 400 ? "Comfortably portioned energy" : "",
    ].filter(Boolean);
    if (nutritionalHighlights.length > 0) {
      addParagraph(`Highlights: ${nutritionalHighlights.join("  |  ")}`, 9, 4.8);
    }

    const micronutrients = [
      ["Vitamin A", data.nutrition.vitaminA, "mcg"],
      ["Vitamin C", data.nutrition.ascorbicAcids, "mg"],
      ["Vitamin D", data.nutrition.vitaminD, "mcg"],
      ["Vitamin K", data.nutrition.vitaminK, "mcg"],
      ["Calcium", data.nutrition.calcium, "mg"],
      ["Iron", data.nutrition.iron, "mg"],
      ["Potassium", data.nutrition.potassium, "mg"],
      ["Sodium", data.nutrition.sodium, "mg"],
    ].filter(([, value]) => typeof value === "number");
    if (micronutrients.length > 0) {
      addSectionHeading("Vitamins and minerals");
      micronutrients.forEach(([label, value, unit], index) => {
        if (index % 2 === 0) newPageIfNeeded(7);
        const columnX = margin + (index % 2) * (contentWidth / 2);
        const rowY = y;
        document.setFont("helvetica", "normal");
        document.setFontSize(9);
        document.setTextColor(100, 85, 70);
        document.text(String(label), columnX, rowY);
        document.setFont("helvetica", "bold");
        document.setTextColor(52, 43, 34);
        document.text(`${Number(value).toFixed(1)} ${unit}`, columnX + 48, rowY);
        if (index % 2 === 1 || index === micronutrients.length - 1) {
          y += 6;
        }
      });
      y += 4;
    }
    addParagraph(
      "Estimated values based on measured ingredients. Actual nutrition may vary by product and portion size.",
      8.5,
      4.5,
    );
  }

  newPageIfNeeded(14);
  document.setDrawColor(238, 224, 202);
  document.line(margin, y + 2, pageWidth - margin, y + 2);
  document.setFont("helvetica", "normal");
  document.setFontSize(8.5);
  document.setTextColor(120, 101, 82);
  document.text("View recipe online:", margin, y + 9);
  document.setTextColor(156, 94, 42);
  document.text(data.url, margin + 28, y + 9);

  const filename = `${data.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "recipe"}-kyakhayen.pdf`;

  if (mode === "download") {
    document.save(filename);
    return;
  }

  document.autoPrint();
  printWindow!.location.href = document.output("bloburl").toString();
}
