"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import CalculatorCard from "@/components/CalculatorCard";
import { calculators, CATEGORIES } from "@/data/calculators";
import { searchCalculators } from "@/lib/search";

export default function CatalogueClient() {
  const requested = useSearchParams().get("category") ?? "";
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES.some((c) => c === requested) ? requested : "All");
  const searchRef = useRef<HTMLInputElement>(null);
  const list = useMemo(() => searchCalculators(calculators, query, category), [query, category]);

  useEffect(() => { if (window.location.hash === "#search") searchRef.current?.focus(); }, []);

  return (
    <div>
      <div id="search" className="relative max-w-2xl scroll-mt-24">
        <label htmlFor="search-box" className="sr-only">Search calculators</label>
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-500" aria-hidden="true" />
        <input ref={searchRef} id="search-box" type="search" value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" placeholder="Search SIP, EMI, PPF, CAGR…"
          className="w-full rounded-2xl border border-stone-300 bg-white py-4 pl-12 pr-4 text-[15px] outline-none transition placeholder:text-stone-500 focus:border-brand focus:ring-4 focus:ring-brand/10" />
      </div>
      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
        {["All", ...CATEGORIES].map((c) => (
          <button key={c} type="button" onClick={() => setCategory(c)} aria-pressed={category === c}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${category === c ? "border-brand bg-brand text-white" : "border-stone-300 bg-white text-stone-700 hover:border-brand hover:text-brand"}`}>
            {c} <span className={category === c ? "text-white/80" : "text-stone-500"}>({c === "All" ? calculators.length : calculators.filter((x) => x.category === c).length})</span>
          </button>
        ))}
      </div>
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-ink">{category === "All" ? "All calculators" : `${category} calculators`}</h2>
        <p className="mt-1 text-sm text-stone-600" role="status">{list.length} {list.length === 1 ? "calculator" : "calculators"} found</p>
      </div>
      {list.length ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{list.map((c) => <CalculatorCard key={c.slug} calc={c} />)}</div>
      ) : (
        <p className="mt-6 rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-700">No calculator matches that search. Try “SIP”, “loan” or “tax”, or clear the filter.</p>
      )}
    </div>
  );
}
