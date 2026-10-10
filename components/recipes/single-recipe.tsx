import { Suspense } from "react";

import { calculateRecipeNutrition } from "@/lib/calculate-recipe-nutrition";

import BannerCard from "@/components/recipes/banner-card";
import RecipeDetails from "@/components/recipes/recipe-details";

import RelatedRecipeSlider from "@/components/recipes/related-recipe-slider";
import RecipeSidebar from "@/components/recipes/recipe-sidebar";

import Container from "@/components/container";

import RecipeAuthorTrust from "@/components/recipes/recipe-author-trust";
import RecipeCommentSection from "@/components/recipes/recipe-comments-section";
import RecipeReviewsSection from "@/components/recipes/recipe-reviews-section";
import RecipeNotFound from "@/components/recipes/recipe-not-found";
import RecipeReactions from "@/components/recipes/recipe-reactions";
import RecipeCookingDock from "@/components/recipes/recipe-cooking-dock";
import RecipeComparePrompt from "@/components/recipes/recipe-compare-prompt";
import { fetchFoodCompareRecipePrompt } from "@/lib/food-compare";
import { getPublicRelatedRecipes, getRecipeSidebarTaxonomy } from "@/lib/public-content";
import { recipeAuthorProfile } from "@/lib/recipe-author-profile";
import { recipeCollectionHref } from "@/lib/recipe-collection-url";
import { recipeContentUpdatedAt, recipePublishedAt } from "@/lib/recipe-publication";
import { faqJsonLdFromRecipeGuide } from "@/lib/recipe-smart-guide";
import {
  absoluteUrl,
  breadcrumbJsonLd,
  jsonLd,
  recipeHref,
  seoDescription,
  stripHtml,
} from "@/lib/seo";
import { socialSameAs } from "@/lib/social-links";
import type { RecipeWithCategory } from "@/types/recipe";

interface SingleRecipeProps {
  recipe: RecipeWithCategory;
}

type RecipeComparePromptData = Awaited<ReturnType<typeof fetchFoodCompareRecipePrompt>>;
type RecipeComparePromptVariant = "default" | "nutrition";

async function RecipeComparePromptSlot({
  promptPromise,
  variant,
}: {
  promptPromise: Promise<RecipeComparePromptData>;
  variant?: RecipeComparePromptVariant;
}) {
  const comparePrompt = await promptPromise;

  if (!comparePrompt) return null;

  return (
    <RecipeComparePrompt
      base={comparePrompt.base}
      competitor={comparePrompt.competitor}
      reason={comparePrompt.reason}
      variant={variant}
    />
  );
}

function recipeDescriptionFallback(recipe: RecipeWithCategory) {
  const cuisine = recipe.recipeCuisine?.[0]?.cuisine.title;
  const category = recipe.RecipeCategories?.name;
  const recipeType = recipe.recipeRecipeType?.[0]?.recipeType.title;
  const context = [cuisine, category, recipeType].filter(Boolean).join(", ");

  return `${recipe.title} recipe with ingredients and step-by-step cooking instructions${context ? ` for ${context.toLowerCase()} cooking` : ""}. Make it at home with Kya Khayen.`;
}

function schemaAmount(value: number, unit: string, fractionDigits = 1) {
  if (!Number.isFinite(value) || value < 0) return undefined;
  const rounded =
    fractionDigits === 0 ? Math.round(value).toString() : value.toFixed(fractionDigits);
  return `${rounded.replace(/\.0$/, "")} ${unit}`;
}

function nutritionJsonLd(totals: ReturnType<typeof calculateRecipeNutrition>["totals"]) {
  const nutrition = {
    "@type": "NutritionInformation",
    calories: schemaAmount(totals.calories, "calories", 0),
    carbohydrateContent: schemaAmount(totals.carbohydrate, "g"),
    proteinContent: schemaAmount(totals.protein, "g"),
    fatContent: schemaAmount(totals.totalFat, "g"),
    fiberContent: schemaAmount(totals.dietaryFiber, "g"),
    sodiumContent: schemaAmount(totals.sodium, "mg"),
  };

  return Object.fromEntries(
    Object.entries(nutrition).filter(([, value]) => value !== undefined),
  );
}

