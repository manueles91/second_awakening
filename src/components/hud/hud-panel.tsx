"use client";

import type { Player, Quest } from "@/lib/types/database";
import type { Rank } from "@/lib/types/database";
import { RankBadge } from "./rank-badge";
import { StatBar } from "./stat-bar";
import { StatBlock } from "./stat-block";
import { QuestTracker } from "./quest-tracker";
import { Separator } from "@/components/ui/separator";
import { RANK_THRESHOLDS } from "@/lib/types/game";
import { Flame, Coins, Swords } from "lucide-react";

interface HudPanelProps {
  player: Player;
  activeQuests: Quest[];
}

export function HudPanel({ player, activeQuests }: HudPanelProps) {
  const rankInfo = RANK_THRESHOLDS[player.rank as Rank];
  const xpForLevel = rankInfo.xpPerLevel;

  return (
    <div className="space-y-4 p-4">
      {/* Identity */}
      <div className="flex items-center gap-3">
        <RankBadge rank={player.rank as Rank} size="lg" />
        <div>
          <div className="font-semibold">{player.hunter_name}</div>
          <div className="text-xs text-muted-foreground">
            {player.active_title}
          </div>
          {player.class && (
            <div className="text-xs text-primary">{player.class}</div>
          )}
        </div>
      </div>

      <Separator />

      {/* Level & XP */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium">Level {player.level}</span>
          <span className="text-xs text-muted-foreground">
            {player.rank}-Rank
          </span>
        </div>
        <StatBar
          label="XP"
          current={player.xp}
          max={xpForLevel}
          color="bg-xp-bar"
        />
      </div>

      {/* HP / MP / Fatigue */}
      <div className="space-y-2">
        <StatBar
          label="HP"
          current={player.hp_current}
          max={player.hp_max}
          color="bg-hp-bar"
        />
        <StatBar
          label="MP"
          current={player.mp_current}
          max={player.mp_max}
          color="bg-mp-bar"
        />
        <StatBar
          label="Fatigue"
          current={player.fatigue}
          max={100}
          color="bg-orange-500"
        />
      </div>

      <Separator />

      {/* Stats */}
      <StatBlock player={player} />

      <Separator />

      {/* Quick stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex items-center gap-1.5 rounded-lg bg-secondary/50 p-2">
          <Flame className="h-3.5 w-3.5 text-orange-400" />
          <div>
            <div className="text-xs font-semibold">{player.current_streak}</div>
            <div className="text-[9px] text-muted-foreground">Streak</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg bg-secondary/50 p-2">
          <Coins className="h-3.5 w-3.5 text-gold" />
          <div>
            <div className="text-xs font-semibold">{player.gold}</div>
            <div className="text-[9px] text-muted-foreground">Gold</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg bg-secondary/50 p-2">
          <Swords className="h-3.5 w-3.5 text-primary" />
          <div>
            <div className="text-xs font-semibold">{player.total_quests_completed}</div>
            <div className="text-[9px] text-muted-foreground">Quests</div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Quest Tracker */}
      <QuestTracker quests={activeQuests} />
    </div>
  );
}
