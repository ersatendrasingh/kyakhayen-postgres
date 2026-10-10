import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Leaf, SunMedium } from "lucide-react";
import { unstable_cache } from "next/cache";

import Container from "@/components/container";
import Copyrights from "@/components/footer/copyrights";
import { SocialFollowLinks } from "@/components/social-follow-links";
import { toolPages } from "@/components/sections/situation-tools/tool-page-config";
import { db } from "@/lib/db";
import { getIngredientCollectionHubLinks } from "@/lib/ingredient-collection-hubs";
import { recipeCollectionHref } from "@/lib/recipe-collection-url";

const getFooterNavigationData = unstable_cache(
  async () => {
    const [categories, mealTimes, cuisineResults, recipeTypes] = await Promise.all([
      db.recipeCategories.findMany({
        where: {
          isPublished: true,
          slug: { not: "desserts" },
          recipe: { some: { isPublished: true } },
        },
        select: { id: true, name: true, slug: true },
        orderBy: [{ position: "asc" }, { name: "asc" }],
      }),
      db.mealTimes.findMany({
        where: {
          isPublished: true,
          recipeMealTime: { some: { recipe: { isPublished: true } } },
        },
        select: { id: true, title: true, slug: true },
        orderBy: [{ position: "asc" }, { title: "asc" }],
      }),
      db.cuisines.findMany({
        where: {
          isPublished: true,
          recipeCuisine: { some: { recipe: { isPublished: true } } },
        },
        select: {
          id: true,
          title: true,
          slug: true,
          _count: { select: { recipeCuisine: true } },
        },
        orderBy: { title: "asc" },
      }),
      db.recipeTypes.findMany({
        where: {
          isPublished: true,
          recipeRecipeType: { some: { recipe: { isPublished: true } } },
        },
        select: { id: true, title: true, slug: true },
        orderBy: [{ position: "asc" }, { title: "asc" }],
        take: 9,
      }),
    ]);
    const cuisines = cuisineResults
      .sort((left, right) => {
        if (left.slug === "north-indian") return -1;
        if (right.slug === "north-indian") return 1;
        return right._count.recipeCuisine - left._count.recipeCuisine;
      })
      .slice(0, 9);

    return { categories, mealTimes, cuisines, recipeTypes };
  },
  ["website-footer-navigation-v1"],
  {
    revalidate: 60 * 60,
    tags: ["navigation", "recipes", "articles"],
  },
);

