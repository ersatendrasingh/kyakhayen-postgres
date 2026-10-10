import { ArrowRight, Search, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  GetExactRecipeSearchMatch,
  GetRecipeSearchSuggestions,
  GetSearchedArticles,
  GetSearchedRecipePage,
} from "@/actions/get-searched-recipes";
import { EditorialStoryRow } from "@/components/blogs/editorial-story-card";
import Container from "@/components/container";
import RecipeResultsFeed from "@/components/recipes/recipe-results-feed";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Search Recipes and Food Stories | Kya Khayen",
  description:
    "Search recipes and original food stories using ingredients, meal times, cuisines and kitchen questions.",
  path: "/search",
  image: "/meta-images/recipe-page.jpg",
  imageAlt: "Kya Khayen recipe and story search",
  noIndex: true,
});

const quickSearches = [
  "Paneer recipes",
  "Breakfast recipes",
  "High-protein dinner",
  "Quick lunch ideas",
  "Summer smoothies",
  "Vegetarian snacks",
];

const SearchPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ k?: string }>;
}) => {
  const { k = "" } = await searchParams;
  const query = k.trim();
  const exactMatch = await GetExactRecipeSearchMatch({ k: query });

  if (exactMatch) {
    redirect(exactMatch.href);
  }

  const [initialPage, articleMatches, relatedSuggestions] = await Promise.all([
    GetSearchedRecipePage({ k: query }),
    GetSearchedArticles({ k: query }),
    GetRecipeSearchSuggestions({ k: query }),
  ]);
  const hasResults = initialPage.recipes.length > 0 || articleMatches.length > 0;

  return (
    <div className="search-page-surface min-h-screen bg-[radial-gradient(circle_at_12%_0%,rgba(217,156,61,0.14),transparent_28rem),linear-gradient(180deg,#fffaf2,#f8eee2)] pb-20">
      <section className="search-page-hero border-b border-[#eadbc8] bg-[#fffdf8]/78 py-9 sm:py-14">
        <Container>
          <div className="mx-auto max-w-[900px] text-center">
            <p className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.26em] text-[#a67636]">
              <Sparkles className="size-3.5" /> Smart kitchen discovery
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-[#30251d] sm:text-5xl">
              Find food the way you think.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#746659] sm:text-base">
              Find a dish to cook or a food story to read, all from one search.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-2">
              {quickSearches.map((term) => (
                <Link
                  key={term}
                  href={`/search?k=${encodeURIComponent(term)}`}
                  className="cursor-pointer rounded-full border border-[#e8d8c0] bg-white/72 px-4 py-2 text-xs font-medium text-[#695545] transition hover:border-[#d49b44] hover:text-primary"
                >
                  {term}
                </Link>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <Container>
        <div className="py-9 sm:py-12">
          {query ? (
            <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#a67636]">
                  Search results
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[#30251d] sm:text-3xl">
                  {hasResults
                    ? `Fresh matches for "${query}"`
                    : `Explore another flavour`}
                </h2>
                {hasResults && (
                  <p className="mt-2 text-sm text-[#75675b]">
                    Matching recipes, ingredients, collections and original journal stories.
                  </p>
                )}
              </div>
              {relatedSuggestions.length > 0 && (
                <div className="flex max-w-xl flex-wrap gap-2 md:justify-end">
                  {relatedSuggestions.slice(0, 4).map((suggestion) => (
                    <Link
                      key={`${suggestion.kind}-${suggestion.label}`}
                      href={suggestion.href || `/search?k=${encodeURIComponent(suggestion.query)}`}
                      className="rounded-full bg-[#f1e7d7] px-3.5 py-2 text-xs font-medium text-[#604a39] transition hover:text-primary"
                    >
                      {suggestion.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="mb-9 rounded-[1.6rem] border border-[#ecddc9] bg-white/70 p-7 text-center">
              <Search className="mx-auto mb-4 size-6 text-[#bd8740]" />
              <h2 className="text-xl font-semibold">Start with a craving</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Use the search bar in the header or choose a craving to discover your next plate.
              </p>
            </div>
          )}

          {query && !hasResults && (
            <div className="rounded-[1.7rem] border border-[#ead9c3] bg-white p-8 text-center shadow-sm">
              <p className="text-lg font-semibold text-[#30251d]">
                Try a simpler food word
              </p>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#75675b]">
                Search by an ingredient like paneer or rajma, a meal such as
                breakfast, or a reading topic such as summer kitchens.
              </p>
              <Link
                href="/recipes"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white"
              >
                Browse all recipes <ArrowRight className="size-4" />
              </Link>
            </div>
          )}

          {articleMatches.length > 0 && (
            <section className="mb-12 rounded-[1.8rem] border border-[#ead9c3] bg-[#fffdf8]/80 p-5 shadow-sm sm:p-7">
              <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#a67636]">
                    From the journal
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-[#30251d]">
                    Stories related to your search
                  </h2>
                </div>
                <Link href="/blog" className="hidden text-sm font-semibold text-primary sm:inline-flex">
                  Read the journal
                </Link>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {articleMatches.map((article) => (
                  <EditorialStoryRow key={article.id} story={article} compact />
                ))}
              </div>
            </section>
          )}

          {initialPage.recipes.length > 0 && (
            <RecipeResultsFeed
              initialRecipes={initialPage.recipes}
              initialCursor={initialPage.nextCursor}
              searchQuery={query}
              eyebrow="Plates for your craving"
              heading="Choose your next meal"
            />
          )}
        </div>
      </Container>
    </div>
  );
};

export default SearchPage;
