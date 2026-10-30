import type { Prisma } from "@prisma/client";
import type { Metadata } from "next";

import {
  InterestSpotlight,
  MealPlanStory,
  SeasonalSpotlight,
} from "@/components/sections/home-discovery";
import HomeCuisineExplorer from "@/components/sections/home-cuisine-explorer";
import HomeFoodPreference from "@/components/sections/home-food-preference";
import HomeFeaturedRecipes from "@/components/sections/home-featured-recipes";
import { HomePreferenceProvider } from "@/components/sections/home-preference-context";
import PremiumHomeHero from "@/components/sections/premium-home-hero";
import LazyMembershipPromptModal from "@/components/sections/lazy-membership-prompt-modal";
import HomeEditorialStories from "@/components/sections/home-editorial-stories";
import HomeSituationTools from "@/components/sections/home-situation-tools";
import HomeSeoHubs from "@/components/sections/home-seo-hubs";
import SmartBmiCta from "@/components/sections/bmi-tool/smart-bmi-cta";
import { db } from "@/lib/db";
import {
  isExtraPrimaryIngredientValue,
  matchesSelectedPrimaryIngredient,
} from "@/lib/primary-ingredients";
import { publishedRecipeAnd, publishedRecipeWhere } from "@/lib/recipe-publication";
import {
  buildSeoMetadata,
  itemListJsonLd,
  jsonLd,
  organizationJsonLd,
  recipeHref,
  websiteJsonLd,
} from "@/lib/seo";

const cloudinaryMediaBase = "https://res.cloudinary.com/dfm6dhu3l";
const heroVideoUrls = [
  `${cloudinaryMediaBase}/video/upload/v1791615239/media/homepage/hero/20260524/hero-breakfast-prep.mp4`,
  `${cloudinaryMediaBase}/video/upload/v1791615253/media/homepage/hero/20260524/hero-food-story-02.mp4`,
  `${cloudinaryMediaBase}/video/upload/v1791615335/media/homepage/hero/20260524/hero-food-story-03.mp4`,
  `${cloudinaryMediaBase}/video/upload/v1791615347/media/homepage/hero/20260524/hero-food-story-04.mp4`,
  `${cloudinaryMediaBase}/video/upload/v1791615359/media/homepage/hero/20260524/hero-food-story-05.mp4`,
];
const seasonalEditorialImage =
  `${cloudinaryMediaBase}/image/upload/f_auto,q_auto,w_1800,c_fill/v1791615042/media/homepage/discovery/20260524/summer-green-smoothie.jpg`;
const ingredientEditorialImage = "/meta-images/recipe-page.jpg";
const summerDrinkTypeSlugs = [
  "drink-coolers-sharbat",
  "drink-smoothies",
  "drink-juices",
  "drink-shakes",
  "drink-lassi-buttermilk",
  "drink-detox",
  "drink-infusions",
] as const;
const homepageCuisineSlugs = [
  "north-indian",
  "south-indian",
  "punjabi",
  "chinese",
  "bihari",
  "rajasthani",
  "gujarati",
  "maharashtrian",
  "bengali",
  "italian",
] as const;

const homeSituationRecipeSelect = {
  id: true,
  title: true,
  slug: true,
  metaSlug: true,
  imageUrl: true,
  views: true,
  RecipeCategories: { select: { name: true, slug: true } },
  recipeCookingTime: {
    select: { prepTime: true, cookTime: true, restTime: true },
  },
  recipeNutrient: {
    where: { nutrient: { isPublished: true } },
    select: { nutrient: { select: { title: true } } },
    take: 1,
  },
  recipeIngredients: {
    select: {
      ingredient: {
        select: {
          name: true,
          slug: true,
          IngredientCategories: { select: { slug: true } },
        },
      },
    },
    take: 32,
  },
  recipeMealTime: {
    where: { mealTime: { isPublished: true } },
    select: { mealTime: { select: { title: true, slug: true } } },
    take: 4,
  },
  recipeCuisine: {
    where: { cuisine: { isPublished: true } },
    select: { cuisine: { select: { title: true, slug: true } } },
    take: 3,
  },
  recipeRecipeType: {
    where: { recipeType: { isPublished: true } },
    select: { recipeType: { select: { title: true, slug: true } } },
    take: 4,
  },
  _count: { select: { recipeIngredients: true } },
} satisfies Prisma.RecipesSelect;

