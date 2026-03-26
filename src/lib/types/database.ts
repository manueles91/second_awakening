export type Rank = "E" | "D" | "C" | "B" | "A" | "S";
export type PlayerClass = "Warrior" | "Mage" | "Healer" | "Assassin" | "Ranger";
export type QuestType = "daily" | "weekly" | "monthly" | "bonus" | "penalty" | "milestone";
export type QuestStatus = "active" | "completed" | "failed" | "expired" | "skipped";
export type ItemType = "weapon" | "armor_helm" | "armor_chest" | "armor_legs" | "accessory" | "consumable" | "key_item" | "loot_box";
export type ShadowGrade = "Normal" | "Elite" | "Knight" | "Elite Knight" | "General" | "Grand Marshal";
export type StatDomain = "STR" | "AGI" | "VIT" | "INT" | "PER";
export type StoryTone = "epic" | "humorous" | "dark" | "inspirational" | "balanced";
export type FitnessLevel = "sedentary" | "lightly_active" | "moderately_active" | "very_active";
export type Difficulty = "gentle" | "standard" | "challenging";
export type FeedbackType = "session_rating" | "weekly_calibration" | "monthly_review" | "system_override" | "compassion_override" | "difficulty_adjustment" | "narrative_adjustment" | "pacing_adjustment";
export type FeedbackRating = "too_easy" | "about_right" | "too_hard" | "specific_feedback";
export type Sentiment = "disengaged" | "struggling" | "neutral" | "engaged" | "thriving";
export type ChatRole = "user" | "assistant" | "system";

export interface Player {
  id: string;
  user_id: string;
  player_name: string;
  hunter_name: string;
  rank: Rank;
  level: number;
  xp: number;
  cumulative_xp: number;
  class: PlayerClass | null;
  str: number;
  agi: number;
  vit: number;
  int: number;
  per: number;
  unspent_points: number;
  hp_current: number;
  hp_max: number;
  mp_current: number;
  mp_max: number;
  fatigue: number;
  gold: number;
  current_streak: number;
  longest_streak: number;
  total_quests_completed: number;
  total_quests_failed: number;
  penalties_triggered: number;
  penalties_survived: number;
  compassion_overrides: number;
  equipped_weapon: string | null;
  equipped_armor_helm: string | null;
  equipped_armor_chest: string | null;
  equipped_armor_legs: string | null;
  equipped_accessory_1: string | null;
  equipped_accessory_2: string | null;
  equipped_accessory_3: string | null;
  active_title: string;
  onboarding_complete: boolean;
  program_start_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlayerPreferences {
  id: string;
  player_id: string;
  primary_genre: string;
  custom_genre_details: string | null;
  story_tone: StoryTone;
  goals: Goal[];
  favorite_genres: string[] | null;
  favorite_media: string[] | null;
  hobbies: string[] | null;
  career_field: string | null;
  fitness_level: FitnessLevel;
  physical_limitations: string[] | null;
  task_exclusions: string[] | null;
  preferred_exercises: string[] | null;
  preferred_mental_activities: string[] | null;
  preferred_reflection_methods: string[] | null;
  difficulty: Difficulty;
  pacing: string;
  penalty_tolerance: string;
  narrative_depth: string;
  session_length: string;
  tone_preference: string;
  missed_day_handling: string;
  feedback_frequency: string;
  work_days: string[];
  rest_days: string[];
  busy_periods: string | null;
  timezone: string | null;
  preferred_session_time: string | null;
  content_sensitivities: string[] | null;
  narrative_hard_limits: string[] | null;
  class_leaning: string | null;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  description: string;
  domain: StatDomain;
  measurable: boolean;
  target?: string;
  motivation?: string;
}

export interface QuestComponent {
  type: "physical" | "mental" | "reflection";
  task: string;
  narrative: string;
  done: boolean;
}

export interface DailyBeat {
  day: number;
  description: string;
  done: boolean;
}

export interface Quest {
  id: string;
  player_id: string;
  quest_type: QuestType;
  quest_name: string;
  quest_description: string | null;
  narrative_frame: string | null;
  components: QuestComponent[] | null;
  daily_beats: DailyBeat[] | null;
  status: QuestStatus;
  xp_reward: number;
  gold_reward: number;
  gear_reward: string | null;
  reward_chosen: string | null;
  penalty_trigger_reason: string | null;
  penalty_survived: boolean | null;
  assigned_date: string;
  deadline: string | null;
  completed_date: string | null;
  streak_day_at_completion: number | null;
  rank_at_time: string | null;
  level_at_time: number | null;
  created_at: string;
}

export interface FeedbackEntry {
  id: string;
  player_id: string;
  type: FeedbackType;
  rating: FeedbackRating | null;
  player_comment: string | null;
  calibration_data: Record<string, unknown> | null;
  previous_value: string | null;
  new_value: string | null;
  adjustment_reason: string | null;
  player_approved: boolean | null;
  override_type: string | null;
  override_resolved: boolean;
  sentiment: Sentiment | null;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  player_id: string;
  item_type: ItemType;
  item_name: string;
  item_rank: Rank;
  attack: number;
  defense: number;
  special_effect: string | null;
  special_effect_description: string | null;
  upgrade_level: number;
  quantity: number;
  is_equipped: boolean;
  source: string | null;
  created_at: string;
}

export interface Shadow {
  id: string;
  player_id: string;
  shadow_name: string;
  habit_description: string;
  domain: StatDomain;
  grade: ShadowGrade;
  started_date: string;
  last_confirmed_date: string;
  consecutive_days: number;
  stat_bonus_granted: number;
  personality_trait: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  player_id: string;
  role: ChatRole;
  content: string;
  session_number: number | null;
  state_delta: Record<string, unknown> | null;
  created_at: string;
}

export interface TitleUnlocked {
  id: string;
  player_id: string;
  title_name: string;
  earned_condition: string;
  earned_date: string;
  is_active: boolean;
}
