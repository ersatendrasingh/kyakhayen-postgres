# Recipe Content Recovery Workflow

This workflow keeps all recipes published while improving content quality in controlled nightly batches.

## Nightly Batch

Run this after the day's normal work is done:

```bash
npm run recipe:nightly-batch -- --limit=30
```

Optional:

```bash
npm run recipe:nightly-batch -- --limit=50 --pool=600 --out=docs/recipe-nightly-batches
```

The script creates:

- `docs/recipe-nightly-batches/YYYY-MM-DD.md`
- `docs/recipe-nightly-batches/YYYY-MM-DD.json`

## Batch Rules

- Keep all recipes published.
- Do not rewrite 2500 recipes manually in one pass.
- Improve 25-50 recipes per night.
- Prioritize recipes with weak descriptions, generic method text, missing meta descriptions, missing images, older `contentUpdatedAt`, and useful traffic.
- Keep category and recipe-family variety in every batch so the site does not look bulk-edited.

## Humanization Rules

Each recipe must be edited from its own ingredients, method, timing, cuisine, and serving context.

Add or improve these sections:

- Why this recipe works
- Chef tips
- Common mistakes
- Serving suggestions
- Storage instructions
- Variations
- 5-7 FAQs
- Related recipes

Avoid:

- Repeating the same paragraph structure across recipes.
- Generic lines such as "use listed ingredients" or "follow the method".
- SEO/process copy like ranking, keywords, database entry, search terms, or page strength.
- Medical claims unless separately reviewed.
- Invented steps that conflict with the existing method or ingredients.

## Manual Review Priority

Use the nightly markdown file as the editor queue.

For each recipe:

1. Open the live/admin recipe page.
2. Read the generated unique angle.
3. Rewrite the overview and weak methods using real cooking cues.
4. Add recipe-specific tips, mistakes, variations, storage, and FAQs.
5. Check related recipes are genuinely relevant.
6. Save the recipe and update `contentUpdatedAt`.
7. Spot-check the public page.

## Fast Recovery Cadence

Suggested pace:

- Week 1: 30 recipes per night, focused on traffic pages and obvious thin content.
- Week 2-4: 50 recipes per night, mixed by category.
- Ongoing: 15-25 recipes per night for maintenance.

Do not bulk overwrite content without review. The nightly batch should produce direction and prioritization; the final copy must feel specific to the recipe.
