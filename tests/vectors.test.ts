import { afterAll, describe, expect, it } from "vitest";
import fs from "fs";
import { calculators, defaultsOf } from "@/data/calculators";

/**
 * Numeric QA vectors.
 * src "reference-doc" = a number or formula stated on a public reference calculator page (their computed results are not published).
 * src "independent"   = expected value from an independent Python implementation (loops / amortisation schedules), not the app's closed forms.
 */
type Row = { id: string; slug: string; src: "reference-doc" | "independent"; inputs?: Record<string, number>; check: "headline" | number; expected: number | string; tol?: number; note?: string };
const num = (s: string) => parseFloat(s.replace(/[₹,%x\s]|Cr|yrs?|mo/g, ""));
const rows: Row[] = [
  { id: "lumpsum-default", slug: "lumpsum", src: "independent", check: "headline", expected: 310584.82 },
  { id: "lumpsum-reference-example", slug: "lumpsum", src: "reference-doc", inputs: { amount: 100000, rate: 15, years: 60 }, check: "headline", expected: 438399874.57, note: "Published reference example: ≈ ₹43.8 Cr for ₹1 lakh, 15%, 60 yrs" },
  { id: "sip-monthly", slug: "sip", src: "independent", inputs: { freq: 12 }, check: "headline", expected: 2323390.76 },
  { id: "sip-yearly", slug: "sip", src: "independent", inputs: { freq: 1 }, check: "headline", expected: 196545.83 },
  { id: "goal-sip-monthly", slug: "goal-sip", src: "independent", inputs: { freq: 12, adjust: 0 }, check: "headline", expected: 21520.27 },
  { id: "goal-sip-yearly", slug: "goal-sip", src: "independent", inputs: { freq: 1, adjust: 0 }, check: "headline", expected: 254393.59 },
  { id: "goal-sip-monthly-inflation", slug: "goal-sip", src: "independent", inputs: { freq: 12, adjust: 1, inflation: 6 }, check: "headline", expected: 38539.53 },
  { id: "retirement-sip", slug: "retirement", src: "independent", check: "headline", expected: 25107.44 },
  { id: "retirement-corpus", slug: "retirement", src: "independent", check: 0, expected: 57228024.74 },
  { id: "step-up-value", slug: "step-up", src: "independent", check: "headline", expected: 3374326.26 },
  { id: "step-up-invested", slug: "step-up", src: "independent", check: 0, expected: 1912490.95 },
  { id: "dcf-fair-value", slug: "dcf", src: "independent", check: "headline", expected: 171.2252604914706 * 0.8, tol: 0.51 },
  { id: "dcf-intrinsic", slug: "dcf", src: "independent", check: 0, expected: 171.23, tol: 0.51 },
  { id: "emi", slug: "emi", src: "independent", check: "headline", expected: 21695.58 },
  { id: "ppf-yearly", slug: "ppf", src: "independent", inputs: { freq: 1, amount: 150000 }, check: "headline", expected: 4068209.22 },
  { id: "ppf-monthly", slug: "ppf", src: "independent", inputs: { freq: 12, amount: 12500 }, check: "headline", expected: 3944599.22 },
  { id: "fd-quarterly", slug: "fd", src: "independent", inputs: { freq: 4 }, check: "headline", expected: 707389.1 },
  { id: "fd-yearly", slug: "fd", src: "independent", inputs: { freq: 1 }, check: "headline", expected: 701275.87 },
  { id: "fd-monthly", slug: "fd", src: "independent", inputs: { freq: 12 }, check: "headline", expected: 708812.63 },
  { id: "rd", slug: "rd", src: "independent", check: "headline", expected: 709908.2 },
  { id: "compound-with-deposits", slug: "compound-interest", src: "independent", inputs: { principal: 100000, rate: 8, years: 10, cf: 4, dep: 5000, df: 12 }, check: "headline", expected: 1138887.53 },
  { id: "compound-published-example-scenario", slug: "compound-interest", src: "independent", inputs: { principal: 0, rate: 10, years: 10, cf: 4, dep: 100, df: 12 }, check: "headline", expected: 20556.85, note: "Published example scenario (₹100/month, 10%, quarterly); the reference publishes no result for it" },
  { id: "cagr", slug: "cagr", src: "independent", check: "headline", expected: 20.11, tol: 0.006 },
];
const report: string[] = [];
describe("numeric QA vectors (FinSight vs reference)", () => {
  for (const r of rows) it(r.id, () => {
    const c = calculators.find((x) => x.slug === r.slug)!;
    const res = c.compute({ ...defaultsOf(c), ...r.inputs });
    expect(res.error, r.id).toBeUndefined();
    const shown = r.check === "headline" ? res.headline.value : res.stats[r.check].value;
    if (typeof r.expected === "string") { expect(shown).toBe(r.expected); report.push(`| ${r.id} | ${r.src} | ${r.expected} | ${shown} | exact |`); return; }
    const got = num(shown), tol = r.tol ?? 0.51;
    report.push(`| ${r.id} | ${r.src} | ${r.expected} | ${shown} | ${(got - r.expected).toFixed(4)} |`);
    expect(Math.abs(got - r.expected), `${r.id}: ${shown} vs ${r.expected}`).toBeLessThanOrEqual(tol);
  });
  it("the published ≈43.8 Cr lumpsum example is consistent with the formula", () => { expect((100000 * Math.pow(1.15, 60)) / 1e7).toBeCloseTo(43.84, 2); });
  afterAll(() => { fs.writeFileSync("docs/numeric-qa.md", `# Numeric QA vectors\n\n| Vector | Source | Expected | FinSight shows | Diff |\n|---|---|---|---|---|\n${report.sort().join("\n")}\n`); });
});

