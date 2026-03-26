import type { StatDomain } from "./database";

export interface QuestComponentDelta {
  type: "physical" | "mental" | "reflection";
  task: string;
  narrative: string;
}

export interface NewQuestDelta {
  type: "daily" | "weekly" | "monthly" | "bonus" | "penalty" | "milestone";
  name: string;
  description?: string;
  narrative_frame?: string;
  components?: QuestComponentDelta[];
  daily_beats?: { day: number; description: string }[];
  xp_reward: number;
  gold_reward: number;
  deadline?: string;
}

export interface QuestCompletionDelta {
  quest_id: string;
  reward_chosen?: "status_recovery" | "stat_points" | "loot_box";
  stat_points_awarded?: number;
}

export interface QuestComponentUpdate {
  quest_id: string;
  component_index: number;
  done: boolean;
}

export interface GearEarnedDelta {
  item_type: string;
  item_name: string;
  item_rank: string;
  attack?: number;
  defense?: number;
  special_effect?: string;
  special_effect_description?: string;
}

export interface ShadowDelta {
  action: "extract" | "promote" | "confirm";
  shadow_name: string;
  habit_description?: string;
  domain?: StatDomain;
  new_grade?: string;
  personality_trait?: string;
}

export interface FeedbackDelta {
  type: string;
  rating?: string;
  sentiment?: string;
  player_comment?: string;
}

export interface StateDelta {
  xp_gained?: number;
  gold_gained?: number;
  gold_spent?: number;
  fatigue_change?: number;
  hp_change?: number;
  mp_change?: number;
  streak_update?: number;
  stat_allocation?: Partial<Record<StatDomain, number>>;
  quest_completed?: QuestCompletionDelta;
  quest_failed?: { quest_id: string; reason: string };
  quest_component_updates?: QuestComponentUpdate[];
  new_quest?: NewQuestDelta;
  title_earned?: { title_name: string; earned_condition: string } | null;
  gear_earned?: GearEarnedDelta | null;
  shadow_update?: ShadowDelta | null;
  feedback_rating?: string;
  level_up?: { new_level: number; stat_points_awarded: number };
  rank_up?: { new_rank: string };
  class_assigned?: string;
  narrative_thread_update?: Record<string, string>;
}
