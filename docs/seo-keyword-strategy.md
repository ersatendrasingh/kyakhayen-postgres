# Kya Khayen SEO Keyword Strategy

Updated: 2026-05-30

## Positioning

Kya Khayen should not be positioned as an India-only recipe site. The public SEO layer now targets worldwide English-language recipe discovery:

- Easy recipes
- Healthy recipes
- Meal ideas
- Breakfast recipes
- Dinner ideas
- Vegetarian recipes
- Vegan recipes
- Weekly meal plans
- Personalized meal plans
- Cooking tips and kitchen guides

Regional cuisines such as North Indian and South Indian remain useful collection keywords, but they are now collection-level targets instead of the main site-wide positioning.

## Important Search Note

Google does not use the `meta keywords` tag for ranking. Keywords below are target topics for titles, descriptions, headings, body copy, internal links, structured data, and future content planning. They are also kept in Next metadata for completeness, but real ranking work comes from the visible page content and structured data.

Exact monthly search volume should be pulled from Google Search Console, Google Keyword Planner, Ahrefs, Semrush, or a similar keyword database after launch. Until that data is connected, the traffic column below is an intent-priority estimate, not a fake search-volume number.

## Page Keyword Map

| Page / template | Primary keyword family | Secondary keyword families | Intent | Traffic priority |
| --- | --- | --- | --- | --- |
| `/` homepage | easy recipes, healthy meal ideas | meal planning, weekly meal plan, vegetarian recipes, vegan recipes, breakfast recipes, dinner ideas | Broad discovery and brand entry | High |
| `/recipes` | easy recipes, healthy recipes | quick recipes, meal ideas, breakfast recipes, dinner ideas, vegetarian recipes, vegan recipes | Browse recipes | High |
| `/recipes?k=veg&type=category` | vegetarian recipes | vegetarian dinner ideas, vegetarian breakfast recipes, healthy vegetarian recipes | Collection discovery | High |
| `/recipes?k=vegan&type=category` | vegan recipes | vegan meals, healthy vegan recipes, vegan dinner ideas | Collection discovery | High |
| `/recipes?k=non-veg&type=category` | chicken recipes, meat recipes, non vegetarian recipes | dinner recipes, protein rich recipes | Collection discovery | Medium |
| `/recipes?k=eggetarian&type=category` | egg recipes | breakfast egg recipes, protein breakfast recipes | Collection discovery | Medium |
| `/recipes?k=pescetarian&type=category` | fish recipes, seafood recipes | healthy fish recipes, pescetarian meals | Collection discovery | Medium |
| `/recipes?k=beveragesmoothie&type=recipeType` | smoothie recipes, juice recipes | healthy drinks, summer drinks, breakfast smoothies | Collection discovery | High |
| `/recipes?k=breakfast&type=mealTime` | breakfast recipes | easy breakfast ideas, healthy breakfast, quick breakfast | Mealtime discovery | High |
| `/recipes?k=dinner&type=mealTime` | dinner recipes | easy dinner ideas, healthy dinner ideas, quick dinner | Mealtime discovery | High |
| Cuisine collection pages | `[cuisine] recipes` | regional recipes, authentic recipes, easy cuisine recipes | Cuisine discovery | Medium |
| Individual recipe pages | `[recipe name] recipe` | easy recipe, homemade recipe, category, cuisine, diet, recipe type | Long-tail recipe search | High |
| `/blog` | cooking tips, kitchen guides | food stories, recipe inspiration, meal planning ideas, healthy meal ideas | Editorial discovery | Medium |
| Individual article pages | article title keyword | cooking tips, food guide, category, tags | Long-tail informational search | Medium |
| `/meal-plan` | weekly meal plan | personalized meal plan, healthy meal plan, meal planner | Planning and conversion | Medium |
| `/subscription-plans` | meal plan membership | meal planning tools, weekly meal planner, personalized meal plans | Conversion research | Low to Medium |
| `/about-us` | Kya Khayen | recipe platform, meal planning brand | Trust and brand search | Low |
| `/contact-us` | Kya Khayen contact | recipe support, meal plan support | Support and trust | Low |
| `/search` | noindex internal search | search recipes, search food stories | User utility only | Noindex |
| Auth, account, admin, checkout, success pages | noindex | noindex | Private or thin utility pages | Noindex |

## Image Search And Search Result Thumbnails

Google may show images beside recipes or articles when it can understand and crawl the page image. It is not guaranteed, but eligibility is improved by:

- Recipe JSON-LD with a crawlable `image` property.
- Article JSON-LD with a crawlable `image` property.
- Open Graph and Twitter large-image metadata.
- `robots` preview rules with `max-image-preview: large`.
- Public, indexable image URLs on the CDN/S3 path.
- Real dish images that match the page content.
- Descriptive alt text and useful file names.
- Image dimensions large enough for rich results.

This has already been wired into the SEO implementation for public recipe, article, listing, and homepage surfaces.

## Implementation Summary

- Global site title changed from India-first positioning to easy recipes, meal ideas, and meal plans.
- HTML language changed to broad English with OpenGraph locale set to `en_US`.
- Homepage, recipes listing, blog listing, meal plan, and subscription pages now target global English keyword families.
- Recipe detail pages now add `[recipe name] recipe`, `easy recipe`, and `homemade recipe` to page metadata and Recipe JSON-LD.
- Article detail pages now add cooking-tip and food-guide signals to metadata and BlogPosting JSON-LD.
- Header search examples, footer popular searches, and homepage discovery chips were moved away from India-only examples.
- Internal search and private/utility pages remain noindex so SEO budget stays focused on public recipe, article, listing, and trust pages.

## Next Data Step

After launch, connect Google Search Console and track:

- Queries that trigger recipe-rich results.
- Image search impressions and clicks.
- Pages with high impressions but low CTR.
- Recipe pages indexed but missing rich result eligibility.
- Collection pages that receive impressions for broad terms like `vegetarian recipes`, `dinner recipes`, and `smoothie recipes`.

That data should decide the next title/content tuning pass instead of guessing keyword volume manually.
