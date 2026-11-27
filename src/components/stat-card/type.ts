import type { LucideIcon } from "lucide-react";

export type StatCardProps = {
  label: string;
  value: number;
  detail: string;
  icon: LucideIcon;
  tone: "rose" | "lilac" | "mint" | "sand";
  ratio?: number;
};
