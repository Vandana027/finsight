import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { calculators, CATEGORIES, defaultsOf, getCalc } from "@/data/calculators";
import { content } from "@/data/content";
import { compactINR, formatCrore, formatCurrency, formatDuration, formatNumber, formatPercent } from "@/lib/format";
import { formatEditableValue, isPlainNumber, stripGrouping } from "@/lib/input-format";
import { relatedCalculators, searchCalculators } from "@/lib/search";
import { validateField } from "@/lib/validation";
import type { Field } from "@/types/calculators";

const field = (over: Partial<Field>): Field => ({ key: "x", label: "Amount", kind: "currency", def: 1000, min: 500, max: 1e8, step: 500, ...over });
const calc = (slug: string) => getCalc(slug)!;
const run = (slug: string, over: Record<string, number> = {}) => calc(slug).compute({ ...defaultsOf(calc(slug)), ...over });

describe("formatting utilities", () => {
  it("formats rupees with Indian grouping and rounds only for display", () => {
    expect(formatCurrency(100000)).toBe("₹1,00,000"); expect(formatCurrency(12345678.4)).toBe("₹1,23,45,678"); expect(formatCurrency(0)).toBe("₹0");
    expect(formatCurrency(-2500)).toBe("-₹2,500"); expect(formatCurrency(NaN)).toBe("–"); expect(formatCurrency(Infinity)).toBe("–");
  });
  it("formats percentages, numbers, crores and durations", () => {
    expect(formatPercent(12)).toBe("12%"); expect(formatPercent(7.125, 2)).toBe("7.13%"); expect(formatNumber(1234.5678)).toBe("1,234.57"); expect(formatCrore(1234.5)).toBe("₹1,234.5 Cr");
    expect(formatDuration(147)).toBe("12 yrs 3 mo"); expect(formatDuration(12)).toBe("1 yr"); expect(formatDuration(180)).toBe("15 yrs"); expect(formatDuration(5)).toBe("5 mo"); expect(formatDuration(0)).toBe("0 mo");
    expect(compactINR(1500000)).toMatch(/15/);
  });
});

describe("public copy", () => {
  it("does not name third-party sites", () => { expect(JSON.stringify([calculators.map((c) => [c.assumptions, c.fields.map((f) => f.hint)]), content])).not.toMatch(/finology/i); });
});

describe("input parsing and validation", () => {
  it("accepts plain numbers only", () => {
    for (const ok of ["12", "12.5", ".5", "0", "-3", "10.", "1,25,000", "₹ 1,00,000"]) expect(isPlainNumber(stripGrouping(ok)), ok).toBe(true);
    for (const bad of ["1e5", "0x10", "Infinity", "abc", "12abc", "1.2.3", "--1", ""]) expect(isPlainNumber(stripGrouping(bad)), bad).toBe(false);
  });
  it("validateField reports missing, malformed, out-of-range and fractional values", () => {
    const f = field({});
    expect(validateField(f, "")).toMatch(/Enter a value/); expect(validateField(f, "   ")).toMatch(/Enter a value/);
    expect(validateField(f, "1e5")).toMatch(/valid number/); expect(validateField(f, "0x10")).toMatch(/valid number/); expect(validateField(f, "abc")).toMatch(/valid number/);
    expect(validateField(f, "499")).toMatch(/at least ₹500/); expect(validateField(f, "100000001")).toMatch(/at most/); expect(validateField(f, "₹ 1,00,000")).toBeNull();
    const yrs = field({ kind: "years", min: 1, max: 40, step: 1 });
    expect(validateField(yrs, "2.5")).toMatch(/whole number of years/); expect(validateField(yrs, "3")).toBeNull();
    expect(validateField(field({ kind: "years", min: 0.5, max: 50, step: 0.5 }), "2.5")).toBeNull();
  });
  it("formatEditableValue groups currency on blur and leaves everything else alone", () => {
    const c = field({});
    expect(formatEditableValue(c, "100000")).toBe("1,00,000"); expect(formatEditableValue(c, "1250000.5")).toBe("12,50,000.5"); expect(formatEditableValue(c, "-2500")).toBe("-2,500");
    expect(formatEditableValue(c, "1e5")).toBe("1e5"); expect(formatEditableValue(c, "abc")).toBe("abc"); expect(formatEditableValue(c, "")).toBe("");
    expect(formatEditableValue(field({ kind: "percent" }), "12.5")).toBe("12.5");
  });
  it("grouped, pasted values calculate identically to plain values", () => {
    expect(Number(stripGrouping("₹ 25,00,000"))).toBe(2500000);
  });
});

