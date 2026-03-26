"use client";

import { cn } from "@/lib/utils";
import type { Player } from "@/lib/types/database";

interface StatBlockProps {
  player: Player;
}

const STAT_CONFIG = [
  { key: "str" as const, label: "STR", color: "text-red-400" },
  { key: "agi" as const, label: "AGI", color: "text-yellow-400" },
  { key: "vit" as const, label: "VIT", color: "text-green-400" },
  { key: "int" as const, label: "INT", color: "text-blue-400" },
  { key: "per" as const, label: "PER", color: "text-purple-400" },
];

export function StatBlock({ player }: StatBlockProps) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Stats
      </div>
      <div className="grid grid-cols-5 gap-1">
        {STAT_CONFIG.map((stat) => (
          <div
            key={stat.key}
            className="flex flex-col items-center rounded-lg bg-secondary/50 p-2"
          >
            <span className={cn("text-[10px] font-bold", stat.color)}>{stat.label}</span>
            <span className="text-sm font-semibold">{player[stat.key]}</span>
          </div>
        ))}
      </div>
      {player.unspent_points > 0 && (
        <div className="text-center text-xs text-primary">
          {player.unspent_points} unspent point{player.unspent_points > 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
