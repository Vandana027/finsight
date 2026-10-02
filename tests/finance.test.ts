import { describe, expect, it } from "vitest";
import * as F from "@/lib/finance/core";
import { calculators, defaultsOf } from "@/data/calculators";
import { formatCurrency } from "@/lib/format";
import { validateField } from "@/lib/validation";

describe("finance core", () => {
  it("lumpsum", () => { expect(F.lumpsum(100000, 10, 2)).toBeCloseTo(121000, 4); expect(F.lumpsum(0, 10, 5)).toBe(0); expect(F.lumpsum(1000, 0, 5)).toBe(1000); });
  it("sip", () => { expect(F.sipFV(10000, 12, 10)).toBeCloseTo(2323391, -2); expect(F.sipFV(1000, 0, 1)).toBe(12000); expect(F.sipFV(0, 12, 5)).toBe(0); });
  it("cagr", () => { expect(F.cagr(100, 200, 1)).toBeCloseTo(100, 6); expect(F.cagr(100, 100, 5)).toBeCloseTo(0, 6); expect(F.cagr(0, 100, 5)).toBeNaN(); });
  it("emi", () => { expect(F.emi(1000000, 10, 12)).toBeCloseTo(87915.89, 1); expect(F.emi(1200, 0, 12)).toBe(100); expect(F.loanBalance(500000, 9, 60, 60)).toBeCloseTo(0, 4); });
  it("fd / compound", () => { expect(F.compound(100000, 8, 1, 1)).toBeCloseTo(108000, 4); expect(F.compound(100000, 8, 1, 4)).toBeCloseTo(108243.22, 1); });
  it("rd", () => { expect(F.rd(1000, 0, 12)).toBe(12000); expect(F.rd(1000, 6, 12)).toBeGreaterThan(12000); });
  it("ppf (annual)", () => { const r = F.ppf(150000, 7.1, 15, 1); expect(r.invested).toBe(2250000); expect(r.value).toBeCloseTo(4068209, -3); });
  it("step-up equals SIP at 0% step", () => { const s = F.stepUp(10000, 0, 12, 10); expect(s.value).toBeCloseTo(F.sipFV(10000, 12, 10), 2); expect(F.stepUp(10000, 10, 12, 10).value).toBeGreaterThan(s.value); });
  it("dcf: two-stage growth, 10-year horizon", () => {
    const base = { fcf: 100, discount: 12, terminal: 4, netDebt: 0, shares: 10 };
    const flat = F.dcf({ ...base, g1: 10, g2: 10 }), lowLate = F.dcf({ ...base, g1: 10, g2: 5 });
    expect(flat.pvs).toHaveLength(10); expect(lowLate.perShare).toBeLessThan(flat.perShare);
    expect(F.dcf({ ...base, g1: 0, g2: 0, netDebt: 100 }).equity).toBeCloseTo(F.dcf({ ...base, g1: 0, g2: 0 }).equity - 100, 6);
  });
  it("retirement", () => { expect(F.retirement({ age: 30, retAge: 60, expenses: 50000, inflation: 6, ret: 10, lifeExp: 85 }).sip).toBeGreaterThan(0); });
});
describe("engine", () => {
  it("has 12 calculators, each computing defaults without error", () => {
    expect(calculators).toHaveLength(12);
    for (const c of calculators) { const r = c.compute(defaultsOf(c)); expect(r.error, c.slug).toBeUndefined(); expect(r.headline.value, c.slug).not.toContain("NaN"); }
  });
  it("formats INR and validates bounds", () => { expect(formatCurrency(125000)).toBe("₹1,25,000"); const f = calculators.find((c) => c.slug === "lumpsum")!.fields[0]; expect(validateField(f, "")).not.toBeNull(); expect(validateField(f, "-5")).not.toBeNull(); expect(validateField(f, "1000")).toBeNull(); });
});

const calc = (slug: string) => calculators.find((c) => c.slug === slug)!;
const run = (slug: string, over: Record<string, number>) => { const c = calc(slug); return c.compute({ ...defaultsOf(c), ...over }); };
const opts = (slug: string, key: string) => calc(slug).fields.find((f) => f.key === key)!.options!.map((o) => o.value);
const keys = (slug: string) => calc(slug).fields.map((f) => f.key);

