export type IconName = "Banknote" | "Calculator" | "CalendarClock" | "ChartNoAxesColumnIncreasing" | "Flag" | "Landmark" | "Layers" | "Percent" | "PiggyBank" | "Sunset" | "TrendingUp" | "Vault";
export type Category = "Invest" | "Save" | "Plan" | "Borrow";
export type Field = {
  key: string; label: string;
  kind: "currency" | "percent" | "years" | "number" | "select";
  def: number; min: number; max: number; step: number;
  options?: { label: string; value: number }[];
  showIf?: (v: Record<string, number>) => boolean; hint?: string;
};
export type Result = {
  headline: { label: string; value: string };
  stats: { label: string; value: string }[];
  pie?: { name: string; value: number }[];
  chart?: { labels: string[]; lines: { name: string; values: number[] }[] };
  unit?: "cr";
  error?: string;
};
export type Calc = {
  slug: string; title: string; short: string; category: Category; icon: IconName; popular?: boolean;
  fields: Field[]; compute: (v: Record<string, number>) => Result;
  formula: string; assumptions: string[];
};