describe("edge cases: zero, minimum, maximum", () => {
  const bad = (s: string) => /NaN|Infinity|∞|undefined/.test(s);
  const check = (slug: string, over: (c: (typeof calculators)[number]) => Record<string, number>) => {
    const c = calculators.find((x) => x.slug === slug)!, res = c.compute({ ...defaultsOf(c), ...over(c) });
    const text = JSON.stringify(res);
    expect(bad(text), `${slug}: ${text.slice(0, 200)}`).toBe(false);
    return res;
  };
  for (const c of calculators) {
    it(`${c.slug}: all-minimum and all-maximum inputs give finite output or a clean message`, () => {
      for (const pick of ["min", "max"] as const) {
        const over = Object.fromEntries(c.fields.filter((f) => f.kind !== "select").map((f) => [f.key, f[pick]]));
        const res = c.compute({ ...defaultsOf(c), ...over }); expect(bad(JSON.stringify(res)), `${c.slug} ${pick}`).toBe(false);
      }
    });
  }
  it("zero rates and zero growth are valid where allowed", () => {
    expect(check("step-up", () => ({ step: 0 })).error).toBeUndefined();
    expect(check("compound-interest", () => ({ rate: 0, principal: 1000, dep: 0 })).headline.value).toBe("₹1,000");
    expect(check("compound-interest", () => ({ rate: 0, principal: 0, dep: 500, df: 12, years: 1 })).headline.value).toBe("₹6,000");
    expect(check("compound-interest", () => ({ principal: 0, dep: 0 })).error).toBeTruthy();
    expect(check("retirement", () => ({ inflation: 0 })).error).toBeUndefined();
    expect(check("retirement", () => ({ inflation: 6, ret: 6 })).error).toBeUndefined();
    expect(check("dcf", () => ({ terminal: 0, mos: 0 })).error).toBeUndefined();
  });
  it("very large values still format and compute", () => {
    expect(check("lumpsum", () => ({ amount: 1e8, rate: 30, years: 50 })).headline.value).toMatch(/^₹[\d,]+$/);
    expect(check("emi", () => ({ loan: 1e10, years: 30, rate: 30 })).headline.value).toMatch(/^₹[\d,]+$/);
  });
  it("conditional fields are hidden and ignored", () => {
    for (const [slug, key, on, off] of [["goal-sip", "inflation", { adjust: 1 }, { adjust: 0 }], ["dcf", "g1c", { g1: 999 }, { g1: 10 }], ["dcf", "g2c", { g2: 999 }, { g2: 5 }]] as const) {
      const f = calculators.find((c) => c.slug === slug)!.fields.find((x) => x.key === key)!;
      expect(f.showIf!(on as never), `${slug}.${key} on`).toBe(true); expect(f.showIf!(off as never), `${slug}.${key} off`).toBe(false);
    }
    const g = calculators.find((c) => c.slug === "goal-sip")!;
    expect(g.compute({ ...defaultsOf(g), adjust: 0, inflation: 15 }).headline.value).toBe(g.compute({ ...defaultsOf(g), adjust: 0, inflation: 0 }).headline.value);
  });
});
