# FinSight – See Your Money Clearly.

FinSight is a free, client-side web app with **12 Indian financial calculators** for investing, saving, planning and borrowing. Every result comes from a tested calculation engine, and every calculator page shows its formula, assumptions, a worked example, related calculators and FAQs. There is no backend, database, login or tracking: inputs never leave the browser.

All code, copy and branding are original; no third-party source, assets or private APIs are used.

## The 12 calculators
| Category | Calculators | Route |
|---|---|---|
| **Invest** | SIP Calculator | `/calculators/sip` |
| | Lumpsum Calculator | `/calculators/lumpsum` |
| | Step-Up SIP Calculator | `/calculators/step-up` |
| | CAGR Calculator | `/calculators/cagr` |
| | Compound Interest Calculator | `/calculators/compound-interest` |
| | DCF Calculator | `/calculators/dcf` |
| **Save** | Fixed Deposit Calculator | `/calculators/fd` |
| | Recurring Deposit Calculator | `/calculators/rd` |
| | PPF Calculator | `/calculators/ppf` |
| **Plan** | Goal Planning – SIP | `/calculators/goal-sip` |
| | Retirement Planning Calculator | `/calculators/retirement` |
| **Borrow** | EMI Calculator | `/calculators/emi` |

Other routes: `/` (home), `/calculators` (catalogue with search and category filters, e.g. `/calculators?category=Save`), `/sitemap.xml`, `/robots.txt`. Any other `/calculators/<slug>` returns the branded 404 page.

## Features
- Live results, a breakdown chart, a year-by-year trend chart and an accessible data table
- Indian number formatting (₹1,00,000), inline validation, Reset, and paste-friendly currency inputs (`₹ 1,25,000` works)
- Conditional fields (inflation on Goal SIP, custom growth on DCF) that are ignored by validation and calculation while hidden
- Catalogue search (multi-word, case-insensitive, keyword aware) and category filters with counts
- Hand-picked related calculators, breadcrumbs, 404 and error pages, sitemap, robots, per-page metadata, security headers
- Responsive from 360 px upwards; keyboard accessible; axe-core clean (see `docs/QA_REPORT.md`)

## Tech stack
Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS 4 · Recharts · lucide-react · Vitest. Node 20.9+ is required.

## Getting started
```bash
npm install
npm run dev          # http://localhost:3000
npm test             # unit tests (Vitest)
npm run lint
npm run typecheck
npm run build && npm start
```

## Environment variables
| Name | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Recommended in production | Public origin (no trailing slash) for canonical links, Open Graph URLs, `sitemap.xml` and `robots.txt`. Defaults to `http://localhost:3000`. |

No secrets are used or needed. Copy `.env.example` to `.env.local` for local overrides and never commit a `.env` file.

## Deployment (Vercel)
1. Push the repository to GitHub, GitLab or Bitbucket.
2. In Vercel choose **Add New → Project** and import the repository (Next.js is detected automatically).
3. Add `NEXT_PUBLIC_SITE_URL` (for example `https://calculators.example.com`) under **Settings → Environment Variables**.
4. Deploy. Every page is statically generated, so no server configuration is needed. CLI alternative: `npx vercel --prod`.

## Architecture
```
app/                     Routes: home, /calculators, /calculators/[slug] (shared dynamic route), 404, error, sitemap, robots, icon
components/              CalculatorClient (form + results), ResultCharts (Recharts, lazy-loaded), CatalogueClient (search/filter),
                         Navbar, Footer, CalculatorCard, Icon, Logo
data/calculators.ts      Single source of truth: one definition per calculator (fields, defaults, limits, compute(), formula, assumptions)
data/content.ts          Editorial text per calculator: about, how to read the result, one FAQ, search keywords, related calculators
lib/finance/core.ts      Pure financial formulas (no React, no formatting)
lib/format.ts            INR / percent / duration formatting
lib/input-format.ts      Parsing and editing helpers for number inputs
lib/validation.ts        Field validation and user-facing messages
lib/search.ts            Catalogue search and related-calculator lookup
lib/site.ts              Site name, tagline and URL
types/calculators.ts     Field, Result, Calc, Category and IconName types
tests/                   Unit tests, numeric reference vectors, catalogue/route/content tests
docs/                    QA report, generated numeric table, reference-number script, browser-QA script
```
Design rules: formulas live only in `lib/finance`; calculators are declarative data; the calculator count, routes, sitemap, search and category counts are all derived from `data/calculators.ts`; full precision is kept internally and rounding happens only when text is produced; hidden conditional fields fall back to defaults before `compute()` runs; `Result.error` carries a plain-language message instead of NaN or Infinity.