const KEPT = ["sip", "lumpsum", "step-up", "cagr", "compound-interest", "dcf", "fd", "rd", "ppf", "goal-sip", "retirement", "emi"];
const REMOVED = ["goal-lumpsum", "time-duration-one-time", "time-duration-regular", "investment-planner", "stock-vs-fd", "children-education", "education-loan-emi", "gst", "gratuity"];
const REMOVED_WORDS = ["gst", "gratuity", "education loan", "investment planner", "stock market", "children education", "time duration", "goal planning – lumpsum", "moratorium", "hsn"];

describe("catalogue: exactly 12 calculators", () => {
  it("has exactly the 12 expected slugs, in product order, each uniquely slugged and titled", () => {
    expect(calculators).toHaveLength(12); expect(calculators.map((c) => c.slug)).toEqual(KEPT);
    expect(new Set(calculators.map((c) => c.slug)).size).toBe(12); expect(new Set(calculators.map((c) => c.title)).size).toBe(12);
  });
  it("does not contain any removed calculator", () => {
    for (const s of REMOVED) { expect(getCalc(s), s).toBeUndefined(); expect(calculators.map((c) => c.slug), s).not.toContain(s); expect(content[s], s).toBeUndefined(); }
  });
  it("uses the Invest / Save / Plan / Borrow categories with no empty category", () => {
    expect(CATEGORIES).toEqual(["Invest", "Save", "Plan", "Borrow"]);
    const by = (cat: string) => calculators.filter((c) => c.category === cat).map((c) => c.slug);
    expect(by("Invest")).toEqual(["sip", "lumpsum", "step-up", "cagr", "compound-interest", "dcf"]); expect(by("Save")).toEqual(["fd", "rd", "ppf"]);
    expect(by("Plan")).toEqual(["goal-sip", "retirement"]); expect(by("Borrow")).toEqual(["emi"]);
    for (const cat of CATEGORIES) expect(by(cat).length, cat).toBeGreaterThan(0);
    for (const c of calculators) expect(CATEGORIES, c.slug).toContain(c.category);
  });
  it("gives every calculator editorial content, and no content exists for anything else", () => {
    for (const c of calculators) { expect(content[c.slug], c.slug).toBeDefined(); expect(content[c.slug].about.length, c.slug).toBeGreaterThan(40); expect(content[c.slug].faq.a.length).toBeGreaterThan(30); expect(c.slug).toMatch(/^[a-z]+(-[a-z]+)*$/); }
    expect(Object.keys(content).sort()).toEqual([...KEPT].sort());
  });
  it("derives counts from the data instead of hard-coding them in the UI", () => {
    const walk = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : /\.(ts|tsx)$/.test(e.name) ? [path.join(d, e.name)] : []));
    for (const f of ["app", "components"].flatMap((d) => walk(path.join(process.cwd(), d)))) expect(fs.readFileSync(f, "utf8"), f).not.toMatch(/\b(12|21|twelve|twenty-one) calculators\b/i);
  });
});

