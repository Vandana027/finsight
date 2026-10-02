import type { Field } from "@/types/calculators";
import { fmtField } from "@/lib/format";
import { isPlainNumber, stripGrouping } from "@/lib/input-format";

/** Returns a user-facing error message, or null when the raw text is a valid value for the field. */
export function validateField(f: Field, raw: string): string | null {
  if (f.kind === "select") return null;
  const text = stripGrouping(raw);
  if (text === "") return `Enter a value for ${f.label.toLowerCase()}.`;
  if (!isPlainNumber(text)) return "Enter a valid number, using digits and an optional decimal point.";
  const n = Number(text);
  if (!Number.isFinite(n)) return "Enter a valid number.";
  if (f.kind === "years" && f.step >= 1 && !Number.isInteger(n)) return "Enter a whole number of years.";
  if (n < f.min) return `Must be at least ${fmtField(f, f.min)}.`;
  if (n > f.max) return `Must be at most ${fmtField(f, f.max)}.`;
  return null;
}