const Footer = async () => {
  const { categories, mealTimes, cuisines, recipeTypes } =
    await getFooterNavigationData();
  const ingredientGuides = getIngredientCollectionHubLinks();
  const footerToolLinks = [
    { slug: "smart-bmi-food-guide", href: "/tools/smart-bmi-food-guide", title: "Smart BMI & Food Guide" },
    ...toolPages,
  ];

  return (
    <footer className="site-footer border-t border-border bg-[#18130f] pt-12 text-white sm:pt-16">
      <Container>
        <div className="grid grid-cols-2 gap-x-5 gap-y-8 pb-9 text-left sm:gap-x-8 sm:pb-11 lg:grid-cols-[1.7fr_.72fr_.82fr_.82fr_1fr_1fr]">
          <div className="footer-story-card relative col-span-2 min-h-[292px] overflow-hidden rounded-[1.8rem] text-left sm:min-h-[342px] lg:col-span-1">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_24%,rgba(236,191,94,0.23),transparent_42%),linear-gradient(145deg,#304d37,#12100e_72%)]" />
            <Image
              src="/assets/images/smoothie.png"
              alt="Fresh fruit smoothies and ingredients"
              fill
              sizes="(max-width: 1024px) 100vw, 360px"
              className="object-contain object-[92%_10%] p-4 opacity-100"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#130e0a] via-[#130e0a]/60 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6">
              <p className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f4cf89]">
                <Leaf className="size-3.5" /> Discover your next plate
              </p>
              <h2 className="max-w-[285px] text-2xl font-semibold leading-tight">
                Easy recipes, meal ideas and beautiful everyday inspiration.
              </h2>
              <div className="mt-5 flex flex-wrap gap-2.5">
                <Link
                  href="/recipes"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-semibold text-white"
                >
                  Explore recipes <ArrowRight className="size-3.5" />
                </Link>
                <Link
                  href={recipeCollectionHref("summer")}
                  className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2.5 text-xs font-semibold"
                >
                  <SunMedium className="size-3.5 text-[#f4cf89]" /> Summer
                </Link>
              </div>
            </div>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-[#f8d18a]">
              Explore
            </h4>
            <nav className="text-sm text-white/68">
              <Link href="/" className="mb-3 block transition-colors hover:text-white">
                Home
              </Link>
              <Link href="/recipes" className="mb-3 block transition-colors hover:text-white">
                All Recipes
              </Link>
              <Link href="/blog" className="mb-3 block transition-colors hover:text-white">
                Articles
              </Link>
              <Link href="/download-app" className="mb-3 block transition-colors hover:text-white">
                Download App
              </Link>
              <Link href="/contact-us" className="mb-3 block transition-colors hover:text-white">
                Contact Us
              </Link>
            </nav>
          </div>
          <div>
            <h5 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-[#f8d18a]">
              Preferences
            </h5>
            <nav className="text-sm text-white/68">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={recipeCollectionHref(category.slug)}
                  className="mb-3 block transition-colors hover:text-white"
                >
                  {category.name}
                </Link>
              ))}
            </nav>
          </div>
          <div>
            <h5 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-[#f8d18a]">
              Mealtimes
            </h5>
            <nav className="text-sm text-white/68">
              {mealTimes.map((mealTime) => (
                <Link
                  key={mealTime.id}
                  href={recipeCollectionHref(mealTime.slug)}
                  className="mb-3 block transition-colors hover:text-white"
                >
                  {mealTime.title}
                </Link>
              ))}
            </nav>
          </div>
          <div>
            <h5 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-[#f8d18a]">
              Cuisines
            </h5>
            <nav className="text-sm text-white/68">
              {cuisines.map((cuisine) => (
                <Link
                  key={cuisine.id}
                  href={recipeCollectionHref(cuisine.slug)}
                  className="mb-3 block transition-colors hover:text-white"
                >
                  {cuisine.title}
                </Link>
              ))}
            </nav>
          </div>
          <div>
            <h5 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-[#f8d18a]">
              Recipe ideas
            </h5>
            <nav className="text-sm text-white/68">
              {recipeTypes.map((type) => (
                <Link
                  key={type.id}
                  href={recipeCollectionHref(type.slug)}
                  className="mb-3 block transition-colors hover:text-white"
                >
                  {type.title}
                </Link>
              ))}
            </nav>
          </div>
        </div>
        <div className="mb-8 rounded-[1.5rem] border border-white/8 bg-[linear-gradient(145deg,rgba(255,255,255,0.055),rgba(255,255,255,0.02))] px-5 py-6 sm:px-7">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.23em] text-[#f8d18a]">
                Kitchen staples
              </p>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/58">
                Start from the ingredient at home and open practical recipe ideas.
              </p>
            </div>
            <Link
              href="/tools/smart-recipe-finder"
              className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-[#f8d18a] transition hover:text-white"
            >
              Search by ingredients <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
            {ingredientGuides.map((item) => (
              <Link
                key={item.slug}
                href={item.href}
                className="group relative min-h-[126px] overflow-hidden rounded-2xl border border-white/10 bg-[#17372b] transition hover:border-[#d79b42]/55"
              >
                <Image
                  src={item.imageUrl}
                  alt={`${item.label} recipes`}
                  fill
                  sizes="(max-width: 640px) 50vw, 180px"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-[#130e0a]/88 via-[#130e0a]/18 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 p-3">
                  <span className="flex items-center justify-between gap-3 text-sm font-semibold text-white group-hover:text-white">
                    {item.label}
                    <ArrowRight className="size-3.5 shrink-0 text-[#f8d18a] transition group-hover:translate-x-0.5" />
                  </span>
                  <span className="mt-1 block line-clamp-1 text-xs leading-5 text-white/68">
                    {item.description}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
        <div className="mb-8 rounded-[1.5rem] border border-white/8 bg-white/[0.025] px-5 py-6 sm:px-7">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.23em] text-[#f8d18a]">
                Cooking tools
              </p>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/58">
                Open the exact tool for the kitchen question in front of you.
              </p>
            </div>
            <Link
              href="/tools"
              className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-[#f8d18a] transition hover:text-white"
            >
              View all tools <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {footerToolLinks.map((tool) => (
              <Link
                key={tool.slug}
                href={tool.href}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white/72 transition hover:border-[#d79b42]/55 hover:text-white"
              >
                {tool.title}
              </Link>
            ))}
          </div>
        </div>
        <div className="mb-8 rounded-[1.5rem] border border-white/8 bg-white/[0.025] px-5 py-6 sm:px-7">
          <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.23em] text-[#f8d18a] md:text-left">
            Popular food searches
          </p>
          <div className="flex flex-wrap justify-center gap-2.5 md:justify-start">
            {[
              ["Vegetarian recipe ideas", recipeCollectionHref("veg")],
              ["Healthy dinner ideas", "/search?k=healthy%20dinner"],
              ["Easy breakfast recipes", "/search?k=breakfast%20recipes"],
              ["Cooling summer recipes", recipeCollectionHref("summer")],
              ["Smoothies and beverages", recipeCollectionHref("beveragesmoothie")],
              ["Quick snack recipes", recipeCollectionHref("snacks")],
            ].map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2.5 text-xs text-white/66 transition hover:border-[#d79b42]/55 hover:text-white"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-6 border-t border-white/10 py-6 md:flex-row">
          <div>
            <p className="mb-3 max-w-xl text-center text-xs leading-6 text-white/52 md:text-left">
              Kya Khayen is a KASA product. Recipe and meal-planning
              information only. Not medical, diagnosis, treatment or
              allergy-safety advice.
            </p>
            <div className="flex justify-center gap-5 text-sm text-white/58 md:justify-start">
              <Link href="/about-us" className="hover:text-white">About</Link>
              <Link href="/contact-us" className="hover:text-white">Contact</Link>
              <Link href="/subscription-plans" className="hover:text-white">Membership</Link>
              <Link href="/privacy-policy" className="hover:text-white">Privacy</Link>
              <Link href="/terms-and-conditions" className="hover:text-white">Terms</Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-white/58">Follow us</span>
            <SocialFollowLinks variant="footer" />
          </div>
        </div>
      </Container>
      <Copyrights />
    </footer>
  );
};

export default Footer;
