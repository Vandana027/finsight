// Central calculation layer. Pure, deterministic functions. Rates are annual percentages (e.g. 12 = 12%).

/** Lumpsum: FV = P × (1 + r)^n */
export const lumpsum = (p: number, rate: number, years: number) => p * Math.pow(1 + rate / 100, years);

/** Number of instalments for a tenure and frequency (perYear: 12 = monthly, 1 = yearly). */
export const periods = (years: number, perYear: number) => Math.round(years * perYear);
/** SIP: FV = P × [((1+i)^n − 1) / i] × (1+i); i = annual rate ÷ perYear, n = instalments. due=true → paid at start of period. */
export function sipFV(m: number, rate: number, years: number, due = true, perYear = 12) {
  const i = rate / (100 * perYear), n = periods(years, perYear);
  if (i === 0) return m * n;
  const f = m * ((Math.pow(1 + i, n) - 1) / i);
  return due ? f * (1 + i) : f;
}
/** CAGR = (End / Begin)^(1/years) − 1, returned in percent. */
export const cagr = (b: number, e: number, y: number) => (b <= 0 || y <= 0 ? NaN : (Math.pow(e / b, 1 / y) - 1) * 100);

/** EMI = P × r × (1+r)^n / ((1+r)^n − 1), r = monthly rate. */
export function emi(p: number, rate: number, months: number) {
  const r = rate / 1200;
  if (months <= 0) return NaN;
  if (r === 0) return p / months;
  const g = Math.pow(1 + r, months);
  return (p * r * g) / (g - 1);
}
export function loanBalance(p: number, rate: number, months: number, k: number) {
  const r = rate / 1200, e = emi(p, rate, months);
  if (r === 0) return Math.max(0, p - e * k);
  const g = Math.pow(1 + r, k);
  return Math.max(0, p * g - (e * (g - 1)) / r);
}
/** Compound interest: A = P × (1 + r/f)^(f×t) */
export const compound = (p: number, rate: number, years: number, freq: number) => p * Math.pow(1 + rate / 100 / freq, freq * years);
/** RD: monthly deposits at start of month, interest compounded quarterly (common Indian bank convention). */
export function rd(m: number, rate: number, months: number) {
  const q = rate / 400;
  let t = 0;
  for (let k = 1; k <= months; k++) t += m * Math.pow(1 + q, (months - k + 1) / 3);
  return t;
}
type Yr = { invested: number; value: number };
/** Step-up SIP: monthly SIP rises by `step`% at the end of every year. */
export function stepUp(sip: number, step: number, rate: number, years: number) {
  const i = rate / 1200, n = Math.round(years);
  let bal = 0, inv = 0, m = sip;
  const byYear: Yr[] = [];
  for (let y = 0; y < n; y++) {
    for (let k = 0; k < 12; k++) { bal = (bal + m) * (1 + i); inv += m; }
    m *= 1 + step / 100;
    byYear.push({ invested: inv, value: bal });
  }
  return { invested: inv, value: bal, byYear };
}
/** PPF: interest accrues monthly at rate/12 on the balance incl. deposits made by the 5th, and is credited once a year (annual compounding).
 * Instalments fall in month 1 (yearly), months 1 and 7 (half-yearly), 1/4/7/10 (quarterly) or every month. */
export function ppf(amount: number, rate: number, years: number, perYear = 1) {
  const gap = 12 / perYear;
  let bal = 0, inv = 0;
  const byYear: Yr[] = [];
  for (let y = 1; y <= years; y++) {
    let accrued = 0;
    for (let mth = 0; mth < 12; mth++) {
      if (mth % gap === 0) { bal += amount; inv += amount; }
      accrued += (bal * rate) / 1200;
    }
    bal += accrued;
    byYear.push({ invested: inv, value: bal });
  }
  return { invested: inv, value: bal, byYear };
}

/** Compound interest with optional regular deposits at the start of each deposit period (annuity-due).
 * Interest is compounded cf times a year; growth is applied month by month at (1 + r/cf)^(cf/12). */
export function compoundDeposits(p: number, rate: number, years: number, cf: number, dep: number, df: number) {
  const g = Math.pow(1 + rate / 100 / cf, cf / 12), gap = 12 / df, n = Math.round(years * 12);
  let bal = p, inv = p;
  for (let k = 0; k < n; k++) { if (k % gap === 0) { bal += dep; inv += dep; } bal *= g; }
  return { value: bal, invested: inv };
}

/** Retirement: yearly expense inflated to retirement, corpus = annuity-due at the real rate, SIP (start of month) to build it. */
export function retirement(o: { age: number; retAge: number; expenses: number; inflation: number; ret: number; lifeExp: number }) {
  const yrs = o.retAge - o.age, post = o.lifeExp - o.retAge;
  const annualAtRet = o.expenses * 12 * Math.pow(1 + o.inflation / 100, yrs);
  const real = (1 + o.ret / 100) / (1 + o.inflation / 100) - 1;
  const corpus = real === 0 ? annualAtRet * post : annualAtRet * ((1 - Math.pow(1 + real, -post)) / real) * (1 + real);
  return { yrs, post, annualAtRet, corpus, sip: corpus / sipFV(1, o.ret, yrs) };
}
/** 10-year DCF: growth g1 for years 1–5, g2 for years 6–10, Gordon-growth terminal value, then net debt and share count. */
export function dcf(o: { fcf: number; g1: number; g2: number; discount: number; terminal: number; netDebt: number; shares: number }) {
  const d = o.discount / 100, t = o.terminal / 100;
  let cf = o.fcf, pv = 0;
  const pvs: number[] = [];
  for (let y = 1; y <= 10; y++) { cf *= 1 + (y <= 5 ? o.g1 : o.g2) / 100; const p = cf / Math.pow(1 + d, y); pv += p; pvs.push(p); }
  const pvTv = ((cf * (1 + t)) / (d - t)) / Math.pow(1 + d, 10);
  const ev = pv + pvTv, equity = ev - o.netDebt;
  return { pv, pvs, pvTv, ev, equity, perShare: equity / o.shares };
}
