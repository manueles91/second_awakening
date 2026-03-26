"use client";

import { useState } from "react";
import { usePlayer } from "@/hooks/use-player";
import { HudPanel } from "@/components/hud/hud-panel";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GameLayout({ children }: { children: React.ReactNode }) {
  const { player, activeQuests, updatePlayer, updateQuests } = usePlayer();
  const [hudOpen, setHudOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-border bg-card/50 px-3 py-2 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-lg font-bold text-transparent">
            ARISE
          </span>
          {player && (
            <span className="text-xs text-muted-foreground">
              Lv.{player.level} {player.hunter_name}
            </span>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={() => setHudOpen(!hudOpen)}>
          {hudOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      <div className="relative flex flex-1 overflow-hidden">
        {/* Main content */}
        <main className="flex-1 overflow-hidden">
          {/* Pass player state via context-like props */}
          <GameContext.Provider value={{ player, activeQuests, updatePlayer, updateQuests }}>
            {children}
          </GameContext.Provider>
        </main>

        {/* HUD sidebar/overlay */}
        {hudOpen && player && (
          <>
            {/* Backdrop */}
            <div
              className="absolute inset-0 z-10 bg-black/50 lg:hidden"
              onClick={() => setHudOpen(false)}
            />
            {/* Panel */}
            <aside className="absolute right-0 top-0 z-20 h-full w-72 overflow-y-auto border-l border-border bg-background lg:relative lg:z-0">
              <HudPanel player={player} activeQuests={activeQuests} />
            </aside>
          </>
        )}
      </div>
    </div>
  );
}

// Simple context for passing game state to children
import { createContext, useContext } from "react";
import type { Player, Quest } from "@/lib/types/database";

interface GameContextType {
  player: Player | null;
  activeQuests: Quest[];
  updatePlayer: (player: Player) => void;
  updateQuests: (quests: Quest[]) => void;
}

export const GameContext = createContext<GameContextType>({
  player: null,
  activeQuests: [],
  updatePlayer: () => {},
  updateQuests: () => {},
});

export function useGameContext() {
  return useContext(GameContext);
}
