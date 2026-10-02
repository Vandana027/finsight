import type { Metadata } from "next";
import { Suspense } from "react";
import CatalogueClient from "@/components/CatalogueClient";
import { calculators } from "@/data/calculators";

export const metadata: Metadata = {
  title: "All Financial Calculators | FinSight",
  description: `Search ${calculators.length} free Indian financial calculators: SIP, lumpsum, step-up SIP, CAGR, FD, RD, PPF, EMI, retirement and more.`,
  alternates: { canonical: "/calculators" },
};

export default function Page() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-5xl">Financial calculators</h1>
        <p className="mt-4 text-lg leading-8 text-stone-700">Search by name or browse by what you want to do: invest, save, plan or borrow.</p>
      </div>
      <div className="mt-10"><Suspense fallback={<div className="h-40" aria-hidden="true" />}><CatalogueClient /></Suspense></div>
    </div>
  );
}
