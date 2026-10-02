# FinSight – QA report (12-calculator product)

Labels: **Verified** = observed by running it; **Tested** = covered by an automated test; **Choice** = documented decision.

## Final product
- **Calculators retained (12):** SIP, Lumpsum, Step-Up SIP, CAGR, Compound Interest, DCF, Fixed Deposit, Recurring Deposit, PPF, Goal Planning – SIP, Retirement Planning, EMI.
- **Categories:** Invest (6), Save (3), Plan (2), Borrow (1). No empty category. Tax & Salary and Valuation were dropped because no remaining calculator needs them (DCF now sits under Invest).
- **Routes (19 static pages in the production build):** `/`, `/calculators`, 12 × `/calculators/<slug>`, 404, `sitemap.xml`, `robots.txt`, `icon.svg`.
- The shared `app/calculators/[slug]/page.tsx` route is kept; `dynamicParams = false`, so every other slug is a 404.

## Calculators removed (9)
Goal Planning – Lumpsum (`goal-lumpsum`), Time Duration – One Time (`time-duration-one-time`), Time Duration – Regular (`time-duration-regular`), Investment Planner (`investment-planner`), Stock Market vs FD (`stock-vs-fd`), Children Education Planner (`children-education`), Education Loan EMI (`education-loan-emi`), GST (`gst`), Gratuity Exemption (`gratuity`).

What was removed, not hidden:
- Definitions in `data/calculators.ts`, editorial content in `data/content.ts`, and the matching hand-picked related-calculator links.
- Formulas used only by them in `lib/finance/core.ts`: GST, gratuity, investment planner, "periods to target" solvers. The retirement formula lost its unused existing-savings parameter.
- Dead UI and type code: the `months` field kind, option groups (GST-only select), the `"inr"` result unit, paise display helper, long-horizon chart sampling, unused icons and the `IconName` entries for them, and three unused helpers (`clamp`, `safeDivide`, `roundCurrency`).
- Tests and numeric vectors for the deleted calculators (43 vectors → 23), the Python reference numbers, GST/search/category tests, and browser-QA steps.
- Documentation: README rewritten for 12 calculators; old counts removed.
- Dependency: the explicit `vite` devDependency was redundant (Vitest installs it itself); removed and the lockfile regenerated. All other dependencies are still used.

## Verification
**Automated (final build):** `npm test` 4 files, **103 tests pass**; `npm run lint` clean; `npx tsc --noEmit` clean; `npm run build` succeeds; `npm audit`: 0 vulnerabilities.

**New or updated tests for this change (Tested):**
- Catalogue length is exactly 12; slugs equal the expected list in order; titles unique; categories are exactly Invest/Save/Plan/Borrow with none empty; content exists for exactly these 12.
- None of the 9 removed slugs or names (also GST, gratuity, moratorium, HSN) is found by search in any category filter, and none exists in the catalogue or content.
- Route generation: `generateStaticParams` returns exactly the 12 slugs and `dynamicParams` is false; sitemap lists exactly `/`, `/calculators` and the 12 pages; unknown slugs resolve to nothing.
- Related calculators: hand-picked lists for SIP, Lumpsum, CAGR, FD, Retirement and DCF match the brief; every calculator has 2–4 unique related entries, never itself, never a removed calculator.
- No hard-coded "12 calculators" or "21 calculators" strings in `app/` or `components/` (counts derive from the data).
- Existing numeric vectors, formula tests, edge cases (default/min/max inputs show no NaN or Infinity), conditional-field tests and copy checks were kept for the remaining calculators.

**Browser QA (Chromium, production server, Verified):**
- Widths 360, 390, 430, 768, 1024, 1280, 1440: home, catalogue and all 12 calculators at each width: no console errors or failed requests, no NaN/Infinity text, no horizontal overflow, one `h1`, chart and headline present, no empty result cards.
- Search (` SIP `, `sip calculator`, `EMI`, `PPF`, no match, and `gst`, `gratuity`, `education loan` all return nothing), category filters with counts (Borrow = 1, `?category=Save` = 3), `#search` focus, mobile menu.
- All 9 removed URLs return HTTP 404 with the branded not-found page; an invalid slug does the same. No page links to a removed calculator; every internal link found across pages returns 200.
- Related calculators on SIP are exactly Lumpsum, Step-Up SIP, Goal SIP and Compound Interest; clicking one navigates correctly; back, forward, refresh and breadcrumbs work. Home states the 12-calculator count and links to all 12.
- Form checks: live update, grouping, ₹ paste, Reset, invalid inputs, very large values, frequency buttons, data table, conditional fields, PPF cap message, invalid submit focus.
- Accessibility: axe-core (WCAG 2.0/2.1 A and AA plus best practices) on home, catalogue, all 12 calculators and the 404 page at 390 px and 1280 px: **0 violations**; keyboard pass on EMI showed a visible focus indicator on every tabbed element.

## Repository search for removed names
A repository-wide search (excluding `node_modules`, `.next` and the lockfile) for the nine slugs and their display names finds **no references in production code** (`app/`, `components/`, `lib/`, `data/`, `types/`, `public/`). The only places they appear are:
- `tests/app.test.ts`: lists of removed slugs and words used to assert they are gone.
- `docs/ui_qa.py`: the removed-route 404 check.
- This report and the README history note.
None of these can affect the running application.

## Limits (not verified)
- Only Chromium was available: Firefox, Safari/WebKit and real devices were not tested; no screen-reader testing with assistive software; no Lighthouse or bundle-size measurement.
- No Content-Security-Policy header.
- Numeric checks compare against an independent Python implementation and one published reference example. Methods without a public specification (RD and PPF timing, compound-interest deposit timing, DCF share count) are documented FinSight choices.
- `clamp`, `safeDivide` and `roundCurrency`, which an earlier brief asked for as shared utilities, were removed because nothing used them.
