import Link from "next/link";
import { calculators } from "@/data/calculators";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
      <p className="text-sm font-semibold text-brand">Error 404</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">We couldn’t find that page</h1>
      <p className="mt-4 text-stone-700">The link may be mistyped or the calculator may have moved. Try one of these instead.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/calculators" className="rounded-xl bg-brand px-5 py-3 font-semibold text-white hover:bg-brand-dark">Browse all calculators</Link>
        {calculators.filter((c) => c.popular).slice(0, 3).map((c) => <Link key={c.slug} href={`/calculators/${c.slug}`} className="rounded-xl border border-stone-300 bg-white px-5 py-3 font-semibold text-stone-800 hover:border-brand hover:text-brand">{c.title}</Link>)}
      </div>
    </div>
  );
}
