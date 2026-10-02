import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, FunctionSquare, IndianRupee } from "lucide-react";
import CalculatorCard from "@/components/CalculatorCard";
import { calculators, CATEGORIES } from "@/data/calculators";
import type { Category } from "@/types/calculators";
import { TAGLINE } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `FinSight – Smart Indian Financial Calculators | ${TAGLINE}` },
  description: `Plan, compare and understand your money with ${calculators.length} simple, transparent Indian financial calculators for SIP, PPF, FD, EMI, retirement and more.`,
  alternates: { canonical: "/" },
};

const CATEGORY_INFO: Record<Category, string> = {
  Invest: "Grow money and measure returns.",
  Save: "Deposits and small savings.",
  Plan: "Work backwards from a goal.",
  Borrow: "Understand what a loan costs.",
};
const GOALS = [
  { label: "Build wealth steadily", slug: "sip" },
  { label: "Save for a specific goal", slug: "goal-sip" },
  { label: "Plan for retirement", slug: "retirement" },
  { label: "Compare deposit options", slug: "fd" },
  { label: "Understand a loan", slug: "emi" },
];
const TRUST = [
  { icon: IndianRupee, title: "Indian number formatting", text: "Figures appear the way you read them: ₹1,00,000, not ₹100000." },
  { icon: FunctionSquare, title: "Transparent formulas", text: "Every calculator shows its formula, assumptions and a worked example." },
  { icon: BadgeCheck, title: "Free, with no signup", text: "Everything runs in your browser. Your inputs are never sent anywhere." },
];

export default function Home() {
  const popular = calculators.filter((c) => c.popular);
  return (
    <>
      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:px-8 lg:py-24">
          <div>
            <p className="text-sm font-semibold text-brand">{TAGLINE}</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight text-ink sm:text-6xl">Smart Calculators for Better Financial Decisions</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-700">Plan, compare and understand your money with simple, transparent financial calculators.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/calculators" className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3.5 font-semibold text-white hover:bg-brand-dark">Explore Calculators <ArrowRight size={17} aria-hidden="true" /></Link>
              <a href="#popular" className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-5 py-3.5 font-semibold text-stone-800 hover:border-brand hover:text-brand">Popular Calculators</a>
            </div>
          </div>
          <div className="rounded-[28px] border border-brand/15 bg-gradient-to-br from-brand-soft via-white to-white p-6 sm:p-7">
            <h2 className="text-sm font-semibold text-brand">Start with what you want to do</h2>
            <ul className="mt-4 space-y-3">
              {GOALS.map((g) => {
                const c = calculators.find((x) => x.slug === g.slug)!;
                return (
                  <li key={g.slug}>
                    <Link href={`/calculators/${c.slug}`} className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3.5 transition hover:border-brand/40">
                      <span><span className="block font-semibold text-ink">{g.label}</span><span className="mt-0.5 block text-xs text-stone-600">{c.title}</span></span>
                      <ArrowRight size={17} className="shrink-0 text-stone-500" aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <section id="popular" aria-labelledby="popular-h" className="scroll-mt-24 py-14 sm:py-16">
          <div className="flex items-end justify-between gap-4">
            <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Start here</p><h2 id="popular-h" className="mt-2 text-2xl font-bold text-ink">Popular calculators</h2></div>
            <Link href="/calculators" className="text-sm font-semibold text-brand hover:underline">View all →</Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{popular.map((c) => <CalculatorCard key={c.slug} calc={c} />)}</div>
        </section>

        <section aria-label="Why FinSight" className="border-y border-stone-200 py-12">
          <ul className="grid gap-8 md:grid-cols-3">
            {TRUST.map(({ icon: I, title, text }) => (
              <li key={title} className="flex gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand"><I size={19} aria-hidden="true" /></span><div><p className="font-semibold text-ink">{title}</p><p className="mt-1 text-sm leading-6 text-stone-700">{text}</p></div></li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="browse-h" className="pb-16 pt-14">
          <h2 id="browse-h" className="text-2xl font-bold text-ink">Browse all {calculators.length} calculators</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.map((cat) => {
              const items = calculators.filter((c) => c.category === cat);
              return (
                <div key={cat} className="rounded-3xl border border-stone-200 bg-white p-6">
                  <h3 className="text-lg font-bold text-ink">{cat} <span className="text-sm font-semibold text-stone-500">({items.length})</span></h3>
                  <p className="mt-1 text-sm text-stone-600">{CATEGORY_INFO[cat]}</p>
                  <ul className="mt-4 space-y-2">
                    {items.map((c) => <li key={c.slug}><Link href={`/calculators/${c.slug}`} className="text-sm font-semibold text-brand hover:underline">{c.title}</Link></li>)}
                  </ul>
                  <Link href={`/calculators?category=${encodeURIComponent(cat)}`} className="mt-5 inline-block text-sm font-semibold text-stone-700 hover:text-brand">See these in the catalogue →</Link>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}
