"use client";

import { Badge } from "@/components/ui/badge";
import { CATEGORIES } from "@/lib/contracts";

interface CategoryBadgeProps {
  categoryId: number;
}

const COLORS: Record<number, string> = {
  0: "bg-rose-50 text-rose-700 border-rose-200",
  1: "bg-blue-50 text-blue-700 border-blue-200",
  2: "bg-orange-50 text-orange-700 border-orange-200",
  3: "bg-violet-50 text-violet-700 border-violet-200",
  4: "bg-emerald-50 text-emerald-700 border-emerald-200",
  5: "bg-cyan-50 text-cyan-700 border-cyan-200",
  6: "bg-pink-50 text-pink-700 border-pink-200",
  7: "bg-gray-50 text-gray-700 border-gray-200",
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
