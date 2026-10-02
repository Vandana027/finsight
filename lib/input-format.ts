import type { Field } from "@/types/calculators";

/** Removes digit grouping, rupee signs and whitespace so pasted values such as "₹ 1,25,000" parse cleanly. */
export function stripGrouping(value: string) {
  return value.replace(/[,₹\s]/g, "");
}

/** True for plain decimal numbers only ("12", "12.5", ".5", "-3"); rejects "1e5", "0x10", "Infinity". */
export const isPlainNumber = (value: string) => /^-?(\d+\.?\d*|\.\d+)$/.test(value);

export function formatEditableValue(field: Field, value: string) {
  const normalized = stripGrouping(value);
  if (field.kind !== "currency" || !isPlainNumber(normalized)) return value;
  const negative = normalized.startsWith("-");
  const [integer, decimal] = normalized.replace("-", "").split(".");
  const grouped = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Number(integer || 0));
  return `${negative ? "-" : ""}${grouped}${decimal !== undefined ? `.${decimal}` : ""}`;
}
