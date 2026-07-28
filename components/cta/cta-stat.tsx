import { fallbackIcon, iconMap } from "./icon-map";
import type { CtaStatItem } from "./types";

/** One data point: a small icon + label (e.g. "7M+ tasks automated"). */
export function CtaStat({ icon, label }: CtaStatItem) {
  const Icon = iconMap[icon] ?? fallbackIcon;

  return (
    <li className="flex items-center gap-2.5">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className="text-base text-foreground">{label}</span>
    </li>
  );
}
