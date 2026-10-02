"use client";
import { Cell, CartesianGrid, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { compactINR } from "@/lib/format";
import type { Result } from "@/types/calculators";

const COLORS = ["#0f3d2e", "#6fae8f", "#a97a2c", "#57534e"];
const MAX_TABLE_ROWS = 60;

type Props = { result: Result; format: (n: number) => string };

/** Breakdown donut, trend line and an accessible data table. Loaded lazily so Recharts stays out of the initial bundle. */
export default function ResultCharts({ result, format }: Props) {
  const { pie, chart } = result;
  const rows = chart ? chart.labels.map((label, i) => ({ label, ...Object.fromEntries(chart.lines.map((l) => [l.name, Math.round(l.values[i] * 100) / 100])) })) : [];
  const title = chart ? `${chart.lines.map((l) => l.name).join(" vs ")}, year by year` : "";
  const last = rows[rows.length - 1];
  const summary = chart && last ? `${title}. At ${last.label}: ${chart.lines.map((l) => `${l.name} ${format(Number(last[l.name as keyof typeof last]))}`).join(", ")}.` : "";
  return (
    <>
      {pie && (
        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-[0_12px_40px_rgba(20,35,28,0.05)] sm:p-6">
          <h3 className="font-semibold text-stone-900">Breakdown</h3>
          <p className="mt-1 text-xs text-stone-600">How the total is made up.</p>
          <div className="mt-4 grid items-center gap-4 sm:grid-cols-[190px_1fr]">
            <div className="h-48" role="img" aria-label={`Breakdown: ${pie.map((p) => `${p.name} ${format(p.value)}`).join(", ")}`}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={pie} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="95%" stroke="none">{pie.map((p, i) => <Cell key={p.name} fill={COLORS[i % COLORS.length]} />)}</Pie></PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-3 text-sm">
              {pie.map((p, i) => (
                <li key={p.name} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-stone-700"><span className="h-3 w-3 shrink-0 rounded-full" style={{ background: COLORS[i % COLORS.length] }} aria-hidden="true" />{p.name}</span>
                  <span className="font-semibold text-stone-900">{format(p.value)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {chart && (
        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-[0_12px_40px_rgba(20,35,28,0.05)] sm:p-6">
          <h3 className="font-semibold text-stone-900">{title.charAt(0).toUpperCase() + title.slice(1)}</h3>
          <p className="mt-1 text-xs text-stone-600">Illustrative projection from your inputs. It is not a forecast of market returns.</p>
          <div className="mt-4 h-64" role="img" aria-label={summary}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rows} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                <CartesianGrid stroke="#e7e5e4" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#57534e" }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: "#57534e" }} width={52} tickFormatter={(n) => compactINR(Number(n))} />
                <Tooltip formatter={(n) => format(Number(n))} contentStyle={{ borderRadius: 12, borderColor: "#e7e5e4" }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {chart.lines.map((l, i) => <Line key={l.name} type="monotone" dataKey={l.name} stroke={COLORS[i % COLORS.length]} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />)}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <details className="mt-4 rounded-xl border border-stone-200 px-4 py-3 text-sm">
            <summary className="cursor-pointer font-medium text-stone-800">View the data as a table</summary>
            <div className="mt-3 max-h-72 overflow-auto">
              <table className="w-full text-left text-xs">
                <caption className="sr-only">{title}</caption>
                <thead><tr className="border-b border-stone-200 text-stone-600"><th scope="col" className="py-2 pr-3 font-semibold">Period</th>{chart.lines.map((l) => <th key={l.name} scope="col" className="py-2 pr-3 text-right font-semibold">{l.name}</th>)}</tr></thead>
                <tbody>
                  {rows.slice(0, MAX_TABLE_ROWS).map((r) => (
                    <tr key={r.label} className="border-b border-stone-100"><th scope="row" className="py-1.5 pr-3 font-medium text-stone-700">{r.label}</th>{chart.lines.map((l) => <td key={l.name} className="py-1.5 pr-3 text-right tabular-nums">{format(Number(r[l.name as keyof typeof r]))}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      )}
    </>
  );
}
