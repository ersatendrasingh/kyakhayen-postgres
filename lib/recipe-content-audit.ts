import { hasInternalSeoCopy, recipeHref, stripHtml } from "@/lib/seo";

export type RecipeAuditSeverity = "critical" | "warning" | "good" | "info";

export type RecipeAuditCheck = {
  id: string;
  title: string;
  severity: RecipeAuditSeverity;
  score: number;
  maxScore: number;
  detail: string;
  fix?: string;
};

export type RecipeAuditSection = {
  id: string;
  title: string;
  score: number;
  maxScore: number;
  checks: RecipeAuditCheck[];
};

export type RecipeAuditResult = {
  score: number;
  maxScore: number;
  grade: "Excellent" | "Good" | "Needs work" | "Weak";
  summary: string;
  sections: RecipeAuditSection[];
  criticalCount: number;
  warningCount: number;
};

export type RecipeAuditInput = {
  title: string;
  slug: string;
  metaTitle: string | null;
  metaDescription: string | null;
  metaSlug: string | null;
  description: string | null;
  imageUrl: string | null;
  recipeCategoriesId: string | null;
  recipeDifficultyId: string | null;
  seasonality: string;
  isPublished: boolean;
  contentUpdatedAt: string | null;
  ingredients: Array<{ ingredientName: string; quantity?: number | null }>;
  steps: Array<{
    title: string;
    description: string | null;
    imageUrl: string | null;
    videoUrl: string | null;
    isPublished: boolean;
  }>;
  recipeCookingTime: {
    prepTime: number;
    cookTime: number;
    restTime: number;
    totalTime?: number;
  } | null;
  cuisineIds: string[];
  cookingMethodIds: string[];
  mealTimeIds: string[];
  dietTypeIds: string[];
  recipeTypeIds: string[];
  bodyTypeIds: string[];
  seasonIds: string[];
};

const TEMPLATE_PATTERNS = [
  /\bcarefully chosen everyday ingredients\b/i,
  /\blisted ingredients\b/i,
  /\bremaining listed ingredients\b/i,
  /\blisted cooking method\b/i,
  /\btags on Kya Khayen help\b/i,
  /\bsearch terms?\b/i,
  /\bseo[- ]?friendly\b/i,
  /\brank(?:ing)?\b/i,
  /\bdatabase entry\b/i,
  /\bkeyword stuffing\b/i,
];

const COMMON_WORDS = new Set([
  "recipe",
  "easy",
  "homemade",
  "fresh",
  "with",
  "and",
  "the",
  "for",
  "this",
  "that",
  "make",
  "cook",
  "serve",
  "ingredients",
  "method",
]);

function cleanText(value?: string | null) {
  return stripHtml(value || "").replace(/\s+/g, " ").trim();
}

function words(value?: string | null) {
  return cleanText(value).split(/\s+/).filter(Boolean);
}

function wordCount(value?: string | null) {
  return words(value).length;
}

function uniqueRatio(value?: string | null) {
  const tokens = words(value)
    .map((word) => word.toLowerCase().replace(/[^a-z0-9]+/g, ""))
    .filter((word) => word.length > 3 && !COMMON_WORDS.has(word));
  if (tokens.length === 0) return 0;
  return new Set(tokens).size / tokens.length;
}

function sentenceCount(value?: string | null) {
  return cleanText(value).split(/[.!?]+/).filter((part) => part.trim().length > 8).length;
}

function hasAny(value: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(value));
}

function check(
  id: string,
  title: string,
  severity: RecipeAuditSeverity,
  score: number,
  maxScore: number,
  detail: string,
  fix?: string,
): RecipeAuditCheck {
  return { id, title, severity, score, maxScore, detail, fix };
}

function section(id: string, title: string, checks: RecipeAuditCheck[]): RecipeAuditSection {
  return {
    id,
    title,
    score: checks.reduce((sum, item) => sum + item.score, 0),
    maxScore: checks.reduce((sum, item) => sum + item.maxScore, 0),
    checks,
  };
}

function severityFor(score: number, maxScore: number): RecipeAuditSeverity {
  const ratio = maxScore > 0 ? score / maxScore : 1;
  if (ratio >= 0.9) return "good";
  if (ratio >= 0.55) return "warning";
  return "critical";
}

