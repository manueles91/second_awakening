"use client";

import { useState, useEffect, useCallback } from "react";
import type { Player, Quest } from "@/lib/types/database";

export function usePlayer() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [activeQuests, setActiveQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlayer = useCallback(async () => {
    try {
      const response = await fetch("/api/player");
      if (response.ok) {
        const data = await response.json();
        setPlayer(data.player);
        setActiveQuests(data.active_quests || []);
      } else if (response.status === 404) {
        setPlayer(null);
      } else {
        throw new Error("Failed to fetch player");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlayer();
  }, [fetchPlayer]);

  const updatePlayer = useCallback((updatedPlayer: Player) => {
    setPlayer(updatedPlayer);
  }, []);

  const updateQuests = useCallback((quests: Quest[]) => {
    setActiveQuests(quests);
  }, []);

  return {
    player,
    activeQuests,
    loading,
    error,
    updatePlayer,
    updateQuests,
    refetch: fetchPlayer,
  };
}