describe("routes, sitemap and search", () => {
  it("has the shared dynamic route and supporting route files", () => {
    for (const p of ["app/page.tsx", "app/calculators/page.tsx", "app/calculators/[slug]/page.tsx", "app/not-found.tsx", "app/error.tsx", "app/sitemap.ts", "app/robots.ts", "app/icon.svg"]) expect(fs.existsSync(path.join(process.cwd(), p)), p).toBe(true);
    expect(getCalc("nope")).toBeUndefined(); expect(getCalc("")).toBeUndefined();
  });
  it("generates static params for exactly the 12 calculators", async () => {
    const page = await import("@/app/calculators/[slug]/page");
    expect((await page.generateStaticParams()).map((p: { slug: string }) => p.slug)).toEqual(KEPT); expect(page.dynamicParams).toBe(false);
  });
  it("lists only the home page, the catalogue and the 12 calculators in the sitemap", async () => {
    const sitemap = (await import("@/app/sitemap")).default;
    const urls = sitemap().map((e) => e.url.replace(/^https?:\/\/[^/]+/, ""));
    expect(urls).toEqual(["/", "/calculators", ...KEPT.map((s) => `/calculators/${s}`)]);
    for (const s of REMOVED) expect(urls.join(" ")).not.toContain(s);
  });
  it("search is case-insensitive, trims, matches partial words, slugs and keywords", () => {
    const hits = (q: string, cat = "All") => searchCalculators(calculators, q, cat).map((c) => c.slug);
    expect(hits(" SIP ")).toContain("sip"); expect(hits("sip")).toEqual(expect.arrayContaining(["sip", "goal-sip", "step-up"])); expect(hits("SIP Calculator")).toContain("sip");
    expect(hits("emi")).toEqual(["emi"]); expect(hits("PPF")).toEqual(["ppf"]); expect(hits("provident")).toEqual(["ppf"]); expect(hits("home loan")).toEqual(["emi"]); expect(hits("goal sip")).toEqual(["goal-sip"]);
    expect(hits("zzzz")).toEqual([]); expect(hits("")).toEqual(KEPT);
    expect(hits("", "Borrow")).toEqual(["emi"]); expect(hits("", "Save")).toEqual(["fd", "rd", "ppf"]); expect(hits("sip", "Borrow")).toEqual([]);
  });
  it("never finds a removed calculator by name, slug or keyword", () => {
    for (const w of [...REMOVED, ...REMOVED_WORDS]) for (const cat of ["All", ...CATEGORIES]) expect(searchCalculators(calculators, w, cat).map((c) => c.slug), `${w} in ${cat}`).toEqual([]);
  });
});

describe("related calculators", () => {
  const rel = (slug: string) => relatedCalculators(calculators, getCalc(slug)!).map((c) => c.slug);
  it("uses the hand-picked lists for the key calculators", () => {
    expect(rel("sip")).toEqual(["lumpsum", "step-up", "goal-sip", "compound-interest"]); expect(rel("lumpsum")).toEqual(["sip", "cagr", "compound-interest"]);
    expect(rel("cagr")).toEqual(["lumpsum", "sip", "dcf"]); expect(rel("fd")).toEqual(["rd", "ppf", "compound-interest"]);
    expect(rel("retirement")).toEqual(["goal-sip", "sip", "ppf"]); expect(rel("dcf")).toEqual(["cagr", "lumpsum"]);
  });
  it("only points to existing calculators, never the page itself, never a removed one, 2–4 unique entries", () => {
    for (const c of calculators) {
      const r = rel(c.slug); expect(r.length, c.slug).toBeGreaterThanOrEqual(2); expect(r.length).toBeLessThanOrEqual(4); expect(r).not.toContain(c.slug); expect(new Set(r).size).toBe(r.length);
      expect(content[c.slug].related.length, `${c.slug} has an unknown related slug`).toBe(r.length);
      for (const s of r) { expect(KEPT).toContain(s); expect(REMOVED).not.toContain(s); }
    }
  });
});

