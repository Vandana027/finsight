import type { Field } from "@/types/calculators";
export const formatNumber = (n: number, digits = 2) =>
  Number.isFinite(n) ? new Intl.NumberFormat("en-IN", { maximumFractionDigits: digits }).format(n) : "–";
export const formatCurrency = (n: number) => {
  if (!Number.isFinite(n)) return "–";
  const r = Math.round(n);
  return (r < 0 ? "-₹" : "₹") + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.abs(r));
};
export const formatPercent = (n: number, digits = 2) => `${formatNumber(n, digits)}%`;
export const formatCrore = (n: number) => `₹${formatNumber(n, 2)} Cr`;
export const formatDuration = (totalMonths: number) => {
  const m = Math.ceil(totalMonths - 1e-9);
  const y = Math.floor(m / 12), mo = m % 12;
  return [y ? `${y} yr${y > 1 ? "s" : ""}` : "", mo ? `${mo} mo` : ""].filter(Boolean).join(" ") || "0 mo";
};
export const compactINR = (n: number) => new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(n);
export function fmtField(f: Field, v: number) {
  if (f.kind === "currency") return formatCurrency(v);
  if (f.kind === "percent") return formatPercent(v, 2);
  if (f.kind === "years") return `${formatNumber(v)} yrs`;
  if (f.kind === "select") return f.options?.find((o) => o.value === v)?.label ?? String(v);
  return formatNumber(v);
}
