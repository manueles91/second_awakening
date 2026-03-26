"use client";

import type { Quest } from "@/lib/types/database";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle } from "lucide-react";

interface QuestTrackerProps {
  quests: Quest[];
}

export function QuestTracker({ quests }: QuestTrackerProps) {
  if (quests.length === 0) {
    return (
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Active Quests
        </div>
        <p className="text-xs text-muted-foreground">No active quests</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Active Quests
      </div>
      {quests.map((quest) => (
        <div
          key={quest.id}
          className="rounded-lg border border-border/50 bg-secondary/30 p-3 space-y-2"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-medium">{quest.quest_name}</span>
            <Badge variant="outline" className="shrink-0 text-[10px]">
              {quest.quest_type}
            </Badge>
          </div>

          {quest.components && (
            <div className="space-y-1">
              {quest.components.map((comp, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px]">
                  {comp.done ? (
                    <CheckCircle2 className="h-3 w-3 shrink-0 text-green-400" />
                  ) : (
                    <Circle className="h-3 w-3 shrink-0 text-muted-foreground" />
                  )}
                  <span className={comp.done ? "text-muted-foreground line-through" : ""}>
                    {comp.task}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 text-[10px] text-muted-foreground">
            <span>{quest.xp_reward} XP</span>
            <span>{quest.gold_reward} Gold</span>
          </div>
        </div>
      ))}
    </div>
  );
}
