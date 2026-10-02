import type { Calc, Category, Field, Result } from "@/types/calculators";
import { formatCurrency as C, formatNumber as N, formatPercent as P, formatCrore, formatDuration } from "@/lib/format";
import * as F from "@/lib/finance/core";

const f = (key: string, label: string, kind: Field["kind"], def: number, min: number, max: number, step = 1, options?: Field["options"]): Field => ({ key, label, kind, def, min, max, step, options });
const amt = (key: string, label: string, def: number, min = 1000, max = 1e8, step = 1000) => f(key, label, "currency", def, min, max, step);
const rate = (key: string, label: string, def: number, min = 0, max = 30) => f(key, label, "percent", def, min, max, 0.1);
const yrs = (key: string, label: string, def: number, min = 1, max = 40, step = 1) => f(key, label, "years", def, min, max, step);
const sel = (key: string, label: string, def: number, options: { label: string; value: number }[]) => f(key, label, "select", def, 0, 0, 1, options);
const FREQ = [{ label: "Monthly", value: 12 }, { label: "Quarterly", value: 4 }, { label: "Half-yearly", value: 2 }, { label: "Yearly", value: 1 }];
const FDF = [{ label: "Yearly", value: 1 }, { label: "Half-yearly", value: 2 }, { label: "Quarterly", value: 4 }, { label: "Monthly", value: 12 }];
const MY = [{ label: "Monthly", value: 12 }, { label: "Yearly", value: 1 }];
const YN = [{ label: "No", value: 0 }, { label: "Yes", value: 1 }];
const GR = [{ label: "Low (5%)", value: 5 }, { label: "Moderate (10%)", value: 10 }, { label: "High (15%)", value: 15 }, { label: "Custom", value: 999 }];
const seq = (a: number, b: number, st = 1) => Array.from({ length: Math.floor((b - a) / st) + 1 }, (_, i) => ({ label: String(a + i * st), value: a + i * st }));
const w = (fl: Field, showIf: Field["showIf"], hint?: string): Field => ({ ...fl, showIf, hint: hint ?? fl.hint });
const hn = (fl: Field, hint: string): Field => ({ ...fl, hint });
const infl = (v: Record<string, number>, target: number) => (v.adjust === 1 ? target * Math.pow(1 + v.inflation / 100, v.years) : target);

const R = (label: string, value: string, stats: [string, string][], pie?: Result["pie"], chart?: Result["chart"]): Result => ({
  headline: { label, value }, stats: stats.map(([label, value]) => ({ label, value })), pie, chart,
});
const err = (error: string): Result => ({ headline: { label: "", value: "" }, stats: [], error });
const series = (n: number, lines: Record<string, (y: number) => number>): Result["chart"] => {
  const ys = Array.from({ length: Math.max(1, Math.ceil(n)) }, (_, i) => i + 1);
  return { labels: ys.map((y) => `Yr ${y}`), lines: Object.entries(lines).map(([name, fn]) => ({ name, values: ys.map((y) => fn(Math.min(y, n))) })) };
};
const byYear = (arr: { invested: number; value: number }[]): Result["chart"] => ({
  labels: arr.map((_, i) => `Yr ${i + 1}`),
  lines: [{ name: "Invested", values: arr.map((a) => a.invested) }, { name: "Total value", values: arr.map((a) => a.value) }],
});
const ip = (v: number, g: number) => [{ name: "Invested", value: v }, { name: "Returns", value: g }];

export const CATEGORIES: Category[] = ["Invest", "Save", "Plan", "Borrow"];

