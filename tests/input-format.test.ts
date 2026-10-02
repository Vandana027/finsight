import { describe, expect, it } from "vitest";
import { formatEditableValue, stripGrouping } from "@/lib/input-format";
import { validateField } from "@/lib/validation";
import type { Field } from "@/types/calculators";

describe("input formatting", () => {
  const currency: Field = { key: "amount", label: "Amount", kind: "currency", def: 100000, min: 500, max: 1e8, step: 500 };
  const percent: Field = { key: "rate", label: "Rate", kind: "percent", def: 12, min: 0, max: 30, step: 0.1 };

  it("formats Indian currency groups on blur", () => {
    expect(formatEditableValue(currency, "100000")).toBe("1,00,000");
    expect(formatEditableValue(currency, "1250000.5")).toBe("12,50,000.5");
  });

  it("keeps non-currency fields untouched", () => {
    expect(formatEditableValue(percent, "12.5")).toBe("12.5");
  });

  it("parses grouped values consistently", () => {
    expect(stripGrouping("1,25,000")).toBe("125000");
    expect(validateField(currency, "1,25,000")).toBeNull();
  });
});
