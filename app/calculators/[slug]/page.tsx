import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ChevronRight, Info } from "lucide-react";
import CalculatorClient from "@/components/CalculatorClient";
import CalculatorCard from "@/components/CalculatorCard";
import { calculators, defaultsOf, getCalc } from "@/data/calculators";
import { content } from "@/data/content";
import { fmtField } from "@/lib/format";
import { relatedCalculators } from "@/lib/search";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => calculators.map((c) => ({ slug: c.slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const calc = getCalc((await params).slug);
  if (!calc) return {};
  const title = `${calc.title} | FinSight`;
  const description = content[calc.slug].about;
  return { title, description, alternates: { canonical: `/calculators/${calc.slug}` }, openGraph: { title, description, type: "website", url: `/calculators/${calc.slug}` } };
}

const Card = ({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) => (
  <article className="rounded-3xl border border-stone-200 bg-white p-6 shadow-[0_8px_30px_rgba(20,35,28,0.035)] sm:p-7">
    <div className="flex items-center justify-between gap-3"><h3 className="text-lg font-bold text-ink">{title}</h3>{badge && <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-brand">{badge}</span>}</div>
    <div className="mt-4 text-sm leading-7 text-stone-700">{children}</div>
  </article>
);

export default async function Page({ params }: Props) {
  const calc = getCalc((await params).slug);
  if (!calc) notFound();
  const info = content[calc.slug];
  const defaults = defaultsOf(calc), example = calc.compute(defaults);
  const inputs = calc.fields.filter((f) => !f.showIf || f.showIf(defaults)).map((f) => `${f.label}: ${fmtField(f, defaults[f.key])}`).join("; ");
  const faqs = [
    info.faq,
    { q: "Are the results guaranteed?", a: "No. They are estimates based on the inputs and assumptions listed on this page. Actual returns, rates, taxes and charges may differ." },
    { q: "Can I try different assumptions?", a: "Yes. Change any input and the estimate updates immediately. Use Reset to return to the default values." },
  ];
  const related = relatedCalculators(calculators, calc);
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-stone-600">
        <Link href="/" className="hover:text-brand">Home</Link><ChevronRight size={14} aria-hidden="true" />
        <Link href="/calculators" className="hover:text-brand">Calculators</Link><ChevronRight size={14} aria-hidden="true" />
        <span aria-current="page" className="text-stone-800">{calc.title}</span>
      </nav>
      <header className="py-7 sm:py-9">
        <span className="inline-flex rounded-full bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand">{calc.category}</span>
        <h1 className="mt-4 max-w-4xl text-3xl font-bold tracking-tight text-ink sm:text-5xl">{calc.title}</h1>
        <p className="mt-3 max-w-3xl text-lg leading-8 text-stone-700">{calc.short}</p>
        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-stone-700">
          {["Free to use", "Instant results", "Transparent assumptions"].map((t) => <li key={t} className="inline-flex items-center gap-1.5"><CheckCircle2 size={14} className="text-brand" aria-hidden="true" />{t}</li>)}
        </ul>
      </header>

      <CalculatorClient slug={calc.slug} />

      <section aria-labelledby="about-h" className="mt-16">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Understand the number</p>
        <h2 id="about-h" className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">About the {calc.title}</h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-stone-700">{info.about}</p>
        <div className="mt-7 grid gap-5 lg:grid-cols-2">
          <Card title="What the result means">{info.meaning}</Card>
          <Card title="Formula" badge="Method"><p className="rounded-2xl bg-stone-50 p-4 font-mono text-[13px] leading-6 text-stone-800">{calc.formula}</p></Card>
          <Card title="Worked example" badge="Default inputs">{inputs}. With these values the estimate for “{example.headline.label}” is <strong className="text-ink">{example.headline.value}</strong>.</Card>
          <Card title="Important assumptions"><ul className="space-y-3">{calc.assumptions.map((a) => <li key={a} className="flex gap-3"><span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" /><span>{a}</span></li>)}</ul></Card>
        </div>
      </section>

      <aside aria-label="Disclaimer" className="mt-6 flex gap-3 rounded-3xl border border-brand/15 bg-brand-soft p-5 sm:p-6">
        <Info size={19} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
        <p className="text-sm leading-6 text-stone-700"><strong className="text-ink">Estimates only.</strong> These calculations are for education and planning. Actual investment, loan and tax outcomes depend on the assumptions entered and may differ. This is not financial, tax or legal advice.</p>
      </aside>

      {related.length > 0 && (
        <section aria-labelledby="related-h" className="mt-14">
          <div className="flex items-end justify-between gap-4"><h2 id="related-h" className="text-2xl font-bold text-ink">Related calculators</h2><Link href="/calculators" className="text-sm font-semibold text-brand hover:underline">View all →</Link></div>
          <div className={`mt-5 grid gap-4 sm:grid-cols-2 ${related.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>{related.map((c) => <CalculatorCard key={c.slug} calc={c} />)}</div>
        </section>
      )}

      <section aria-labelledby="faq-h" className="mt-14 pb-16">
        <h2 id="faq-h" className="text-2xl font-bold text-ink">Frequently asked questions</h2>
        <div className="mt-4 divide-y divide-stone-200 rounded-3xl border border-stone-200 bg-white">
          {faqs.map((f) => (
            <details key={f.q} className="px-5 py-4"><summary className="cursor-pointer pr-8 font-semibold text-ink">{f.q}</summary><p className="mt-2 max-w-3xl text-sm leading-6 text-stone-700">{f.a}</p></details>
          ))}
        </div>
      </section>
    </div>
  );
}
