"use client";

import { cn } from "@/lib/utils";
import type { Rank } from "@/lib/types/database";
import { RANK_COLORS } from "@/lib/types/game";

interface RankBadgeProps {
  rank: Rank;
  size?: "sm" | "md" | "lg";
}

export function RankBadge({ rank, size = "md" }: RankBadgeProps) {
  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-sm",
    lg: "h-12 w-12 text-lg",
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-lg border-2 font-bold",
        sizeClasses[size],
        RANK_COLORS[rank],
        rank === "S" && "animate-pulse border-rank-s shadow-[0_0_10px_rgba(239,68,68,0.5)]",
        rank === "A" && "border-rank-a shadow-[0_0_8px_rgba(245,158,11,0.3)]",
        rank === "B" && "border-rank-b",
        rank === "C" && "border-rank-c",
        rank === "D" && "border-rank-d",
        rank === "E" && "border-rank-e"
      )}
    >
      {rank}
    </div>
  );
}