### Adding or removing a calculator
1. Add or remove the formula in `lib/finance/core.ts` (with its unit test).
2. Add or remove the definition in `data/calculators.ts`, the entry with the same slug in `data/content.ts` (including `related` slugs of other calculators that point to it), and its icon in `components/Icon.tsx` / `types/calculators.ts` if it is no longer used.
3. Update the expected slug lists in `tests/app.test.ts`. Routes, sitemap, search, home page and catalogue update automatically.

## Formula methodology
Rates are annual percentages. i = periodic rate, n = number of periods.

| Calculator | Method |
|---|---|
| SIP | FV = P × [((1 + i)^n − 1) / i] × (1 + i); instalments at the start of each period (monthly: i = r/12; yearly: i = r) |
| Lumpsum | FV = P(1 + r)^n |
| Step-Up SIP | Simulated month by month: balance = (balance + SIP) × (1 + r/12); the instalment rises by the step-up % after every 12 months |
| CAGR | (End/Begin)^(1/years) − 1 |
| Compound Interest | Lumpsum at (1 + r/f)^(f·t); regular deposits (annuity-due) grow at the same effective rate |
| DCF | 10-year free cash flow (growth g₁ for years 1–5, g₂ for 6–10), Gordon-growth terminal value, minus net debt, ÷ shares (market cap ÷ price), less margin of safety |
| Fixed Deposit | A = P(1 + r/f)^(f·t) |
| Recurring Deposit | Σ P(1 + r/4)^(months remaining/3), quarterly compounding |
| PPF | Interest accrues monthly (rate/12) on the balance including deposits made by the 5th; credited annually |
| Goal Planning – SIP | Goal (inflated by (1 + inflation)^n if selected) ÷ SIP future-value factor for ₹1 |
| Retirement | Corpus = first-year expense × annuity-due factor at the real rate (1 + return)/(1 + inflation) − 1; SIP = corpus ÷ SIP factor over the years to retirement |
| EMI | EMI = P·r(1 + r)^n / ((1 + r)^n − 1), r = annual rate/12; zero-rate loans use P/n |

## Assumptions and implementation choices
These are FinSight choices where no single standard exists. They are also shown on each calculator page.
- Returns and rates are constant; taxes, fees, exit loads and bank rounding are ignored.
- RD compounds quarterly. PPF instalments fall in month 1 (yearly), months 1 and 7 (half-yearly), 1/4/7/10 (quarterly) or every month; the default rate is a constant 7.1%.
- Compound Interest deposits are at the start of each period, with even monthly growth between compounding dates.
- DCF shares = market cap ÷ price; terminal growth must be below the discount rate; results are very sensitive to both.
- Retirement includes an inflation input and assumes no existing savings, pension or other income.
- Goal Planning – SIP treats the goal as today's money only when "Adjust for inflation" is Yes.

## Testing
`npm test` runs four test files:
- `tests/finance.test.ts`: formulas, boundaries, frequency and conditional inputs, field structure
- `tests/vectors.test.ts`: 23 numeric vectors checked against an independent Python implementation (`docs/reference_vectors.py`) and one published reference example; also writes `docs/numeric-qa.md`
- `tests/app.test.ts`: the exact 12-calculator catalogue, categories, route generation, sitemap, search, related calculators, content coverage, formatting, validation, input parsing, copy checks, zero and extreme inputs, project hygiene
- `tests/input-format.test.ts`: currency input editing helpers

Browser QA (Playwright, not part of `npm test`): build and start the app, then run `python3 docs/ui_qa.py http://localhost:3000 ui 390,1280` for the UI sweep or `... axe` for the accessibility sweep (needs `pip install playwright` and `npm i axe-core` in the folder named inside the script).

## Known limitations
- Results are estimates under constant-rate assumptions and are not advice.
- Standard-maths choices (listed above) may differ slightly from other calculators or from bank statements.
- Only Chromium was used for browser QA; Firefox, Safari, real devices and screen readers were not tested.
- No Content-Security-Policy header is set.

## Maintenance notes
- Revisit the PPF default rate when the notified rate changes (`data/calculators.ts`).
- Dependencies are pinned for Next/React and caret-ranged for the rest. Run `npm audit` and `npm outdated` periodically.
- `npm install` works without `--legacy-peer-deps`.
- History: an earlier version of the product had 21 calculators. Nine were removed (see `docs/QA_REPORT.md`); they no longer exist anywhere in the application.
