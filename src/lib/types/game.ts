import type { Rank } from "./database";

// XP thresholds per rank
export const RANK_THRESHOLDS: Record<Rank, { maxLevel: number; xpPerLevel: number; totalXpToNextRank: number }> = {
  E: { maxLevel: 10, xpPerLevel: 100, totalXpToNextRank: 1000 },
  D: { maxLevel: 20, xpPerLevel: 200, totalXpToNextRank: 3000 },
  C: { maxLevel: 30, xpPerLevel: 300, totalXpToNextRank: 6000 },
  B: { maxLevel: 40, xpPerLevel: 500, totalXpToNextRank: 10000 },
  A: { maxLevel: 50, xpPerLevel: 800, totalXpToNextRank: 16000 },
  S: { maxLevel: 100, xpPerLevel: 1000, totalXpToNextRank: Infinity },
};

export const RANK_ORDER: Rank[] = ["E", "D", "C", "B", "A", "S"];

export const RANK_COLORS: Record<Rank, string> = {
  E: "text-rank-e",
  D: "text-rank-d",
  C: "text-rank-c",
  B: "text-rank-b",
  A: "text-rank-a",
  S: "text-rank-s",
};

export const RANK_BG_COLORS: Record<Rank, string> = {
  E: "bg-rank-e",
  D: "bg-rank-d",
  C: "bg-rank-c",
  B: "bg-rank-b",
  A: "bg-rank-a",
  S: "bg-rank-s",
};

// Stat points per level up
export const STAT_POINTS_PER_LEVEL = 3;

// HP/MP formulas
export function calculateMaxHP(vit: number, level: number): number {
  return 100 + vit * 5 + level * 2;
}

export function calculateMaxMP(int: number, level: number): number {
  return 100 + int * 5 + level * 2;
}

// Daily quest XP rewards by rank
export const DAILY_QUEST_XP: Record<Rank, number> = {
  E: 30,
  D: 60,
  C: 100,
  B: 150,
  A: 250,
  S: 400,
};

export const DAILY_QUEST_GOLD: Record<Rank, number> = {
  E: 50,
  D: 100,
  C: 200,
  B: 350,
  A: 500,
  S: 800,
};

// Streak bonus multipliers
export function getStreakMultiplier(streak: number): number {
  if (streak >= 30) return 1.5;
  if (streak >= 14) return 1.3;
  if (streak >= 7) return 1.2;
  if (streak >= 3) return 1.1;
  return 1.0;
}

// Shadow army grade thresholds (consecutive days)
export const SHADOW_GRADE_THRESHOLDS = {
  Normal: 0,
  Elite: 7,
  Knight: 21,
  "Elite Knight": 45,
  General: 90,
  "Grand Marshal": 180,
};