export const calculators: Calc[] = [
  { slug: "sip", title: "SIP Calculator", short: "Estimate the wealth a monthly or yearly SIP can build.", category: "Invest", icon: "TrendingUp", popular: true,
    fields: [sel("freq", "Frequency of investment", 12, MY), amt("amount", "Investment amount (per instalment)", 10000, 500, 1e7, 500), rate("rate", "Expected rate of return (p.a.)", 12, 0, 30), yrs("years", "Tenure (years)", 10, 1, 50)],
    compute: (v) => { const fv = F.sipFV(v.amount, v.rate, v.years, true, v.freq), inv = v.amount * F.periods(v.years, v.freq);
      return R("Future value", C(fv), [["Invested amount", C(inv)], ["Estimated returns", C(fv - inv)], ["Rate per instalment", P(v.rate / v.freq, 3)]], ip(inv, fv - inv),
        series(v.years, { Invested: (y) => v.amount * F.periods(y, v.freq), "Total value": (y) => F.sipFV(v.amount, v.rate, y, true, v.freq) })); },
    formula: "FV = P × [((1 + i)^n − 1) / i] × (1 + i), where i = annual rate ÷ instalments per year (12 or 1) and n = number of instalments.",
    assumptions: ["Instalments are invested at the start of each period.", "The return rate stays constant; real markets fluctuate."] },

  { slug: "lumpsum", title: "Lumpsum Calculator", short: "See what a one-time investment can grow to.", category: "Invest", icon: "Banknote", popular: true,
    fields: [amt("amount", "Investment amount", 100000, 500, 1e8, 500), rate("rate", "Expected rate of return (p.a.)", 12, 0, 30), yrs("years", "Tenure (years)", 10, 1, 50)],
    compute: (v) => { const fv = F.lumpsum(v.amount, v.rate, v.years);
      return R("Future value", C(fv), [["Invested amount", C(v.amount)], ["Estimated returns", C(fv - v.amount)], ["Growth multiple", `${N(fv / v.amount)}x`]], ip(v.amount, fv - v.amount),
        series(v.years, { Invested: () => v.amount, "Total value": (y) => F.lumpsum(v.amount, v.rate, y) })); },
    formula: "FV = P × (1 + r)^n, where P is the amount, r the annual return and n the years.",
    assumptions: ["Returns compound annually at a constant rate.", "Taxes, exit loads and expense ratios are not deducted."] },

  { slug: "step-up", title: "Step-Up SIP Calculator", short: "Model a SIP that increases every year.", category: "Invest", icon: "ChartNoAxesColumnIncreasing", popular: true,
    fields: [amt("sip", "Monthly investment amount", 10000, 500, 1e7, 500), rate("step", "Growth in investment amount (p.a.)", 10, 0, 50), rate("rate", "Expected rate of return (p.a.)", 12, 0, 30), yrs("years", "Tenure (years)", 10, 1, 50)],
    compute: (v) => { const r = F.stepUp(v.sip, v.step, v.rate, v.years);
      return R("Future value", C(r.value), [["Invested amount", C(r.invested)], ["Estimated returns", C(r.value - r.invested)], ["Final-year monthly SIP", C(v.sip * Math.pow(1 + v.step / 100, Math.round(v.years) - 1))]], ip(r.invested, r.value - r.invested), byYear(r.byYear)); },
    formula: "Each month: balance = (balance + SIP) × (1 + i); SIP grows by the step-up % after every 12 months.", assumptions: ["Start-of-month instalments; monthly compounding of the annual return ÷ 12.", "Step-up applies once a year."] },

  { slug: "cagr", title: "CAGR Calculator", short: "Find the annual growth rate between two values.", category: "Invest", icon: "Percent",
    fields: [amt("begin", "Beginning value", 100000, 1, 1e10, 1000), amt("end", "Ending value", 250000, 1, 1e10, 1000), yrs("years", "Period (years)", 5, 0.5, 50, 0.5)],
    compute: (v) => { const c = F.cagr(v.begin, v.end, v.years);
      return R("CAGR", P(c), [["Beginning value", C(v.begin)], ["Ending value", C(v.end)], ["Absolute return", P(((v.end - v.begin) / v.begin) * 100)]], v.end > v.begin ? [{ name: "Beginning value", value: v.begin }, { name: "Gain", value: v.end - v.begin }] : undefined,
        series(v.years, { "Value at CAGR": (y) => v.begin * Math.pow(1 + c / 100, y) })); },
    formula: "CAGR = (Ending value ÷ Beginning value)^(1 ÷ period) − 1.", assumptions: ["Assumes no interim cash flows (use XIRR for those).", "CAGR smooths returns; it hides year-to-year volatility."] },

  { slug: "compound-interest", title: "Compound Interest Calculator", short: "Grow a lumpsum with optional regular deposits.", category: "Invest", icon: "Layers",
    fields: [amt("principal", "Initial investment (lumpsum)", 100000, 0, 1e10, 1000), rate("rate", "Interest rate (p.a.)", 8, 0, 30), yrs("years", "Tenure (years)", 10, 1, 50), sel("cf", "Compounding frequency", 4, FREQ), amt("dep", "Regular investment (if any)", 0, 0, 1e8, 500), sel("df", "Regular deposit frequency", 12, FREQ)],
    compute: (v) => { if (v.principal + v.dep <= 0) return err("Enter an initial investment or a regular investment.");
      const at = (y: number) => F.compoundDeposits(v.principal, v.rate, y, v.cf, v.dep, v.df), r = at(v.years);
      return R("Future value", C(r.value), [["Total invested", C(r.invested)], ["Interest earned", C(r.value - r.invested)]], ip(r.invested, r.value - r.invested), series(v.years, { Invested: (y) => at(y).invested, "Total value": (y) => at(y).value })); },
    formula: "Lumpsum: A = P × (1 + r/f)^(f × t). Regular deposits are added at the start of each deposit period and grow at the same compounding rate.", assumptions: ["Deposits are made at the start of each period (annuity-due).", "Between compounding dates, growth is applied evenly month by month."] },

  { slug: "dcf", title: "DCF Calculator", short: "Estimate a company's fair value per share.", category: "Invest", icon: "Calculator",
    fields: [hn(f("fcf", "Initial FCF (₹ Cr)", "number", 1000, 0.01, 1e8, 10), "Use a 3-year average of operating cash flow minus capex."), hn(rate("discount", "Discount rate", 12, 1, 30), "Your required rate of return; use a lower rate for steadier businesses."),
      hn(sel("g1", "Growth rate (years 1–5)", 10, GR), "For prudent results, keep custom growth at or below about 20%."), w(rate("g1c", "Custom growth (years 1–5)", 10, -20, 40), (v) => v.g1 === 999),
      hn(sel("g2", "Growth rate (years 6–10)", 5, GR), "For prudent results, keep custom growth at or below about 15%."), w(rate("g2c", "Custom growth (years 6–10)", 8, -20, 30), (v) => v.g2 === 999),
      hn(rate("terminal", "Terminal growth rate", 4, 0, 10), "Perpetual growth after year 10, typically between inflation and GDP growth."), f("mcap", "Market capitalisation (₹ Cr)", "number", 15000, 1, 1e9, 100), f("price", "Current share price (₹)", "number", 150, 0.01, 1e7, 1),
      hn(f("netDebt", "Net debt (₹ Cr)", "number", 0, -1e8, 1e8, 10), "Total debt minus cash and equivalents; negative for net cash."), hn(f("mos", "Margin of safety (%)", "percent", 20, 0, 90, 1), "A 10–30% discount to intrinsic value guards against error.")],
    compute: (v) => { const g1 = v.g1 === 999 ? v.g1c : v.g1, g2 = v.g2 === 999 ? v.g2c : v.g2;
      if (v.discount <= v.terminal) return err("Discount rate must be higher than terminal growth rate.");
      const r = F.dcf({ fcf: v.fcf, g1, g2, discount: v.discount, terminal: v.terminal, netDebt: v.netDebt, shares: v.mcap / v.price });
      if (r.equity <= 0) return err("Equity value is not positive at these inputs. Reduce net debt or raise cash flow.");
      const fair = r.perShare * (1 - v.mos / 100), up = (fair / v.price - 1) * 100;
      return { ...R("Fair value per share", C(fair), [["DCF intrinsic value per share", C(r.perShare)], ["Current share price", C(v.price)], [up >= 0 ? "Upside vs current price" : "Downside vs current price", P(Math.abs(up))], ["Enterprise value", formatCrore(r.ev)], ["Equity value", formatCrore(r.equity)]],
        [{ name: "PV of years 1–10 cash flows", value: r.pv }, { name: "PV of terminal value", value: r.pvTv }], { labels: r.pvs.map((_, i) => `Yr ${i + 1}`), lines: [{ name: "PV of cash flow (₹ Cr)", values: r.pvs }] }), unit: "cr" as const }; },
    formula: "EV = Σ FCFₜ ÷ (1 + d)^t (t = 1–10, growth g₁ then g₂) + [FCF₁₀ × (1 + g) ÷ (d − g)] ÷ (1 + d)^10; Value/share = (EV − net debt) ÷ shares; Fair value = Value × (1 − margin of safety).", assumptions: ["Shares outstanding are derived as market capitalisation ÷ share price.", "Ten-year forecast with two growth stages; results are highly sensitive to discount and terminal rates."] },

  { slug: "fd", title: "Fixed Deposit Calculator", short: "See the maturity value of a fixed deposit.", category: "Save", icon: "Vault",
    fields: [sel("freq", "Compounding frequency", 4, FDF), amt("principal", "Amount deposited", 500000, 1000, 1e10, 1000), yrs("years", "Tenure (years)", 5, 0.5, 50, 0.5), rate("rate", "Interest rate (p.a.)", 7, 1, 15)],
    compute: (v) => { const m = F.compound(v.principal, v.rate, v.years, v.freq);
      return R("Maturity value", C(m), [["Deposit amount", C(v.principal)], ["Interest earned", C(m - v.principal)], ["Effective yearly yield", P((Math.pow(1 + v.rate / 100 / v.freq, v.freq) - 1) * 100)]], [{ name: "Principal", value: v.principal }, { name: "Interest", value: m - v.principal }],
        series(v.years, { Principal: () => v.principal, "Total value": (y) => F.compound(v.principal, v.rate, y, v.freq) })); },
    formula: "A = P × (1 + r/f)^(f × t).", assumptions: ["Interest is reinvested at the chosen compounding frequency.", "TDS and premature-withdrawal penalties are not applied."] },

  { slug: "rd", title: "Recurring Deposit Calculator", short: "Estimate returns on a monthly recurring deposit.", category: "Save", icon: "CalendarClock",
    fields: [amt("monthly", "Monthly amount deposited", 10000, 100, 1e7, 100), rate("rate", "Interest rate (p.a.)", 6.5, 1, 15), sel("ry", "Deposit tenure – years", 5, seq(0, 10)), sel("rm", "Deposit tenure – months", 0, [0, 3, 6, 9].map((x) => ({ label: String(x), value: x })))],
    compute: (v) => { const m = v.ry * 12 + v.rm; if (m < 6) return err("Recurring deposit tenure must be at least 6 months.");
      const mat = F.rd(v.monthly, v.rate, m), inv = v.monthly * m;
      return R("Maturity value", C(mat), [["Total deposits", C(inv)], ["Interest earned", C(mat - inv)], ["Tenure", formatDuration(m)]], [{ name: "Deposits", value: inv }, { name: "Interest", value: mat - inv }],
        series(m / 12, { Deposits: (y) => v.monthly * Math.round(y * 12), "Total value": (y) => F.rd(v.monthly, v.rate, Math.round(y * 12)) })); },
    formula: "Maturity = Σ P × (1 + rate/4)^(months remaining ÷ 3), for each monthly deposit.", assumptions: ["Deposit is made at the start of each month; interest compounds quarterly, as most Indian banks do.", "Bank-specific rounding may cause small differences."] },

  { slug: "ppf", title: "PPF Calculator", short: "Project your Public Provident Fund maturity.", category: "Save", icon: "PiggyBank", popular: true,
    fields: [sel("freq", "Deposit frequency", 1, [{ label: "Monthly", value: 12 }, { label: "Quarterly", value: 4 }, { label: "Semi-annually", value: 2 }, { label: "Annually", value: 1 }]), hn(amt("amount", "Investment amount (per deposit)", 150000, 500, 150000, 500), "Minimum ₹500. Total deposits are capped at ₹1,50,000 per financial year."),
      sel("years", "Tenure (years)", 15, seq(15, 50, 5)), rate("rate", "Interest rate (p.a.)", 7.1, 1, 15)],
    compute: (v) => { if (v.amount * v.freq > 150000) return err("Total deposits in a financial year cannot exceed ₹1,50,000. Lower the amount or the frequency.");
      const r = F.ppf(v.amount, v.rate, v.years, v.freq);
      return R("Maturity value", C(r.value), [["Total deposits", C(r.invested)], ["Interest earned", C(r.value - r.invested)]], [{ name: "Deposits", value: r.invested }, { name: "Interest", value: r.value - r.invested }], byYear(r.byYear)); },
    formula: "Interest for each month = balance (incl. deposits made by the 5th) × rate ÷ 12; the year's interest is credited at year end.", assumptions: ["Deposits are made on or before the 5th of the month, so they earn interest for that month.", "Instalments fall in month 1 (annual), 1 and 7 (semi-annual), 1/4/7/10 (quarterly) or every month.", "The rate is reset by the government quarterly; a constant rate is assumed."] },

  { slug: "goal-sip", title: "Goal Planning – SIP", short: "Find the monthly or yearly SIP needed to reach a goal.", category: "Plan", icon: "Flag", popular: true,
    fields: [sel("freq", "Frequency of investment", 12, MY), amt("target", "Targeted wealth", 5000000, 10000, 1e10, 10000), rate("rate", "Expected rate of return (p.a.)", 12, 0, 30), yrs("years", "Tenure (years)", 10, 1, 50), sel("adjust", "Adjust for inflation", 0, YN), w(rate("inflation", "Expected inflation (p.a.)", 6, 0, 15), (v) => v.adjust === 1, "The goal is treated as today's value and inflated to its future cost.")],
    compute: (v) => { const fut = infl(v, v.target), sip = fut / F.sipFV(1, v.rate, v.years, true, v.freq), inv = sip * F.periods(v.years, v.freq);
      return R(v.freq === 12 ? "Monthly SIP needed" : "Yearly SIP needed", C(sip), [[v.adjust === 1 ? "Goal after inflation" : "Targeted wealth", C(fut)], ["Total invested", C(inv)], ["Estimated returns", C(fut - inv)]], ip(inv, fut - inv),
        series(v.years, { Invested: (y) => sip * F.periods(y, v.freq), "Total value": (y) => F.sipFV(sip, v.rate, y, true, v.freq) })); },
    formula: "Goal = G × (1 + inflation)^n if adjusted; SIP = Goal ÷ [((1 + i)^N − 1) / i × (1 + i)], i = rate ÷ instalments per year.",
    assumptions: ["Instalments are invested at the start of each period.", "With inflation adjustment on, the goal amount is in today's rupees."] },

  { slug: "retirement", title: "Retirement Planning Calculator", short: "Estimate the corpus and SIP for a comfortable retirement.", category: "Plan", icon: "Sunset",
    fields: [f("age", "Current age", "years", 30, 18, 60), f("retAge", "Retirement age", "years", 60, 40, 70), f("lifeExp", "Life expectancy", "years", 85, 60, 120),
      rate("ret", "Expected rate of return (p.a.)", 10, 0, 25), amt("expenses", "Current annual expense", 600000, 12000, 1e9, 10000), hn(rate("inflation", "Expected inflation (p.a.)", 6, 0, 15), "Added by FinSight so expenses can grow realistically; set 0 to ignore inflation.")],
    compute: (v) => { if (v.retAge <= v.age) return err("Retirement age must be greater than current age."); if (v.lifeExp <= v.retAge) return err("Life expectancy must be greater than retirement age.");
      const r = F.retirement({ age: v.age, retAge: v.retAge, lifeExp: v.lifeExp, ret: v.ret, inflation: v.inflation, expenses: v.expenses / 12 });
      return R("Monthly investment required", C(r.sip), [["Corpus needed at retirement", C(r.corpus)], ["Yearly expense at retirement", C(r.annualAtRet)], ["Years to retire", `${r.yrs}`], ["Years in retirement", `${r.post}`]],
        [{ name: "Total invested", value: r.sip * 12 * r.yrs }, { name: "Growth", value: Math.max(0, r.corpus - r.sip * 12 * r.yrs) }],
        series(r.yrs, { "Projected corpus": (y) => F.sipFV(r.sip, v.ret, y), Invested: (y) => r.sip * 12 * y })); },
    formula: "Corpus = W × [1 − (1 + real)^−N] ÷ real × (1 + real), real = (1 + return) ÷ (1 + inflation) − 1; SIP = Corpus ÷ SIP factor over the years to retirement.",
    assumptions: ["Expenses rise with inflation before and after retirement; withdrawals occur at the start of each year.", "No existing savings, pension or other income is assumed."] },

  { slug: "emi", title: "EMI Calculator", short: "Work out the monthly EMI on any loan.", category: "Borrow", icon: "Landmark", popular: true,
    fields: [amt("loan", "Loan amount", 2500000, 10000, 1e10, 10000), yrs("years", "Loan tenure (years)", 20, 1, 30), rate("rate", "Interest rate (p.a.)", 8.5, 0, 30)],
    compute: (v) => { const m = Math.round(v.years * 12), e = F.emi(v.loan, v.rate, m), tot = e * m;
      return R("Monthly EMI", C(e), [["Principal", C(v.loan)], ["Total interest", C(tot - v.loan)], ["Total payable", C(tot)]], [{ name: "Principal", value: v.loan }, { name: "Interest", value: tot - v.loan }],
        { labels: Array.from({ length: Math.round(v.years) }, (_, i) => `Yr ${i + 1}`), lines: [{ name: "Outstanding balance", values: Array.from({ length: Math.round(v.years) }, (_, i) => F.loanBalance(v.loan, v.rate, m, (i + 1) * 12)) }] }); },
    formula: "EMI = P × r × (1 + r)^n ÷ ((1 + r)^n − 1), r = annual rate ÷ 12, n = months.", assumptions: ["Fixed interest rate for the full tenure.", "Processing fees and prepayments are ignored."] },
];

export const getCalc = (slug: string) => calculators.find((c) => c.slug === slug);
export const defaultsOf = (c: Calc) => Object.fromEntries(c.fields.map((x) => [x.key, x.def]));
