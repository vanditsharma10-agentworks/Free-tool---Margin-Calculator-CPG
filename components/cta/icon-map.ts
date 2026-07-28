import { ShieldCheck, Truck, Users, Zap, type LucideIcon } from "lucide-react";

/** Maps the string `icon` keys in cta.json to lucide components, so the data
 *  can stay JSON-serializable. Extend as new stats need new icons. */
export const iconMap: Record<string, LucideIcon> = {
  users: Users,
  zap: Zap,
  "shield-check": ShieldCheck,
  truck: Truck,
};

export const fallbackIcon: LucideIcon = Zap;
