import { Banknote, Calculator, CalendarClock, ChartNoAxesColumnIncreasing, Flag, Landmark, Layers, Percent, PiggyBank, Sunset, TrendingUp, Vault } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { IconName } from "@/types/calculators";

const ICONS: Record<IconName, LucideIcon> = { Banknote, Calculator, CalendarClock, ChartNoAxesColumnIncreasing, Flag, Landmark, Layers, Percent, PiggyBank, Sunset, TrendingUp, Vault };

export default function Icon({ name, className }: { name: IconName; className?: string }) {
  const Glyph = ICONS[name];
  return <Glyph className={className} aria-hidden="true" />;
}
