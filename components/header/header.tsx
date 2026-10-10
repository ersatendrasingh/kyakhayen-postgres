import MobileHeader from "@/components/header/mobile-header";
import DesktopHeader from "@/components/header/desktop-header";
import type { MenuLink, SeasonNavItem } from "@/components/header/navbar";
import { db } from "@/lib/db";
import { recipeCollectionHref } from "@/lib/recipe-collection-url";
import { unstable_cache } from "next/cache";

type DrinkRecipe = {
  imageUrl: string | null;
};

type DrinkRecipeType = {
  title: string;
  slug: string;
  imageUrl: string | null;
  _count: { recipeRecipeType: number };
  recipeRecipeType: { recipe: DrinkRecipe }[];
};

const drinkMenuConfig = [
  {
    title: "Teas",
    slug: "drink-teas",
    description: "green, ginger and tulsi teas",
  },
  {
    title: "Infusions",
    slug: "drink-infusions",
    description: "herbal water and warm infusions",
  },
  {
    title: "Juices",
    slug: "drink-juices",
    description: "fresh fruit and vegetable juices",
  },
  {
    title: "Coolers & Sharbat",
    slug: "drink-coolers-sharbat",
    description: "panna, sharbat, lemonade and spiced waters",
  },
  {
    title: "Smoothies",
    slug: "drink-smoothies",
    description: "fruit, oats and seed smoothies",
  },
  {
    title: "Shakes",
    slug: "drink-shakes",
    description: "milk and plant-based shakes",
  },
  {
    title: "Lassi & Buttermilk",
    slug: "drink-lassi-buttermilk",
    description: "curd-based summer drinks",
  },
  {
    title: "Detox Drinks",
    slug: "drink-detox",
    description: "alkaline and cleansing drinks",
  },
  {
    title: "Hot Sips",
    slug: "drink-hot-sips",
    description: "warming cardamom and basil sips",
  },
] as const;

const drinkTypeSlugs = [
  "beveragesmoothie",
  ...drinkMenuConfig.map((item) => item.slug),
];

function getCurrentSeason(date = new Date()): SeasonNavItem {
  const month = date.getMonth() + 1;

  if (month >= 3 && month <= 6) {
    return {
      title: "Summer",
      slug: "summer",
      href: recipeCollectionHref("summer"),
      imageUrl: "/assets/images/smoothie.png",
      description: "Cooling summer recipes",
    };
  }

  if (month >= 7 && month <= 10) {
    return {
      title: "Rainy",
      slug: "rainy",
      href: recipeCollectionHref("rainy"),
      imageUrl: "/meta-images/recipe-page.jpg",
      description: "Monsoon-friendly recipes",
    };
  }

  return {
    title: "Winter",
    slug: "winter",
    href: recipeCollectionHref("winter"),
    imageUrl: "/meta-images/recipe-page.jpg",
    description: "Warm winter recipes",
  };
}

function buildDrinkItems(drinkRecipeTypes: DrinkRecipeType[]): MenuLink[] {
  const typeBySlug = new Map(drinkRecipeTypes.map((type) => [type.slug, type]));
  const beverageType = typeBySlug.get("beveragesmoothie");
  const firstDrinkImage =
    beverageType?.imageUrl ||
    beverageType?.recipeRecipeType.find((item) => item.recipe.imageUrl)?.recipe.imageUrl ||
    null;
  const countFor = (type?: DrinkRecipeType) => type?._count.recipeRecipeType ?? 0;
  const imageFor = (type?: DrinkRecipeType) =>
    type?.imageUrl ||
    type?.recipeRecipeType.find((item) => item.recipe.imageUrl)?.recipe.imageUrl ||
    firstDrinkImage;

  const focusedItems = drinkMenuConfig
    .map((item) => {
      const type = typeBySlug.get(item.slug);

      return {
        title: item.title,
        href: recipeCollectionHref(item.slug),
        imageUrl: imageFor(type),
        description: item.description,
        count: countFor(type),
      };
    })
    .filter((item) => item.count > 0);

  return [
    {
      title: beverageType?.title || "All Drinks",
      href: recipeCollectionHref("beveragesmoothie"),
      imageUrl: firstDrinkImage,
      description: "Smoothies, teas, juices and everyday beverages",
      count: countFor(beverageType),
    },
    ...focusedItems,
  ];
}

