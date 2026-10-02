import type { Calc } from "@/types/calculators";
import { content } from "@/data/content";

/** Every word of the query must appear somewhere in the calculator's title, summary, category or keywords. */
export function searchCalculators(list: Calc[], query: string, category = "All"): Calc[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return list.filter((c) => {
    if (category !== "All" && c.category !== category) return false;
    const haystack = `${c.title} ${c.short} ${c.category} ${c.slug.replace(/-/g, " ")} ${content[c.slug]?.keywords.join(" ") ?? ""}`.toLowerCase();
    return words.every((w) => haystack.includes(w));
  });
}

/** Hand-picked related calculators for a page, in the order defined in data/content.ts. Unknown slugs are ignored. */
export function relatedCalculators(list: Calc[], calc: Calc): Calc[] {
  return (content[calc.slug]?.related ?? []).flatMap((slug) => list.filter((c) => c.slug === slug));
}
