"use client";

import { cn } from "@/lib/utils";

interface StatBarProps {
  label: string;
  current: number;
  max: number;
  color: string;
  showValues?: boolean;
}

export function StatBar({ label, current, max, color, showValues = true }: StatBarProps) {
  const percentage = max > 0 ? Math.min(100, (current / max) * 100) : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-muted-foreground">{label}</span>
        {showValues && (
          <span className="tabular-nums text-muted-foreground">
            {current}/{max}
          </span>
        )}
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
