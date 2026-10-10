import { slugify } from "./slugify";

const LOWERCASE_WORDS = new Set(["a", "an", "and", "for", "in", "of", "or", "the", "to", "with"]);
const PRESERVED_WORDS = new Map([
  ["abc", "ABC"],
  ["bbq", "BBQ"],
  ["pcod", "PCOD"],
]);
const LOW_VALUE_KEYWORDS = new Set([
  "cooking-oil",
  "oil",
  "rock-salt",
  "salt",
  "salt-table",
  "water",
]);

export type RecipeSeoSource = {
  id: string;
  title: string;
  slug: string;
  keywords: string[];
};

export type RecipeSeoUpdate = {
  id: string;
  previousTitle: string;
  previousSlug: string;
  title: string;
  slug: string;
};

export type RecipeSeoPlan = {
  updates: RecipeSeoUpdate[];
  unresolved: string[];
};

function titleCaseWord(word: string, index: number, wordCount: number) {
  const lower = word.toLowerCase();
  const preserved = PRESERVED_WORDS.get(lower);

  if (preserved) {
    return preserved;
  }

  if (index > 0 && index < wordCount - 1 && LOWERCASE_WORDS.has(lower)) {
    return lower;
  }

  return lower.replace(/(^|[-/(])([a-z])/g, (_, prefix: string, letter: string) =>
    `${prefix}${letter.toUpperCase()}`
  );
}

export function normalizeRecipeTitle(value: string) {
  const cleaned = value
    .replace(/[–—]/g, "-")
    .replace(/[_]+/g, " ")
    .replace(/\bwith\s+out\b/gi, "without")
    .replace(/\bbottle\s*gourd\b/gi, "bottle gourd")
    .replace(/\bbaby\s*corn\b/gi, "baby corn")
    .replace(/\bbuck\s+wheat\b/gi, "buckwheat")
    .replace(/\bkala\s*chana\b/gi, "kala chana")
    .replace(/\bwater\s+melon\b/gi, "watermelon")
    .replace(/\bbrown\s*rice\b/gi, "brown rice")
    .replace(/\s*[- ]+(customer|custom|darshna|me)\s*$/i, "")
    .replace(/\s+\d+\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();

  const words = cleaned.split(" ").filter(Boolean);
  return words.map((word, index) => titleCaseWord(word, index, words.length)).join(" ");
}

function keywordSlugs(record: RecipeSeoSource, baseSlug: string) {
  const values = record.keywords
    .map((keyword) => slugify(keyword))
    .filter(
      (keyword) =>
        keyword &&
        !/^\d+$/.test(keyword) &&
        !LOW_VALUE_KEYWORDS.has(keyword) &&
        keyword !== baseSlug &&
        !baseSlug.startsWith(`${keyword}-`) &&
        !baseSlug.endsWith(`-${keyword}`)
    );
  const unique = [...new Set(values)];
  const single = unique.map((keyword) => `${baseSlug}-${keyword}`);
  const pairs: string[] = [];

  for (let first = 0; first < unique.length; first += 1) {
    for (let second = first + 1; second < unique.length; second += 1) {
      pairs.push(`${baseSlug}-${unique[first]}-${unique[second]}`);
    }
  }

  return [...new Set([...single, ...pairs])];
}

function allocateDistinctSlugs(
  records: RecipeSeoSource[],
  baseSlug: string,
  reserved: Set<string>
): Map<string, string> | null {
  const candidates = new Map(
    records.map((record) => [
      record.id,
      keywordSlugs(record, baseSlug).filter((candidate) => !reserved.has(candidate)),
    ])
  );
  const ordered = [...records].sort(
    (left, right) =>
      (candidates.get(left.id)?.length ?? 0) - (candidates.get(right.id)?.length ?? 0) ||
      left.id.localeCompare(right.id)
  );
  const assigned = new Map<string, string>();

  function visit(index: number): boolean {
    if (index === ordered.length) {
      return true;
    }

    const record = ordered[index];
    for (const candidate of candidates.get(record.id) ?? []) {
      if (reserved.has(candidate) || [...assigned.values()].includes(candidate)) {
        continue;
      }
      assigned.set(record.id, candidate);
      if (visit(index + 1)) {
        return true;
      }
      assigned.delete(record.id);
    }

    return false;
  }

  return visit(0) ? assigned : null;
}

export function buildRecipeSeoPlan(records: RecipeSeoSource[]): RecipeSeoPlan {
  const normalized = records.map((record) => {
    const title = normalizeRecipeTitle(record.title);
    return { ...record, title, baseSlug: slugify(title) || "recipe" };
  });
  const groups = new Map<string, typeof normalized>();

  normalized.forEach((record) => {
    const existing = groups.get(record.baseSlug) ?? [];
    existing.push(record);
    groups.set(record.baseSlug, existing);
  });

  const reserved = new Set<string>();
  const desiredSlugs = new Map<string, string>();
  const unresolved: string[] = [];

  for (const [baseSlug, group] of groups) {
    if (group.length === 1) {
      reserved.add(baseSlug);
      desiredSlugs.set(group[0].id, baseSlug);
    }
  }

  for (const [baseSlug, group] of groups) {
    if (group.length === 1) {
      continue;
    }

    const allocation = allocateDistinctSlugs(group, baseSlug, reserved);
    if (!allocation) {
      unresolved.push(
        `"${group[0].title}" has ${group.length} records without enough distinct SEO keywords.`
      );
      continue;
    }

    for (const [id, slug] of allocation) {
      reserved.add(slug);
      desiredSlugs.set(id, slug);
    }
  }

  return {
    updates: normalized.flatMap((record) => {
      const slug = desiredSlugs.get(record.id);
      return slug
        ? [{
            id: record.id,
            previousTitle: records.find((source) => source.id === record.id)?.title ?? record.title,
            previousSlug: record.slug,
            title: record.title,
            slug,
          }]
        : [];
    }),
    unresolved,
  };
}