const getHeaderNavigationData = unstable_cache(
  async () => {
    const [mealTimes, cuisines, categories, recipeTypes, dietTypes, drinkRecipeTypes] =
      await Promise.all([
        db.mealTimes.findMany({
          where: {
            isPublished: true,
            recipeMealTime: {
              some: { recipe: { isPublished: true, imageUrl: { not: null } } },
            },
          },
          select: { title: true, slug: true, imageUrl: true },
          orderBy: { position: "asc" },
        }),
        db.cuisines.findMany({
          where: {
            isPublished: true,
            recipeCuisine: {
              some: { recipe: { isPublished: true, imageUrl: { not: null } } },
            },
          },
          select: {
            title: true,
            slug: true,
            imageUrl: true,
            _count: { select: { recipeCuisine: true } },
          },
          orderBy: { title: "asc" },
        }),
        db.recipeCategories.findMany({
          where: {
            isPublished: true,
            slug: { not: "desserts" },
            recipe: { some: { isPublished: true, imageUrl: { not: null } } },
          },
          select: { name: true, slug: true, imageUrl: true },
          orderBy: { position: "asc" },
        }),
        db.recipeTypes.findMany({
          where: {
            isPublished: true,
            slug: { notIn: drinkTypeSlugs },
            recipeRecipeType: {
              some: { recipe: { isPublished: true, imageUrl: { not: null } } },
            },
          },
          select: {
            title: true,
            slug: true,
            imageUrl: true,
            recipeRecipeType: {
              where: { recipe: { isPublished: true, imageUrl: { not: null } } },
              select: { recipe: { select: { imageUrl: true } } },
              take: 1,
            },
          },
          orderBy: { position: "asc" },
          take: 8,
        }),
        db.dietTypes.findMany({
          where: {
            isPublished: true,
            recipeDietType: {
              some: { recipe: { isPublished: true, imageUrl: { not: null } } },
            },
          },
          select: { title: true, slug: true, imageUrl: true },
          orderBy: { position: "asc" },
          take: 8,
        }),
        db.recipeTypes.findMany({
          where: {
            isPublished: true,
            slug: { in: drinkTypeSlugs },
          },
          select: {
            title: true,
            slug: true,
            imageUrl: true,
            _count: {
              select: {
                recipeRecipeType: {
                  where: { recipe: { isPublished: true, imageUrl: { not: null } } },
                },
              },
            },
            recipeRecipeType: {
              where: { recipe: { isPublished: true, imageUrl: { not: null } } },
              select: { recipe: { select: { imageUrl: true } } },
              orderBy: { recipe: { contentUpdatedAt: "desc" } },
              take: 1,
            },
          },
          orderBy: { position: "asc" },
        }),
      ]);

    const orderedCuisines = [...cuisines].sort((left, right) => {
      if (left.slug === "north-indian") return -1;
      if (right.slug === "north-indian") return 1;

      return (
        right._count.recipeCuisine - left._count.recipeCuisine ||
        left.title.localeCompare(right.title)
      );
    });
    const mappedRecipeTypes = recipeTypes.map((type) => ({
      title: type.title,
      slug: type.slug,
      imageUrl: type.imageUrl || type.recipeRecipeType[0]?.recipe.imageUrl || null,
    }));
    const drinkItems = buildDrinkItems(drinkRecipeTypes);

    return {
      mealTimes,
      cuisines: orderedCuisines,
      categories,
      recipeTypes: mappedRecipeTypes,
      drinkItems,
      dietTypes,
    };
  },
  ["website-header-navigation-v1"],
  {
    revalidate: 60 * 60,
    tags: ["navigation", "recipes"],
  },
);

export const Header = async () => {
  const {
    mealTimes,
    cuisines,
    categories,
    recipeTypes,
    drinkItems,
    dietTypes,
  } = await getHeaderNavigationData();
  const currentSeason = getCurrentSeason();

  return (
    <>
      <DesktopHeader
        currentSeason={currentSeason}
        mealTimes={mealTimes}
        cuisines={cuisines}
        categories={categories}
        recipeTypes={recipeTypes}
        drinkItems={drinkItems}
        dietTypes={dietTypes}
      />
      <MobileHeader
        currentSeason={currentSeason}
        mealTimes={mealTimes}
        cuisines={cuisines}
        categories={categories}
        recipeTypes={recipeTypes}
        drinkItems={drinkItems}
        dietTypes={dietTypes}
      />
    </>
  );
};