const SingleRecipe = async ({ recipe }: SingleRecipeProps) => {
  if (!recipe) return <RecipeNotFound />;

  const comparePromptPromise = fetchFoodCompareRecipePrompt(recipe.id);
  const [{ recipeCategories, recipeMealTimes, recipeTypes }, relatedRecipes] =
    await Promise.all([
      getRecipeSidebarTaxonomy(),
      getPublicRelatedRecipes(recipe.id),
    ]);

  const totalMinutes =
    (recipe.recipeCookingTime?.prepTime || 0) +
    (recipe.recipeCookingTime?.cookTime || 0) +
    (recipe.recipeCookingTime?.restTime || 0);

  const formatTime = (minutes: number) => `PT${minutes}M`;

  const prepTime = formatTime(recipe.recipeCookingTime?.prepTime || 0);
  const cookTime = formatTime(recipe.recipeCookingTime?.cookTime || 0);
  const totalTime = formatTime(totalMinutes);

  const recipeCuisine = recipe.recipeCuisine?.map((c) => c.cuisine.title);
  const recipeUrl = absoluteUrl(recipeHref(recipe));
  const recipeImageUrl = recipe.imageUrl ? absoluteUrl(recipe.imageUrl) : undefined;

  const recipeIngredients = recipe.recipeIngredients.map((ingredient) => {
    const amount = ingredient.quantity ? String(ingredient.quantity) : "";
    const unit = ingredient.unit?.shortName || ingredient.unit?.title || "";
    const form = ingredient.ingredientForm?.name;

    return [amount, unit, form, ingredient.ingredient.name]
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  });

  const recipeMethods = recipe.recipeMethods.map((method, index) => {
    const stepImage = method.imageUrl ? absoluteUrl(method.imageUrl) : recipeImageUrl;
    const stepVideo = method.videoUrl
      ? {
          "@type": "VideoObject",
          name: method.title,
          description: stripHtml(method.description || method.title),
          contentUrl: absoluteUrl(method.videoUrl),
          thumbnailUrl: [stepImage || recipeImageUrl].filter(Boolean),
          uploadDate: recipeContentUpdatedAt(recipe) || recipePublishedAt(recipe),
        }
      : undefined;

    return {
      "@type": "HowToStep",
      position: method.position || index + 1,
      name: method.title,
      text: stripHtml(method.description || method.title),
      url: `${recipeUrl}#recipe-step-${method.id}`,
      ...(stepImage ? { image: stepImage } : {}),
      ...(stepVideo ? { video: stepVideo } : {}),
    };
  });
  const approvedReviews = (recipe.Review || []).filter((review) => review.isPublished);
  const averageRating = approvedReviews.length
    ? approvedReviews.reduce((sum, review) => sum + review.rating, 0) /
      approvedReviews.length
    : 0;

  const { totals: nutritionTotals, missingConversions } = calculateRecipeNutrition(
    recipe.recipeIngredients
  );
  const hasVerifiedNutrition =
    recipe.recipeIngredients.length > 0 &&
    recipe.recipeIngredients.every((item) => item.ingredient.isPublished) &&
    missingConversions.length === 0;
  const recipeVideo = recipe.recipeMethods.find((method) => method.videoUrl);

  const jsonLdData = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    "@id": `${recipeUrl}#recipe`,
    url: recipeUrl,
    mainEntityOfPage: recipeUrl,
    name: recipe.title,
    description: seoDescription(
      recipe.metaDescription,
      recipeDescriptionFallback(recipe),
    ),
    image: recipeImageUrl ? [recipeImageUrl] : undefined,
    ...(recipeVideo?.videoUrl
      ? {
          video: {
            "@type": "VideoObject",
            name: recipeVideo.title || recipe.title,
            description: stripHtml(recipeVideo.description || recipe.title),
            contentUrl: absoluteUrl(recipeVideo.videoUrl),
            thumbnailUrl: [
              recipeVideo.imageUrl ? absoluteUrl(recipeVideo.imageUrl) : recipeImageUrl,
            ].filter(Boolean),
            uploadDate: recipeContentUpdatedAt(recipe) || recipePublishedAt(recipe),
          },
        }
      : {}),
    author: {
      "@type": "Person",
      name: recipeAuthorProfile.name,
      jobTitle: recipeAuthorProfile.role,
      description: recipeAuthorProfile.intro,
      url: absoluteUrl(recipeAuthorProfile.url),
      sameAs: socialSameAs,
      worksFor: {
        "@type": "Organization",
        name: recipeAuthorProfile.brand,
        url: absoluteUrl("/"),
      },
    },
    publisher: {
      "@type": "Organization",
      name: recipeAuthorProfile.brand,
      url: absoluteUrl("/"),
      sameAs: socialSameAs,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/pwa/icon-512.png"),
      },
    },
    editor: {
      "@type": "Person",
      name: recipeAuthorProfile.name,
      jobTitle: recipeAuthorProfile.role,
      url: absoluteUrl(recipeAuthorProfile.url),
    },
    contributor: {
      "@type": "Organization",
      name: recipeAuthorProfile.kitchen,
      url: absoluteUrl(recipeAuthorProfile.url),
    },
    creditText: `Tested by ${recipeAuthorProfile.kitchen}`,
    datePublished: recipePublishedAt(recipe),
    dateModified: recipeContentUpdatedAt(recipe),
    prepTime: prepTime,
    cookTime: cookTime,
    totalTime: totalTime,
    recipeYield: "1 serving",
    recipeCategory: recipe.RecipeCategories?.name || "General",
    recipeCuisine: recipeCuisine?.length ? recipeCuisine : ["Global"],
    recipeIngredient: recipeIngredients || [],
    recipeInstructions: recipeMethods || [],
    keywords: [
      recipe.title,
      `${recipe.title} recipe`,
      "easy recipe",
      "homemade recipe",
      ...(recipe.recipeDietType ?? []).map(({ dietType }) => dietType.title),
    ]
      .filter(Boolean)
      .join(", "),
    ...(approvedReviews.length
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: averageRating.toFixed(1),
            reviewCount: approvedReviews.length,
            bestRating: 5,
            worstRating: 1,
          },
          review: approvedReviews.slice(0, 8).map((review) => ({
            "@type": "Review",
            author: {
              "@type": "Person",
              name: review.user?.name || "Kya Khayen user",
            },
            datePublished: review.createdAt,
            reviewBody: review.comment,
            reviewRating: {
              "@type": "Rating",
              ratingValue: review.rating,
              bestRating: 5,
              worstRating: 1,
            },
          })),
        }
      : {}),
    ...(hasVerifiedNutrition
      ? {
          nutrition: nutritionJsonLd(nutritionTotals),
        }
      : {}),
  };
  const breadcrumbSchema = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Recipes", path: "/recipes" },
    {
      name: recipe.RecipeCategories?.name || "Recipe",
      path: recipe.RecipeCategories?.slug
        ? recipeCollectionHref(recipe.RecipeCategories.slug)
        : "/recipes",
    },
    { name: recipe.title, path: recipeHref(recipe) },
  ]);
  const faqSchema = faqJsonLdFromRecipeGuide(recipe);

  return (
    <div className="recipe-page-body relative w-full overflow-x-clip pb-28 pt-5 sm:pt-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd([jsonLdData, breadcrumbSchema, faqSchema]) }}
      />
      <Container>
        <BannerCard recipe={recipe} className="mb-8" />
        <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-8">
            <Suspense fallback={null}>
              <RecipeComparePromptSlot promptPromise={comparePromptPromise} />
            </Suspense>
            <RecipeDetails recipe={recipe} relatedRecipes={relatedRecipes} />
            <RecipeAuthorTrust recipe={recipe} />
            <Suspense fallback={null}>
              <RecipeComparePromptSlot
                promptPromise={comparePromptPromise}
                variant="nutrition"
              />
            </Suspense>
            <RecipeReactions recipeId={recipe.id} />
            <RecipeReviewsSection
              recipeId={recipe.id}
              reviews={recipe?.Review || []}
            />
            <RecipeCommentSection
              recipeId={recipe.id}
              comments={recipe.recipeComments || []}
            />
          </div>

          <RecipeSidebar
            recipeCategories={recipeCategories}
            recipeMealTimes={recipeMealTimes}
            recipeTypes={recipeTypes}
          />
        </div>

        <div id="recipe-related-recipes" className="mt-12">
          <RelatedRecipeSlider recipes={relatedRecipes} />
        </div>
      </Container>
      <RecipeCookingDock
        title={recipe.title}
        defaultTimerMinutes={totalMinutes || 10}
      />
    </div>
  );
};

export default SingleRecipe;