describe("copy quality", () => {
  const text = JSON.stringify([calculators.map((c) => [c.title, c.short, c.formula, c.assumptions, c.fields.map((f) => [f.label, f.hint, f.options?.map((o) => o.label)])]), content]);
  it("has no placeholder text or stray double words", () => {
    expect(text).not.toMatch(/lorem|TODO|FIXME|coming soon|placeholder/i);
    expect(text.match(/\b(\w{3,}) \1\b/gi) ?? []).toEqual([]);
  });
  it("uses consistent return and rate labels", () => {
    const labels = calculators.flatMap((c) => c.fields.map((f) => f.label));
    expect(labels).not.toContain("Expected annual rate of return (p.a.)"); expect(labels).not.toContain("Expected return (p.a.)");
    for (const l of labels.filter((x) => /return/i.test(x))) expect(l).toMatch(/\(p\.a\.\)/);
  });
  it("every calculator has a formula, assumptions, unique title and a sentence-style summary", () => {
    expect(new Set(calculators.map((c) => c.title)).size).toBe(12);
    for (const c of calculators) { expect(c.formula.length).toBeGreaterThan(20); expect(c.assumptions.length).toBeGreaterThan(0); expect(c.short).toMatch(/\.$/); }
  });
});

describe("zero and boundary behaviour added in the audit", () => {
  it("allows a 0% return where it is a valid what-if", () => {
    expect(run("sip", { rate: 0, amount: 1000, years: 1, freq: 12 }).headline.value).toBe("₹12,000");
    expect(run("lumpsum", { rate: 0, amount: 5000 }).headline.value).toBe("₹5,000");
    expect(run("emi", { rate: 0, loan: 120000, years: 1 }).headline.value).toBe("₹10,000");
    expect(run("goal-sip", { rate: 0, target: 120000, years: 1, freq: 12, adjust: 0 }).headline.value).toBe("₹10,000");
    expect(run("step-up", { rate: 0, step: 0, sip: 1000, years: 2 }).headline.value).toBe("₹24,000");
  });
  it("age fields are whole years within sensible limits", () => {
    for (const [slug, key] of [["retirement", "age"], ["retirement", "retAge"], ["retirement", "lifeExp"]] as const) {
      const f = calc(slug).fields.find((x) => x.key === key)!; expect(f.kind, `${slug}.${key}`).toBe("years"); expect(f.step).toBe(1);
      expect(validateField(f, String(f.min + 0.5))).toMatch(/whole number/);
    }
  });
  it("no calculator shows NaN, Infinity or undefined at default, minimum or maximum inputs", () => {
    const bad = /NaN|Infinity|undefined|null/;
    for (const c of calculators) for (const pick of ["def", "min", "max"] as const) {
      const over = Object.fromEntries(c.fields.filter((f) => f.kind !== "select").map((f) => [f.key, f[pick]]));
      expect(bad.test(JSON.stringify(c.compute({ ...defaultsOf(c), ...over }))), `${c.slug} ${pick}`).toBe(false);
    }
  });
});

describe("project hygiene", () => {
  it("has no committed secrets and documents its one public env var", () => {
    const env = fs.readFileSync(path.join(process.cwd(), ".env.example"), "utf8"); expect(env).toMatch(/NEXT_PUBLIC_SITE_URL/); expect(env.split("\n").filter((l) => l && !l.startsWith("#")).join("\n")).not.toMatch(/KEY|SECRET|TOKEN|PASSWORD/i);
    expect(fs.existsSync(path.join(process.cwd(), ".env"))).toBe(false);
  });
  it("uses no dynamic code execution or raw HTML injection in source", () => {
    const walk = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? (["node_modules", ".next", "tests", "docs"].includes(e.name) ? [] : walk(path.join(d, e.name))) : /\.(ts|tsx)$/.test(e.name) ? [path.join(d, e.name)] : []));
    for (const f of ["app", "components", "lib", "data"].flatMap((d) => walk(path.join(process.cwd(), d)))) { const s = fs.readFileSync(f, "utf8"); expect(s, f).not.toMatch(/dangerouslySetInnerHTML|\beval\(|new Function\(|innerHTML/); }
  });
});
