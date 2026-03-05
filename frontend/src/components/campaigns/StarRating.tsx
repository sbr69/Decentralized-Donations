"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (val: number) => void;
  readonly?: boolean;
  size?: number;
}

export function StarRating({
  value,
  onChange,
  readonly = false,
  size = 20,
}: StarRatingProps) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={cn(
            "transition-colors",
            readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
          )}
        >
          <Star
            style={{ width: size, height: size }}
            className={cn(
              star <= value
                ? "fill-[#e09f3e] text-[#e09f3e]"
                : "fill-transparent text-[#e8e4dd]"
            )}
          />
        </button>
      ))}
    </div>
  );
}