describe("reference fidelity: SIP and frequency", () => {
  it("SIP offers monthly and yearly frequency, tenure up to 50 years", () => {
    expect(opts("sip", "freq")).toEqual([12, 1]); expect(calc("sip").fields.find((f) => f.key === "years")!.max).toBe(50);
  });
  it("yearly SIP uses annual periods", () => {
    expect(F.sipFV(10000, 12, 10, true, 1)).toBeCloseTo(10000 * ((Math.pow(1.12, 10) - 1) / 0.12) * 1.12, 4);
    expect(F.sipFV(10000, 12, 10, true, 12)).toBeCloseTo(F.sipFV(10000, 12, 10), 6);
    expect(run("sip", { freq: 1, amount: 10000, rate: 12, years: 10 }).headline.value).toBe(formatCurrency(F.sipFV(10000, 12, 10, true, 1)));
  });
  it("lumpsum, step-up, FD, CAGR tenure ceiling is 50 years", () => { for (const s of ["lumpsum", "step-up", "fd", "cagr"]) expect(calc(s).fields.find((f) => f.key === "years")!.max, s).toBe(50); });
});
describe("reference fidelity: goal planning", () => {
  it("goal SIP has frequency and inflation toggle; inflation input only when YES", () => {
    expect(keys("goal-sip")).toEqual(["freq", "target", "rate", "years", "adjust", "inflation"]);
    const infl = calc("goal-sip").fields.find((f) => f.key === "inflation")!;
    expect(infl.showIf!({ adjust: 0 })).toBe(false); expect(infl.showIf!({ adjust: 1 })).toBe(true);
  });
  it("goal SIP: sip × factor recovers the target (monthly and yearly)", () => {
    for (const freq of [12, 1]) { const sip = 5000000 / F.sipFV(1, 12, 10, true, freq); expect(F.sipFV(sip, 12, 10, true, freq)).toBeCloseTo(5000000, 2);
      expect(run("goal-sip", { freq, adjust: 0 }).headline.value).toBe(formatCurrency(sip)); }
  });
  it("inflation adjustment raises the required investment", () => {
    const on = 5000000 * Math.pow(1.06, 10) / F.sipFV(1, 12, 10);
    expect(run("goal-sip", { adjust: 1, inflation: 6 }).headline.value).toBe(formatCurrency(on));
    expect(on).toBeGreaterThan(5000000 / F.sipFV(1, 12, 10));
  });
});
describe("reference fidelity: compound interest", () => {
  it("offers 4 compounding and 4 regular-deposit frequencies", () => { expect(opts("compound-interest", "cf")).toEqual([12, 4, 2, 1]); expect(opts("compound-interest", "df")).toEqual([12, 4, 2, 1]); });
  it("no deposits equals the closed-form formula", () => { expect(F.compoundDeposits(100000, 8, 5, 4, 0, 12).value).toBeCloseTo(F.compound(100000, 8, 5, 4), 4); });
  it("monthly compounding with monthly deposits equals an annuity-due SIP", () => { expect(F.compoundDeposits(0, 12, 10, 12, 1000, 12).value).toBeCloseTo(F.sipFV(1000, 12, 10), 4); });
  it("Finology's example: ₹100 monthly, 10%, quarterly compounding, 10 years", () => {
    const r = F.compoundDeposits(0, 10, 10, 4, 100, 12); expect(r.invested).toBe(12000); expect(r.value).toBeGreaterThan(20000); expect(r.value).toBeLessThan(21500);
  });
  it("deposit frequency changes the result; zero rate returns invested", () => {
    expect(F.compoundDeposits(0, 8, 10, 12, 12000, 1).value).not.toBeCloseTo(F.compoundDeposits(0, 8, 10, 12, 1000, 12).value, 0);
    const z = F.compoundDeposits(1000, 0, 5, 4, 500, 4); expect(z.value).toBe(z.invested); expect(z.invested).toBe(1000 + 500 * 20);
  });
  it("rejects empty input", () => { expect(run("compound-interest", { principal: 0, dep: 0 }).error).toBeTruthy(); });
});
describe("reference fidelity: retirement", () => {
  it("retirement fields and age limits (no existing-savings input)", () => {
    expect(keys("retirement")).toEqual(["age", "retAge", "lifeExp", "ret", "expenses", "inflation"]);
    expect(calc("retirement").fields[0]).toMatchObject({ min: 18, max: 60 }); expect(calc("retirement").fields[1]).toMatchObject({ min: 40, max: 70 });
    expect(run("retirement", { age: 50, retAge: 45 }).error).toBeTruthy();
  });
});
describe("reference fidelity: DCF", () => {
  it("has the two-stage growth selects, margin of safety and market inputs", () => {
    expect(keys("dcf")).toEqual(["fcf", "discount", "g1", "g1c", "g2", "g2c", "terminal", "mcap", "price", "netDebt", "mos"]);
    expect(opts("dcf", "g1")).toEqual([5, 10, 15, 999]); expect(opts("dcf", "g2")).toEqual([5, 10, 15, 999]);
    expect(calc("dcf").fields.find((f) => f.key === "g1c")!.showIf!({ g1: 999 })).toBe(true); expect(calc("dcf").fields.find((f) => f.key === "g1c")!.showIf!({ g1: 10 })).toBe(false);
  });
  it("fair value applies margin of safety; custom growth is honoured", () => {
    const v = { fcf: 100, discount: 12, terminal: 4, netDebt: 0, mcap: 1000, price: 100 }, shares = 10;
    const iv = F.dcf({ fcf: 100, g1: 10, g2: 5, discount: 12, terminal: 4, netDebt: 0, shares }).perShare;
    expect(run("dcf", { ...v, g1: 10, g2: 5, mos: 20 }).headline.value).toBe(formatCurrency(iv * 0.8));
    const cust = F.dcf({ fcf: 100, g1: 7, g2: 3, discount: 12, terminal: 4, netDebt: 0, shares }).perShare;
    expect(run("dcf", { ...v, g1: 999, g1c: 7, g2: 999, g2c: 3, mos: 0 }).headline.value).toBe(formatCurrency(cust));
    expect(run("dcf", { ...v, discount: 4, terminal: 4 }).error).toBeTruthy();
  });
});
describe("reference fidelity: EMI", () => {
  it("EMI field order is amount, tenure, rate", () => { expect(keys("emi")).toEqual(["loan", "years", "rate"]); });
});
describe("reference fidelity: PPF", () => {
  it("has 4 deposit frequencies and tenures 15–50 in steps of 5", () => { expect(opts("ppf", "freq")).toEqual([12, 4, 2, 1]); expect(opts("ppf", "years")).toEqual([15, 20, 25, 30, 35, 40, 45, 50]); });
  it("later deposits earn less interest within a year", () => {
    const yr = F.ppf(150000, 7.1, 15, 1).value, mo = F.ppf(12500, 7.1, 15, 12).value, q = F.ppf(37500, 7.1, 15, 4).value, h = F.ppf(75000, 7.1, 15, 2).value;
    expect(yr).toBeGreaterThan(h); expect(h).toBeGreaterThan(q); expect(q).toBeGreaterThan(mo); expect(mo).toBeGreaterThan(F.ppf(12500, 7.1, 15, 12).invested);
  });
  it("monthly first-year interest: 12500 × rate/12 on a growing balance", () => {
    const b = F.ppf(12500, 12, 1, 12); let accrued = 0; for (let m = 1; m <= 12; m++) accrued += (12500 * m * 12) / 1200; expect(b.value).toBeCloseTo(150000 + accrued, 6);
  });
  it("caps yearly deposits at ₹1,50,000", () => { expect(run("ppf", { freq: 12, amount: 20000 }).error).toBeTruthy(); expect(run("ppf", { freq: 12, amount: 12500 }).error).toBeUndefined(); });
});
describe("reference fidelity: FD and RD", () => {
  it("FD compounding options start with Yearly", () => { expect(opts("fd", "freq")).toEqual([1, 2, 4, 12]); });
  it("RD tenure uses years 0–10 and months 0/3/6/9 with 6-month minimum", () => {
    expect(opts("rd", "ry")).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]); expect(opts("rd", "rm")).toEqual([0, 3, 6, 9]);
    expect(run("rd", { ry: 0, rm: 3 }).error).toBeTruthy(); expect(run("rd", { ry: 0, rm: 6 }).error).toBeUndefined();
    expect(run("rd", { monthly: 1000, rate: 0, ry: 1, rm: 6 }).headline.value).toBe(formatCurrency(18000));
  });
});
