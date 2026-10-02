import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Icon from "@/components/Icon";
import type { Calc } from "@/types/calculators";
export default function CalculatorCard({ calc }: { calc: Calc }) {
  return (
    <Link href={`/calculators/${calc.slug}`} className="group flex h-full flex-col rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_4px_18px_rgba(20,35,28,0.035)] transition hover:-transtone-y-0.5 hover:border-brand/30 hover:shadow-[0_16px_32px_rgba(20,35,28,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand"><Icon name={calc.icon} className="h-5 w-5" /></span>
        <ArrowUpRight size={18} className="text-stone-400 transition group-hover:text-brand" aria-hidden="true" />
      </div>
      <h3 className="mt-5 text-[17px] font-semibold text-stone-900">{calc.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-stone-600">{calc.short}</p>
      <span className="mt-5 text-sm font-semibold text-brand">Open calculator →</span>
    </Link>
  );
}