type HomeSituationRecipe = Prisma.RecipesGetPayload<{
  select: typeof homeSituationRecipeSelect;
}>;

const situationMainMealPattern =
  /\b(lunch|dinner|main|meal|course|curry|sabzi|dal|rice|biryani|pulao|khichdi|roti|paratha|kulcha|thali|gravy|masala|bhurji|do pyaza|angara|kadai)\b/;
const situationLightPattern =
  /\b(snack|starter|momo|momos|roll|drink|beverage|juice|smoothie|dessert|sweet|chutney|pickle|raita|dip|salad|soup|gazpacho|water)\b/;

function normalizeSituationText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function situationMinutes(recipe: HomeSituationRecipe) {
  if (!recipe.recipeCookingTime) return 0;

  return (
    recipe.recipeCookingTime.prepTime +
    recipe.recipeCookingTime.cookTime +
    recipe.recipeCookingTime.restTime
  );
}

function situationDiscoveryText(recipe: HomeSituationRecipe) {
  return normalizeSituationText(
    [
      recipe.title,
      recipe.slug,
      recipe.RecipeCategories?.name,
      ...recipe.recipeMealTime.map((item) => item.mealTime.title),
      ...recipe.recipeMealTime.map((item) => item.mealTime.slug),
      ...recipe.recipeRecipeType.map((item) => item.recipeType.title),
      ...recipe.recipeRecipeType.map((item) => item.recipeType.slug),
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function scoreInitialSituationRecipe(recipe: HomeSituationRecipe) {
  const title = normalizeSituationText(recipe.title);
  const text = situationDiscoveryText(recipe);
  const minutes = situationMinutes(recipe);
  let score = Math.log10(Math.max(recipe.views, 0) + 10) * 80;

  if (title.includes("paneer")) score += 360;
  if (situationMainMealPattern.test(title)) score += 300;
  if (situationMainMealPattern.test(text)) score += 140;
  if (recipe.recipeMealTime.some((item) => /lunch|dinner/.test(item.mealTime.slug))) {
    score += 220;
  }
  if (situationLightPattern.test(title)) score -= 420;
  else if (situationLightPattern.test(text)) score -= 220;
  if (minutes >= 18 && minutes <= 90) score += 35;

  return score;
}

function publicInitialSituationRecipe(recipe: HomeSituationRecipe) {
  return {
    id: recipe.id,
    title: recipe.title,
    slug: recipe.slug,
    metaSlug: recipe.metaSlug,
    imageUrl: recipe.imageUrl,
    RecipeCategories: recipe.RecipeCategories,
    recipeCookingTime: recipe.recipeCookingTime,
    recipeNutrient: recipe.recipeNutrient,
    recipeIngredients: recipe.recipeIngredients,
    recipeMealTime: recipe.recipeMealTime,
    recipeCuisine: recipe.recipeCuisine,
    recipeRecipeType: recipe.recipeRecipeType,
    ingredientCount: recipe._count.recipeIngredients,
    matchLabel: "Matches Paneer",
  };
}

function homeSituationIngredientIdentity(
  recipeIngredient: HomeSituationRecipe["recipeIngredients"][number],
) {
  return `${recipeIngredient.ingredient.name} ${
    recipeIngredient.ingredient.slug ?? ""
  }`;
}

function homeSituationHasSelectedIngredientMatch(
  recipe: HomeSituationRecipe,
  selected: string[],
) {
  return recipe.recipeIngredients.some((recipeIngredient) =>
    matchesSelectedPrimaryIngredient(
      homeSituationIngredientIdentity(recipeIngredient),
      selected,
    ),
  );
}

function homeSituationHasNoExtraPrimaryIngredientMatch(
  recipe: HomeSituationRecipe,
  selected: string[],
) {
  return recipe.recipeIngredients.every((recipeIngredient) => {
    const categorySlug = recipeIngredient.ingredient.IngredientCategories?.slug;

    return !isExtraPrimaryIngredientValue(
      homeSituationIngredientIdentity(recipeIngredient),
      selected,
      categorySlug,
    );
  });
}

function isStrictHomeSituationIngredientMatch(
  recipe: HomeSituationRecipe,
  selected: string[],
) {
  return (
    homeSituationHasSelectedIngredientMatch(recipe, selected) &&
    homeSituationHasNoExtraPrimaryIngredientMatch(recipe, selected)
  );
}

function uniqueByRecipeId<T extends { id: string }>(recipes: T[]) {
  const seen = new Set<string>();

  return recipes.filter((recipe) => {
    if (seen.has(recipe.id)) return false;
    seen.add(recipe.id);
    return true;
  });
}

function pickSummerDrinkRecipes<
  T extends {
    id: string;
    recipeRecipeType?: Array<{ recipeType: { slug: string } }>;
  },
>(recipes: T[], limit = 4) {
  const picked: T[] = [];
  const seen = new Set<string>();

  for (const slug of summerDrinkTypeSlugs) {
    const recipe = recipes.find(
      (item) =>
        !seen.has(item.id) &&
        item.recipeRecipeType?.some(({ recipeType }) => recipeType.slug === slug),
    );

    if (recipe) {
      picked.push(recipe);
      seen.add(recipe.id);
    }

    if (picked.length >= limit) return picked;
  }

  for (const recipe of recipes) {
    if (!seen.has(recipe.id)) {
      picked.push(recipe);
      seen.add(recipe.id);
    }

    if (picked.length >= limit) break;
  }

  return picked;
}

export const metadata: Metadata = buildSeoMetadata({
  title: "Kya Khayen | Easy Recipes, Healthy Meal Ideas and Meal Plans",
  description:
    "Discover easy recipes, healthy meal ideas, quick breakfast inspiration, dinner recipes, seasonal dishes, meal plans and real-life kitchen situation tools with Kya Khayen.",
  path: "/",
  image: "/meta-images/home-og-2026.png",
  imageAlt: "Kya Khayen recipes and weekly meal planning",
  keywords: [
    "easy recipes",
    "healthy recipes",
    "meal ideas",
    "meal planning",
    "weekly meal plan",
    "quick recipes",
    "vegetarian recipes",
    "vegan recipes",
    "healthy dinner ideas",
    "dinner recipes",
    "fridge ingredients recipes",
    "leftover recipes",
    "budget meal ideas",
    "guest menu ideas",
  ],
});

export const revalidate = 900;

export default async function Home() {
  const now = new Date();
  const dayLabel = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    timeZone: "Asia/Kolkata",
  }).format(now);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowLabel = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    timeZone: "Asia/Kolkata",
  }).format(tomorrow);
  const [
    catalogRecipeCount,
    featuredRecipes,
    summerDrinkCandidates,
    cuisineStories,
    paneerRecipes,
    paneerSituationCandidates,
    foodPreferenceStories,
    homeArticles,
  ] = await Promise.all([
      db.recipes.count({ where: publishedRecipeWhere() }),
      db.recipes.findMany({
        where: {
          ...publishedRecipeWhere(),
          imageUrl: { not: null },
          RecipeCategories: { slug: { in: ["veg", "vegan"] } },
        },
        select: {
          id: true,
          title: true,
          slug: true,
          metaSlug: true,
          imageUrl: true,
          RecipeCategories: { select: { name: true } },
          recipeCookingTime: {
            select: { prepTime: true, cookTime: true, restTime: true },
          },
          recipeCuisine: {
            select: { cuisine: { select: { title: true } } },
            take: 1,
          },
          recipeNutrient: {
            where: { nutrient: { isPublished: true } },
            select: { nutrient: { select: { title: true } } },
            take: 1,
          },
        },
        orderBy: [
          { views: "desc" },
          { contentUpdatedAt: "desc" },
          { updatedAt: "desc" },
        ],
        take: 5,
      }),
      db.recipes.findMany({
        where: publishedRecipeAnd([
          { imageUrl: { not: null } },
          { RecipeCategories: { slug: { in: ["veg", "vegan"] } } },
          { seasonality: "SEASONAL" },
          {
            OR: [
              { recipeSeasons: { title: "Summer" } },
              { recipeSeasonTags: { some: { season: { title: "Summer" } } } },
            ],
          },
          {
            recipeRecipeType: {
              some: { recipeType: { slug: { in: [...summerDrinkTypeSlugs] } } },
            },
          },
        ]),
        select: {
          id: true,
          title: true,
          slug: true,
          metaSlug: true,
          imageUrl: true,
          RecipeCategories: { select: { name: true } },
          recipeCookingTime: {
            select: { prepTime: true, cookTime: true, restTime: true },
          },
          recipeNutrient: {
            where: { nutrient: { isPublished: true } },
            select: { nutrient: { select: { title: true } } },
            take: 1,
          },
          recipeRecipeType: {
            where: { recipeType: { slug: { in: [...summerDrinkTypeSlugs] } } },
            select: { recipeType: { select: { slug: true } } },
          },
        },
        orderBy: [
          { views: "desc" },
          { contentUpdatedAt: "desc" },
          { updatedAt: "desc" },
        ],
        take: 24,
      }),
      db.cuisines.findMany({
        where: {
          isPublished: true,
          slug: { in: [...homepageCuisineSlugs] },
        },
        select: {
          id: true,
          title: true,
          slug: true,
          imageUrl: true,
        },
        orderBy: { position: "asc" },
      }),
      db.recipes.findMany({
        where: {
          ...publishedRecipeWhere(),
          imageUrl: { not: null },
          RecipeCategories: { slug: { in: ["veg", "vegan"] } },
          OR: [
            { title: { contains: "paneer" } },
            {
              recipeIngredients: {
                some: { ingredient: { name: { contains: "paneer" } } },
              },
            },
          ],
        },
        select: {
          id: true,
          title: true,
          slug: true,
          metaSlug: true,
          imageUrl: true,
          RecipeCategories: { select: { name: true } },
          recipeCookingTime: {
            select: { prepTime: true, cookTime: true, restTime: true },
          },
          recipeNutrient: {
            where: { nutrient: { isPublished: true } },
            select: { nutrient: { select: { title: true } } },
            take: 1,
          },
        },
        orderBy: { views: "desc" },
        take: 6,
      }),
      db.recipes.findMany({
        where: {
          ...publishedRecipeWhere(),
          imageUrl: { not: null },
          RecipeCategories: { slug: { in: ["veg", "vegan"] } },
          recipeIngredients: {
            some: {
              ingredient: {
                OR: [
                  { name: { contains: "paneer" } },
                  { slug: { contains: "paneer" } },
                ],
              },
            },
          },
        },
        select: homeSituationRecipeSelect,
        orderBy: [
          { views: "desc" },
          { contentUpdatedAt: "desc" },
          { updatedAt: "desc" },
        ],
        take: 48,
      }),
      db.recipeCategories.findMany({
        where: {
          isPublished: true,
          slug: { not: "desserts" },
          recipe: { some: { ...publishedRecipeWhere(), imageUrl: { not: null } } },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          imageUrl: true,
          recipe: {
            where: { ...publishedRecipeWhere(), imageUrl: { not: null } },
            select: {
              id: true,
              title: true,
              slug: true,
              metaSlug: true,
              imageUrl: true,
              RecipeCategories: { select: { name: true } },
              recipeCookingTime: {
                select: { prepTime: true, cookTime: true, restTime: true },
              },
              recipeNutrient: {
                where: { nutrient: { isPublished: true } },
                select: { nutrient: { select: { title: true } } },
                take: 1,
              },
            },
            orderBy: { views: "desc" },
            take: 6,
          },
        },
        orderBy: { position: "asc" },
      }),
      db.post.findMany({
        where: { isPublished: true, imageUrl: { not: null } },
        select: {
          id: true,
          title: true,
          metaDescription: true,
          imageUrl: true,
          slug: true,
          metaSlug: true,
          updatedAt: true,
          PostCategory: {
            select: { category: { select: { title: true, slug: true } } },
          },
          PostTag: {
            select: { tag: { select: { title: true, slug: true } } },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 4,
      }),
    ]);
  const summerRecipes = pickSummerDrinkRecipes(summerDrinkCandidates);
  const initialSituationIngredients = ["paneer"];
  const strictPaneerSituationCandidates = paneerSituationCandidates.filter(
    (recipe) =>
      isStrictHomeSituationIngredientMatch(recipe, initialSituationIngredients),
  );
  const initialSituationRecipes = [...strictPaneerSituationCandidates]
    .sort(
      (left, right) =>
        scoreInitialSituationRecipe(right) - scoreInitialSituationRecipe(left),
    )
    .slice(0, 6)
    .map(publicInitialSituationRecipe);

  const recipeListSchema = itemListJsonLd(
    "Featured recipes from Kya Khayen",
    featuredRecipes.map((recipe) => ({
      name: recipe.title,
      path: recipeHref(recipe),
      image: recipe.imageUrl,
    })),
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd([organizationJsonLd(), websiteJsonLd()]),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(recipeListSchema),
        }}
      />
      <PremiumHomeHero
        catalogRecipeCount={catalogRecipeCount}
        videoUrls={heroVideoUrls}
      />
      <LazyMembershipPromptModal />
      <HomeSeoHubs />
      <HomePreferenceProvider defaultPreference="veg">
        <div className="home-page-body relative isolate overflow-hidden">
          <HomeSituationTools
            initialRecipePage={{
              recipes: initialSituationRecipes,
              total: strictPaneerSituationCandidates.length,
              page: 0,
              pageSize: 6,
              hasNext: strictPaneerSituationCandidates.length > 6,
              hasPrevious: false,
            }}
          />
          <SmartBmiCta variant="home" />
          <HomeFeaturedRecipes recipes={featuredRecipes} />
          <SeasonalSpotlight
            recipes={summerRecipes}
            editorialImage={seasonalEditorialImage}
          />
          <HomeCuisineExplorer
            cuisines={cuisineStories.map((cuisine) => ({
              id: cuisine.id,
              title: cuisine.title,
              slug: cuisine.slug,
              imageUrl: cuisine.imageUrl || null,
              recipes: [],
            }))}
          />
          <InterestSpotlight
            recipes={paneerRecipes}
            editorialImage={ingredientEditorialImage}
          />
          <HomeEditorialStories articles={homeArticles} />
          <HomeFoodPreference
            preferences={foodPreferenceStories.map((preference) => {
              const veganRecipes =
                foodPreferenceStories.find((item) => item.slug === "vegan")
                  ?.recipe ?? [];
              const recipes =
                preference.slug === "veg"
                  ? uniqueByRecipeId([...preference.recipe, ...veganRecipes])
                  : preference.recipe;

              return {
                id: preference.id,
                name: preference.name,
                slug: preference.slug,
                imageUrl: preference.imageUrl || recipes[0]?.imageUrl || null,
                recipes,
              };
            })}
          />
          <MealPlanStory
            recipes={paneerRecipes.length > 0 ? paneerRecipes : summerRecipes}
            fallbackDayLabel={dayLabel}
            fallbackTomorrowLabel={tomorrowLabel}
          />
        </div>
      </HomePreferenceProvider>
    </>
  );
}
