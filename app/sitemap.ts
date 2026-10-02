import type { MetadataRoute } from "next";
import { calculators } from "@/data/calculators";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/calculators`, changeFrequency: "monthly", priority: 0.9 },
    ...calculators.map((c) => ({ url: `${SITE_URL}/calculators/${c.slug}`, changeFrequency: "monthly" as const, priority: 0.8 })),
  ];
}