function titleTokens(title: string) {
  return title
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2 && !COMMON_WORDS.has(token));
}

function containsTitleSignal(value: string | null | undefined, title: string) {
  const text = cleanText(value).toLowerCase();
  return titleTokens(title).some((token) => text.includes(token));
}

function methodText(recipe: RecipeAuditInput) {
  return recipe.steps
    .filter((step) => step.isPublished)
    .map((step) => `${step.title}. ${cleanText(step.description)}`)
    .join(" ");
}

function headingCount(html?: string | null) {
  return (html || "").match(/<h[2-4][^>]*>/gi)?.length ?? 0;
}

function listCount(html?: string | null) {
  return (html || "").match(/<(ul|ol)[^>]*>/gi)?.length ?? 0;
}

function totalMinutes(recipe: RecipeAuditInput) {
  const time = recipe.recipeCookingTime;
  if (!time) return 0;
  return time.totalTime ?? time.prepTime + time.cookTime + time.restTime;
}

export function auditRecipeContent(recipe: RecipeAuditInput): RecipeAuditResult {
  const description = cleanText(recipe.description);
  const methods = methodText(recipe);
  const allContent = `${description} ${methods}`;
  const descriptionWords = wordCount(description);
  const methodWords = wordCount(methods);
  const publishedSteps = recipe.steps.filter((step) => step.isPublished);
  const titleLength = cleanText(recipe.metaTitle || recipe.title).length;
  const metaDescriptionLength = cleanText(recipe.metaDescription).length;
  const hasGuideTemplateSupport = true;
  const uniquenessRatio = uniqueRatio(allContent);
  const templatePatternFound = hasAny(allContent, TEMPLATE_PATTERNS) || hasInternalSeoCopy(allContent);
  const route = recipeHref({ slug: recipe.slug, metaSlug: recipe.metaSlug });

  const contentChecks = [
    descriptionWords >= 260
      ? check(
          "description-depth",
          "Overview depth",
          "good",
          14,
          14,
          `Overview has ${descriptionWords} words.`,
        )
      : check(
          "description-depth",
          "Overview depth",
          descriptionWords >= 140 ? "warning" : "critical",
          descriptionWords >= 140 ? 8 : 2,
          14,
          `Overview has ${descriptionWords} words.`,
          "Add recipe-specific context: taste, texture, why it works, cooking cues, serving and storage notes.",
        ),
    sentenceCount(description) >= 8
      ? check("sentence-variety", "Sentence coverage", "good", 8, 8, "Overview has enough explanatory sentences.")
      : check(
          "sentence-variety",
          "Sentence coverage",
          "warning",
          4,
          8,
          "Overview may read too thin or list-like.",
          "Add short paragraphs that answer real cooking questions, not just generic intro copy.",
        ),
    headingCount(recipe.description) >= 2 || listCount(recipe.description) >= 1
      ? check("structure", "Readable structure", "good", 8, 8, "Description uses headings or lists.")
      : check(
          "structure",
          "Readable structure",
          "warning",
          4,
          8,
          "Description has little visible structure.",
          "Use H2/H3 sections for tips, mistakes, storage or variations where useful.",
        ),
    templatePatternFound
      ? check(
          "template-copy",
          "Template/generic copy",
          "critical",
          0,
          12,
          "Potential internal SEO/template wording was detected.",
          "Rewrite the affected lines in natural recipe language. Remove SEO/process words and generic filler.",
        )
      : check("template-copy", "Template/generic copy", "good", 12, 12, "No obvious internal SEO or template wording detected."),
    uniquenessRatio >= 0.62
      ? check("word-diversity", "Word diversity", "good", 8, 8, `Content word diversity is ${Math.round(uniquenessRatio * 100)}%.`)
      : check(
          "word-diversity",
          "Word diversity",
          "warning",
          4,
          8,
          `Content word diversity is ${Math.round(uniquenessRatio * 100)}%.`,
          "Add concrete ingredient, texture, timing and serving details that are unique to this recipe.",
        ),
  ];

  const methodChecks = [
    publishedSteps.length >= 3
      ? check("step-count", "Published steps", "good", 8, 8, `${publishedSteps.length} public steps are available.`)
      : check(
          "step-count",
          "Published steps",
          "critical",
          2,
          8,
          `${publishedSteps.length} public steps are available.`,
          "Add enough step-by-step cooking instructions for a user to complete the recipe.",
        ),
    methodWords >= Math.max(110, publishedSteps.length * 28)
      ? check("method-detail", "Method detail", "good", 12, 12, `Published method text has ${methodWords} words.`)
      : check(
          "method-detail",
          "Method detail",
          "warning",
          5,
          12,
          `Published method text has ${methodWords} words.`,
          "Add cues for heat, consistency, aroma, colour, doneness and serving.",
        ),
    publishedSteps.every((step) => cleanText(step.description).length >= 40)
      ? check("step-specificity", "Step specificity", "good", 10, 10, "Every published step has useful detail.")
      : check(
          "step-specificity",
          "Step specificity",
          "warning",
          4,
          10,
          "One or more published steps are very short.",
          "Expand short steps so a beginner knows exactly what to do and when to stop.",
        ),
    publishedSteps.some((step) => step.imageUrl || step.videoUrl)
      ? check("step-media", "Step media", "good", 5, 5, "At least one method has image or video support.")
      : check(
          "step-media",
          "Step media",
          "info",
          2,
          5,
          "No method image or video is attached.",
          "Optional: add real process media for high-value recipes.",
        ),
  ];

  const seoChecks = [
    titleLength >= 25 && titleLength <= 62
      ? check("meta-title-length", "SEO title length", "good", 8, 8, `Title length is ${titleLength} characters.`)
      : check(
          "meta-title-length",
          "SEO title length",
          "warning",
          4,
          8,
          `Title length is ${titleLength} characters.`,
          "Keep SEO title descriptive and usually within 25-62 characters.",
        ),
    metaDescriptionLength >= 110 && metaDescriptionLength <= 158
      ? check("meta-description-length", "Meta description length", "good", 10, 10, `Meta description is ${metaDescriptionLength} characters.`)
      : check(
          "meta-description-length",
          "Meta description length",
          "warning",
          metaDescriptionLength >= 70 ? 5 : 2,
          10,
          `Meta description is ${metaDescriptionLength} characters.`,
          "Write a natural 110-158 character summary with the dish, key ingredient or benefit, and cooking context.",
        ),
    containsTitleSignal(recipe.metaDescription || recipe.description, recipe.title)
      ? check("title-signal", "Recipe signal in preview", "good", 6, 6, "Meta/overview includes words from the recipe title.")
      : check(
          "title-signal",
          "Recipe signal in preview",
          "warning",
          3,
          6,
          "Meta/overview does not clearly echo the recipe title.",
          "Mention the actual dish and one key ingredient naturally.",
        ),
    /^\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(route)
      ? check("canonical-path", "Canonical path", "good", 6, 6, `Canonical path looks clean: ${route}`)
      : check(
          "canonical-path",
          "Canonical path",
          "warning",
          3,
          6,
          `Canonical path may need review: ${route}`,
          "Use lowercase words separated by hyphens, without symbols or duplicate terms.",
        ),
  ];

  const richChecks = [
    recipe.imageUrl
      ? check("main-image", "Main image", "good", 8, 8, "Main recipe image is present.")
      : check("main-image", "Main image", "critical", 0, 8, "Main recipe image is missing.", "Add a real dish image before relying on the page for search quality."),
    recipe.ingredients.length >= 3
      ? check("ingredients", "Ingredient coverage", "good", 8, 8, `${recipe.ingredients.length} ingredients are attached.`)
      : check(
          "ingredients",
          "Ingredient coverage",
          "critical",
          2,
          8,
          `${recipe.ingredients.length} ingredients are attached.`,
          "Add the real ingredient list with quantity and unit.",
        ),
    totalMinutes(recipe) > 0
      ? check("time", "Cooking time", "good", 6, 6, `Total time is ${totalMinutes(recipe)} minutes.`)
      : check("time", "Cooking time", "warning", 2, 6, "Cooking time is not set.", "Add prep/cook/rest time so Recipe schema and users get useful timing."),
    recipe.recipeCategoriesId && recipe.recipeDifficultyId
      ? check("core-taxonomy", "Core taxonomy", "good", 6, 6, "Category and difficulty are set.")
      : check(
          "core-taxonomy",
          "Core taxonomy",
          "warning",
          3,
          6,
          "Category or difficulty is missing.",
          "Set category and difficulty so listing, schema and internal discovery are stronger.",
        ),
    recipe.seasonality === "ALL_YEAR" || (recipe.seasonality === "SEASONAL" && recipe.seasonIds.length > 0)
      ? check("seasonality", "Season classification", "good", 5, 5, "Season classification is complete.")
      : check(
          "seasonality",
          "Season classification",
          "warning",
          2,
          5,
          "Season classification needs review.",
          "Mark all-year or select the relevant seasonal tags.",
        ),
    hasGuideTemplateSupport
      ? check(
          "smart-guide",
          "Helpful guide sections",
          "good",
          6,
          6,
          "Public recipe template adds tips, mistakes, storage, variations, FAQs and related links.",
        )
      : check("smart-guide", "Helpful guide sections", "info", 0, 6, "Guide sections are not enabled."),
  ];

  const discoveryChecks = [
    recipe.cuisineIds.length + recipe.mealTimeIds.length + recipe.recipeTypeIds.length >= 2
      ? check("discovery-tags", "Discovery tags", "good", 8, 8, "Cuisine, meal time or recipe type tags are present.")
      : check(
          "discovery-tags",
          "Discovery tags",
          "warning",
          3,
          8,
          "Discovery tags are thin.",
          "Add meal time, recipe type and cuisine tags where they genuinely apply.",
        ),
    recipe.cookingMethodIds.length > 0
      ? check("cooking-method-tags", "Cooking method tags", "good", 5, 5, "Cooking method tag is present.")
      : check(
          "cooking-method-tags",
          "Cooking method tags",
          "info",
          2,
          5,
          "Cooking method tag is missing.",
          "Add a cooking method when it clearly describes the recipe.",
        ),
    recipe.contentUpdatedAt
      ? check("content-freshness", "Content review date", "good", 5, 5, "Content updated date is set.")
      : check(
          "content-freshness",
          "Content review date",
          "warning",
          2,
          5,
          "Content updated date is not set.",
          "After manual quality edit, mark content as updated so audit batches can deprioritize it.",
        ),
  ];

  const sections = [
    section("content", "Content quality", contentChecks),
    section("method", "Recipe method", methodChecks),
    section("seo", "Search preview", seoChecks),
    section("schema", "Recipe completeness", richChecks),
    section("discovery", "Internal discovery", discoveryChecks),
  ];
  const score = sections.reduce((sum, item) => sum + item.score, 0);
  const maxScore = sections.reduce((sum, item) => sum + item.maxScore, 0);
  const ratio = maxScore > 0 ? score / maxScore : 0;
  const criticalCount = sections.flatMap((item) => item.checks).filter((item) => item.severity === "critical").length;
  const warningCount = sections.flatMap((item) => item.checks).filter((item) => item.severity === "warning").length;
  const grade =
    ratio >= 0.9 && criticalCount === 0
      ? "Excellent"
      : ratio >= 0.75 && criticalCount === 0
        ? "Good"
        : ratio >= 0.55
          ? "Needs work"
          : "Weak";

  return {
    score,
    maxScore,
    grade,
    criticalCount,
    warningCount,
    summary:
      grade === "Excellent"
        ? "This recipe has strong audit signals. Keep improving with real images, reviews and periodic checks."
        : grade === "Good"
          ? "This recipe is mostly healthy, but a few improvements can make it more useful and specific."
          : "This recipe should be manually reviewed before considering it recovered.",
    sections: sections.map((item) => ({
      ...item,
      checks: item.checks.map((auditCheck) => ({
        ...auditCheck,
        severity:
          auditCheck.severity === "info"
            ? "info"
            : auditCheck.severity === "good"
              ? "good"
              : severityFor(auditCheck.score, auditCheck.maxScore),
      })),
    })),
  };
}
