"use client";
import dynamic from "next/dynamic";
import { useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { AlertCircle, Calculator, RotateCcw } from "lucide-react";
import { getCalc } from "@/data/calculators";
import { formatCrore, formatCurrency, fmtField } from "@/lib/format";
import { formatEditableValue, stripGrouping } from "@/lib/input-format";
import { validateField } from "@/lib/validation";
import type { Field, Result } from "@/types/calculators";

const ResultCharts = dynamic(() => import("@/components/ResultCharts"), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse rounded-3xl border border-stone-200 bg-white" aria-hidden="true" />,
});

const suffix = (f: Field) => (f.kind === "percent" ? "%" : f.kind === "years" ? "yrs" : "");
const placeholder = (f: Field) => ({ currency: "e.g. 1,00,000", percent: "e.g. 12", years: "e.g. 10", number: "Enter a value", select: "" })[f.kind];
const hasSlider = (f: Field) => f.kind === "percent" || f.kind === "years";
const parse = (text: string) => Number(stripGrouping(text));

export default function CalculatorClient({ slug }: { slug: string }) {
  const calc = getCalc(slug);
  if (!calc) throw new Error(`Unknown calculator: ${slug}`);
  return <CalculatorForm calc={calc} />;
}

function CalculatorForm({ calc }: { calc: NonNullable<ReturnType<typeof getCalc>> }) {
  const defaults = useMemo(() => Object.fromEntries(calc.fields.map((f) => [f.key, String(f.def)])), [calc]);
  const [raw, setRaw] = useState<Record<string, string>>(defaults);
  const resultRef = useRef<HTMLElement>(null);

  const nums = Object.fromEntries(calc.fields.map((f) => [f.key, parse(raw[f.key])]));
  const visible = calc.fields.filter((f) => !f.showIf || f.showIf(nums));
  const errors = Object.fromEntries(visible.map((f) => [f.key, validateField(f, raw[f.key])]));
  const invalid = Object.values(errors).some(Boolean);

  const result: Result | null = useMemo(() => {
    if (invalid) return null;
    try {
      // Hidden (conditional) fields never reach the calculation: they fall back to their defaults.
      const entered = Object.fromEntries(calc.fields.map((f) => [f.key, parse(raw[f.key])]));
      return calc.compute(Object.fromEntries(calc.fields.map((f) => [f.key, !f.showIf || f.showIf(entered) ? entered[f.key] : f.def])));
    } catch {
      return { headline: { label: "", value: "" }, stats: [], error: "These inputs could not be calculated. Adjust them and try again." };
    }
  }, [calc, raw, invalid]);

  const format = (n: number) => (result?.unit === "cr" ? formatCrore(n) : formatCurrency(n));
  const update = (key: string, value: string) => setRaw((prev) => ({ ...prev, [key]: value }));
  const reset = () => setRaw(defaults);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const first = visible.find((f) => errors[f.key]);
    if (first) document.getElementById(`f-${first.key}`)?.focus();
    else resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="grid grid-cols-1 gap-7 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
      <form onSubmit={submit} noValidate aria-label={`${calc.title} inputs`} className="min-w-0 overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-[0_12px_40px_rgba(20,35,28,0.06)]">
        <div className="border-b border-stone-100 px-5 py-5 sm:px-7">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Inputs</p>
          <h2 className="mt-1 text-lg font-semibold text-ink">Enter your numbers</h2>
          <p className="mt-1 text-xs text-stone-600">All fields are required. Results update as you type.</p>
        </div>

        <div className="space-y-6 px-5 py-6 sm:px-7">
          {visible.map((f) => {
            const id = `f-${f.key}`, err = errors[f.key], current = nums[f.key];
            const radios = f.kind === "select" && f.options!.length <= 4;
            return (
              <div key={f.key}>
                <label id={`${id}-l`} htmlFor={radios ? undefined : id} className="text-[15px] font-semibold text-stone-900">{f.label}</label>
                {f.hint && <p id={`${id}-hint`} className="mt-1 max-w-xl text-xs leading-5 text-stone-600">{f.hint}</p>}

                {radios ? (
                  <div role="radiogroup" aria-labelledby={`${id}-l`} className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {f.options!.map((o) => (
                      <button key={o.value} type="button" role="radio" aria-checked={current === o.value} onClick={() => update(f.key, String(o.value))}
                        className={`min-h-11 rounded-xl border px-3 text-sm font-semibold transition ${current === o.value ? "border-brand bg-brand text-white shadow-sm" : "border-stone-200 bg-white text-stone-700 hover:border-brand/50 hover:text-brand"}`}>{o.label}</button>
                    ))}
                  </div>
                ) : f.kind === "select" ? (
                  <select id={id} value={raw[f.key]} onChange={(ev) => update(f.key, ev.target.value)} aria-describedby={f.hint ? `${id}-hint` : undefined} className="mt-3 w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-[15px] outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10">
                    {f.options!.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : (
                  <>
                    <div className={`mt-3 flex items-center rounded-xl border bg-white transition focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10 ${err ? "border-rose-500" : "border-stone-300"}`}>
                      {f.kind === "currency" && <span className="pl-4 text-[15px] font-medium text-stone-600" aria-hidden="true">₹</span>}
                      <input id={id} inputMode="decimal" autoComplete="off" placeholder={placeholder(f)} value={raw[f.key]} aria-invalid={!!err} aria-required="true"
                        aria-describedby={[f.hint ? `${id}-hint` : "", `${id}-range`, err ? `${id}-err` : ""].filter(Boolean).join(" ")}
                        onFocus={() => f.kind === "currency" && update(f.key, stripGrouping(raw[f.key]))}
                        onBlur={() => f.kind === "currency" && update(f.key, formatEditableValue(f, raw[f.key]))}
                        onChange={(ev) => update(f.key, ev.target.value)}
                        className="w-full min-w-0 bg-transparent px-3 py-3.5 text-[15px] font-medium tabular-nums outline-none placeholder:text-stone-400" />
                      {suffix(f) && <span className="pr-4 text-sm text-stone-600" aria-hidden="true">{suffix(f)}</span>}
                    </div>
                    {hasSlider(f) && (
                      <input type="range" aria-label={`${f.label} slider`} min={f.min} max={f.max} step={f.step} value={Number.isFinite(current) ? Math.min(f.max, Math.max(f.min, current)) : f.min}
                        onChange={(ev) => update(f.key, ev.target.value)} className="mt-3 w-full accent-brand" />
                    )}
                    <p id={`${id}-range`} className="mt-1.5 text-xs text-stone-600">Allowed range: {fmtField(f, f.min)} to {fmtField(f, f.max)}</p>
                  </>
                )}
                {err && <p id={`${id}-err`} role="alert" className="mt-1.5 text-sm font-medium text-rose-700">{err}</p>}
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 border-t border-stone-100 bg-stone-50 px-5 py-5 sm:flex-row sm:px-7">
          <button type="submit" className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3.5 text-[15px] font-semibold text-white transition hover:bg-brand-dark">
            <Calculator size={17} aria-hidden="true" /> Calculate
          </button>
          <button type="button" onClick={reset} className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-5 py-3.5 text-[15px] font-semibold text-stone-700 transition hover:border-brand hover:text-brand">
            <RotateCcw size={16} aria-hidden="true" /> Reset
          </button>
        </div>
      </form>

      <section ref={resultRef} aria-label="Results" className="min-w-0 space-y-4 scroll-mt-24 lg:sticky lg:top-24 lg:self-start">
        {!result || result.error ? (
          <div className="rounded-3xl border border-stone-200 bg-white p-7 shadow-[0_12px_40px_rgba(20,35,28,0.05)]">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-soft text-brand"><AlertCircle size={20} aria-hidden="true" /></div>
            <h2 className="mt-4 text-xl font-semibold text-ink">{result?.error ? "We can't calculate this yet" : "Check your inputs"}</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-stone-700" role="status">{result?.error ?? "Correct the highlighted fields to see your estimate."}</p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-3xl bg-brand text-white shadow-[0_16px_50px_rgba(15,61,46,0.18)]">
              <div className="px-6 py-7 sm:px-7">
                <div aria-live="polite" aria-atomic="true">
                  <p className="text-sm font-medium text-white/80">{result.headline.label} <span className="ml-1 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold">Estimate</span></p>
                  <p className="mt-1 break-all text-4xl font-bold tracking-tight sm:text-5xl">{result.headline.value}</p>
                </div>
                <dl className="mt-6 grid gap-3 sm:grid-cols-2">
                  {result.stats.map((s) => (
                    <div key={s.label} className="min-w-0 rounded-2xl bg-white/10 px-4 py-3">
                      <dt className="text-xs text-white/75">{s.label}</dt>
                      <dd className="mt-1 break-words text-[15px] font-semibold">{s.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <p className="border-t border-white/15 px-6 py-3 text-xs text-white/75 sm:px-7">Based on the inputs and assumptions shown on this page. Actual outcomes may differ.</p>
            </div>
            <ResultCharts result={result} format={format} />
          </>
        )}
      </section>
    </div>
  );
}
