/** Editorial content for each calculator page: explanation, how to read the result, one specific FAQ, search keywords and hand-picked related calculators (slugs). */
type CalcContent = { about: string; meaning: string; faq: { q: string; a: string }; keywords: string[]; related: string[] };

export const content: Record<string, CalcContent> = {
  lumpsum: {
    about: "Estimates what a single, one-time investment could grow to if it earns a constant annual return and stays invested for the whole tenure.",
    meaning: "Future value is your investment plus the growth assumed. The growth multiple shows how many times your money grows. Small changes in tenure or return can change the result a lot because growth compounds.",
    faq: { q: "Is a constant return realistic?", a: "No. Market-linked returns vary from year to year. Treat the rate as an average you want to test, not a prediction." },
    keywords: ["lump sum", "one time", "future value", "mutual fund"],
    related: ["sip", "cagr", "compound-interest"],
  },
  sip: {
    about: "Shows how regular investments of a fixed amount, made monthly or yearly, could grow at an assumed annual return.",
    meaning: "Compare the invested amount with the estimated returns to see how much of the final value comes from growth. Longer tenures increase the share that comes from compounding.",
    faq: { q: "What is the difference between monthly and yearly investing here?", a: "Monthly instalments are invested every month at one-twelfth of the annual rate. Yearly instalments are invested once a year. For the same total per year, monthly investing usually ends higher because each rupee is invested earlier." },
    keywords: ["systematic investment plan", "mutual fund", "monthly investment", "recurring"],
    related: ["lumpsum", "step-up", "goal-sip", "compound-interest"],
  },
  "goal-sip": {
    about: "Finds the regular monthly or yearly investment needed to reach a target, optionally adjusting the target for inflation.",
    meaning: "The SIP amount is what you invest in each period. Total invested and estimated returns show how the target is split between your contributions and assumed growth.",
    faq: { q: "What if I cannot afford the investment shown?", a: "Try a longer tenure, a lower target or a step-up plan. Raising the return assumption lowers the amount on paper but assumes more risk, so change it with care." },
    keywords: ["goal", "target", "sip", "inflation", "monthly investment"],
    related: ["sip", "step-up", "retirement"],
  },
  retirement: {
    about: "Estimates the corpus you may need at retirement and the monthly investment required to build it, using your expenses, inflation and return assumptions.",
    meaning: "The corpus is the amount needed on your retirement date so that yearly withdrawals, rising with inflation, last until the age you plan for. The monthly investment is what would build that corpus.",
    faq: { q: "Does this include existing savings or a pension?", a: "No. It assumes you start from zero and have no other income, so treat the result as a starting point and reduce it for savings, pension or other income you expect." },
    keywords: ["retire", "corpus", "pension", "post retirement", "nest egg"],
    related: ["goal-sip", "sip", "ppf"],
  },
  "step-up": {
    about: "Shows how a monthly SIP that increases by a fixed percentage every year could grow.",
    meaning: "The step-up raises your instalment each year, usually in line with income growth. The final-year SIP shows what you would be investing each month at the end.",
    faq: { q: "How is a step-up SIP different from a normal SIP?", a: "A normal SIP stays the same. A step-up SIP rises each year, so the same starting amount usually builds a larger corpus." },
    keywords: ["step up", "top up", "increasing sip", "annual increase"],
    related: ["sip", "goal-sip", "lumpsum"],
  },
  dcf: {
    about: "Estimates a company's intrinsic value per share by discounting ten years of forecast free cash flow and a terminal value.",
    meaning: "The DCF value is what the model says one share is worth. Fair value applies your margin of safety. Compare it with the current price to see the upside or downside under your assumptions.",
    faq: { q: "Why does the result change so much with small edits?", a: "The terminal value usually makes up most of the total and is very sensitive to the discount rate and terminal growth. Test a range of values instead of relying on one figure." },
    keywords: ["discounted cash flow", "valuation", "intrinsic value", "fair value", "share price", "stock"],
    related: ["cagr", "lumpsum"],
  },
  emi: {
    about: "Calculates the monthly EMI, total interest and total payable for a loan with a fixed interest rate.",
    meaning: "The EMI is the fixed monthly payment. Total interest shows the cost of borrowing, and the chart shows the outstanding balance falling as you repay.",
    faq: { q: "Does a longer tenure reduce my cost?", a: "It lowers the EMI but increases total interest. Compare tenures to find a payment you can afford without paying more interest than necessary." },
    keywords: ["loan", "home loan", "car loan", "personal loan", "monthly payment", "mortgage"],
    related: ["compound-interest", "goal-sip"],
  },
  ppf: {
    about: "Projects the maturity value of a Public Provident Fund account for a chosen deposit frequency and tenure.",
    meaning: "Total deposits, interest earned and maturity value are shown together. Interest is credited yearly, so deposits made earlier in the year earn more.",
    faq: { q: "Is the PPF interest rate fixed?", a: "No. The government notifies the rate periodically. The calculator uses one constant rate, so update it if the notified rate changes." },
    keywords: ["public provident fund", "provident fund", "tax saving", "15 year", "small savings"],
    related: ["fd", "rd", "retirement"],
  },
  fd: {
    about: "Calculates the maturity amount of a fixed deposit for a chosen compounding frequency.",
    meaning: "Interest earned is the maturity amount minus the deposit. The effective yearly yield shows the annual return after compounding.",
    faq: { q: "Is FD interest taxable?", a: "Interest is generally taxable as income and banks may deduct TDS. This calculator does not apply tax, so your after-tax return will be lower." },
    keywords: ["fixed deposit", "bank deposit", "term deposit", "fd", "maturity"],
    related: ["rd", "ppf", "compound-interest"],
  },
  rd: {
    about: "Estimates the maturity value of a recurring deposit made every month, with interest compounded quarterly.",
    meaning: "Total deposits and interest earned add up to the maturity value. Banks round differently, so the maturity amount on your receipt can differ by a small amount.",
    faq: { q: "What is the minimum tenure?", a: "This calculator requires at least six months. Individual banks may offer different minimum tenures." },
    keywords: ["recurring deposit", "rd", "monthly deposit", "bank", "post office"],
    related: ["fd", "ppf", "sip"],
  },
  "compound-interest": {
    about: "Shows how a lumpsum, with optional regular deposits, grows when interest is compounded at a chosen frequency.",
    meaning: "Total invested and interest earned add up to the future value. More frequent compounding adds a little; the rate and the time invested matter most.",
    faq: { q: "Which compounding frequency should I choose?", a: "Use the frequency stated in your product's terms. If you are unsure, quarterly is common for bank deposits and yearly is a simple, safe assumption." },
    keywords: ["interest", "compounding", "savings", "regular deposit", "growth"],
    related: ["lumpsum", "fd", "sip"],
  },
  cagr: {
    about: "Calculates the compound annual growth rate between a beginning value and an ending value over a period.",
    meaning: "CAGR is the constant yearly rate that would take the beginning value to the ending value. It smooths out ups and downs, so it does not show volatility along the way.",
    faq: { q: "Can I use CAGR when I made several deposits?", a: "No. CAGR assumes a single beginning value and no cash flows in between. For regular investments, use an XIRR calculation instead." },
    keywords: ["compound annual growth rate", "growth rate", "annualised return", "returns"],
    related: ["lumpsum", "sip", "dcf"],
  },
};
