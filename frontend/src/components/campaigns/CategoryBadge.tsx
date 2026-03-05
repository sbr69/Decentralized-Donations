"use client";

import { Badge } from "@/components/ui/badge";
import { CATEGORIES } from "@/lib/contracts";

interface CategoryBadgeProps {
  categoryId: number;
}

const COLORS: Record<number, string> = {
  0: "bg-red-50/80 text-red-700 border-red-200/60",
  1: "bg-sky-50/80 text-sky-700 border-sky-200/60",
  2: "bg-amber-50/80 text-amber-700 border-amber-200/60",
  3: "bg-purple-50/80 text-purple-700 border-purple-200/60",
  4: "bg-[#2d6a4f]/5 text-[#2d6a4f] border-[#2d6a4f]/15",
  5: "bg-teal-50/80 text-teal-700 border-teal-200/60",
  6: "bg-fuchsia-50/80 text-fuchsia-700 border-fuchsia-200/60",
  7: "bg-[#f0ede8] text-[#6b6b7b] border-[#e8e4dd]",
};

export function CategoryBadge({ categoryId }: CategoryBadgeProps) {
  const label = CATEGORIES[categoryId] ?? "Other";
  const color = COLORS[categoryId] ?? COLORS[7];

  return (
    <Badge variant="outline" className={color}>
      {label}
    </Badge>
  );
}
