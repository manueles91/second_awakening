-- Arise: Solo Leveling Life Coach — Initial Schema
-- All tables use RLS filtered by auth.uid()

-----------------------------------------------------------
-- PLAYERS
-----------------------------------------------------------
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- Identity
  player_name TEXT NOT NULL,
  hunter_name TEXT NOT NULL,

  -- Rank & Level
  rank TEXT NOT NULL DEFAULT 'E' CHECK (rank IN ('E','D','C','B','A','S')),
  level INTEGER NOT NULL DEFAULT 1,
  xp INTEGER NOT NULL DEFAULT 0,
  cumulative_xp INTEGER NOT NULL DEFAULT 0,

  -- Class (null until Job Change Quest at B-Rank)
  class TEXT CHECK (class IN ('Warrior','Mage','Healer','Assassin','Ranger')),

  -- Stats
  str INTEGER NOT NULL DEFAULT 10,
  agi INTEGER NOT NULL DEFAULT 10,
  vit INTEGER NOT NULL DEFAULT 10,
  int INTEGER NOT NULL DEFAULT 10,
  per INTEGER NOT NULL DEFAULT 10,
  unspent_points INTEGER NOT NULL DEFAULT 0,

  -- Derived values
  hp_current INTEGER NOT NULL DEFAULT 150,
  hp_max INTEGER NOT NULL DEFAULT 150,
  mp_current INTEGER NOT NULL DEFAULT 150,
  mp_max INTEGER NOT NULL DEFAULT 150,
  fatigue INTEGER NOT NULL DEFAULT 0,

  -- Economy
  gold INTEGER NOT NULL DEFAULT 0,

  -- Streaks
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,

  -- Counters
  total_quests_completed INTEGER NOT NULL DEFAULT 0,
  total_quests_failed INTEGER NOT NULL DEFAULT 0,
  penalties_triggered INTEGER NOT NULL DEFAULT 0,
  penalties_survived INTEGER NOT NULL DEFAULT 0,
  compassion_overrides INTEGER NOT NULL DEFAULT 0,

  -- Equipped gear (references inventory)
  equipped_weapon UUID,
  equipped_armor_helm UUID,
  equipped_armor_chest UUID,
  equipped_armor_legs UUID,
  equipped_accessory_1 UUID,
  equipped_accessory_2 UUID,
  equipped_accessory_3 UUID,

  -- Active title
  active_title TEXT DEFAULT 'The Weakest Hunter',

  -- Onboarding
  onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,

  -- Timestamps
  program_start_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own player" ON players
  FOR ALL USING (auth.uid() = user_id);

-----------------------------------------------------------
-- PLAYER PREFERENCES
-----------------------------------------------------------
CREATE TABLE player_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- Genre & Story
  primary_genre TEXT NOT NULL DEFAULT 'dark_fantasy',
  custom_genre_details TEXT,
  story_tone TEXT DEFAULT 'balanced' CHECK (story_tone IN ('epic','humorous','dark','inspirational','balanced')),

  -- Goals (JSONB array)
  goals JSONB DEFAULT '[]'::jsonb,

  -- Interests
  favorite_genres TEXT[],
  favorite_media TEXT[],
  hobbies TEXT[],
  career_field TEXT,

  -- Physical profile
  fitness_level TEXT DEFAULT 'sedentary' CHECK (fitness_level IN ('sedentary','lightly_active','moderately_active','very_active')),
  physical_limitations TEXT[],
  task_exclusions TEXT[],
  preferred_exercises TEXT[],
  preferred_mental_activities TEXT[],
  preferred_reflection_methods TEXT[],

  -- Difficulty
  difficulty TEXT DEFAULT 'standard' CHECK (difficulty IN ('gentle','standard','challenging')),
  pacing TEXT DEFAULT 'standard' CHECK (pacing IN ('slow','standard','aggressive')),
  penalty_tolerance TEXT DEFAULT 'standard' CHECK (penalty_tolerance IN ('soft','standard','hardcore')),
  narrative_depth TEXT DEFAULT 'balanced' CHECK (narrative_depth IN ('minimal','balanced','full_immersion')),
  session_length TEXT DEFAULT 'medium' CHECK (session_length IN ('quick','medium','long')),

  -- Communication
  tone_preference TEXT DEFAULT 'casual',
  missed_day_handling TEXT DEFAULT 'gentle_encouragement',
  feedback_frequency TEXT DEFAULT 'every_session',

  -- Schedule
  work_days TEXT[] DEFAULT '{Mon,Tue,Wed,Thu,Fri}',
  rest_days TEXT[] DEFAULT '{Sun}',
  busy_periods TEXT,
  timezone TEXT,
  preferred_session_time TEXT,

  -- Content boundaries
  content_sensitivities TEXT[],
  narrative_hard_limits TEXT[],

  -- Class preference (pre-Job Change)
  class_leaning TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE player_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own preferences" ON player_preferences
  FOR ALL USING (player_id IN (SELECT id FROM players WHERE user_id = auth.uid()));

-----------------------------------------------------------
-- QUEST LOG
-----------------------------------------------------------
CREATE TABLE quest_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,

  quest_type TEXT NOT NULL CHECK (quest_type IN ('daily','weekly','monthly','bonus','penalty','milestone')),
  quest_name TEXT NOT NULL,
  quest_description TEXT,
  narrative_frame TEXT,

  -- Components (for daily quests)
  components JSONB,

  -- Weekly quest daily beats
  daily_beats JSONB,

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','failed','expired','skipped')),

  -- Rewards
  xp_reward INTEGER DEFAULT 0,
  gold_reward INTEGER DEFAULT 0,
  gear_reward TEXT,
  reward_chosen TEXT,

  -- Penalty info
  penalty_trigger_reason TEXT,
  penalty_survived BOOLEAN,

  -- Dates
  assigned_date TIMESTAMPTZ DEFAULT NOW(),
  deadline TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,

  -- Context
  streak_day_at_completion INTEGER,
  rank_at_time TEXT,
  level_at_time INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quest_log_player ON quest_log(player_id);
CREATE INDEX idx_quest_log_status ON quest_log(player_id, status);
CREATE INDEX idx_quest_log_type ON quest_log(player_id, quest_type);

ALTER TABLE quest_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own quests" ON quest_log
  FOR ALL USING (player_id IN (SELECT id FROM players WHERE user_id = auth.uid()));

-----------------------------------------------------------
-- FEEDBACK LOG
-----------------------------------------------------------
CREATE TABLE feedback_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,

  type TEXT NOT NULL CHECK (type IN ('session_rating','weekly_calibration','monthly_review','system_override','compassion_override','difficulty_adjustment','narrative_adjustment','pacing_adjustment')),

  rating TEXT CHECK (rating IN ('too_easy','about_right','too_hard','specific_feedback')),
  player_comment TEXT,

  calibration_data JSONB,

  previous_value TEXT,
  new_value TEXT,
  adjustment_reason TEXT,
  player_approved BOOLEAN,

  override_type TEXT,
  override_resolved BOOLEAN DEFAULT FALSE,

  sentiment TEXT CHECK (sentiment IN ('disengaged','struggling','neutral','engaged','thriving')),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feedback_player ON feedback_log(player_id);
CREATE INDEX idx_feedback_type ON feedback_log(player_id, type);

ALTER TABLE feedback_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own feedback" ON feedback_log
  FOR ALL USING (player_id IN (SELECT id FROM players WHERE user_id = auth.uid()));

-----------------------------------------------------------
-- INVENTORY
-----------------------------------------------------------
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,

  item_type TEXT NOT NULL CHECK (item_type IN ('weapon','armor_helm','armor_chest','armor_legs','accessory','consumable','key_item','loot_box')),
  item_name TEXT NOT NULL,
  item_rank TEXT NOT NULL CHECK (item_rank IN ('E','D','C','B','A','S')),

  attack INTEGER DEFAULT 0,
  defense INTEGER DEFAULT 0,
  special_effect TEXT,
  special_effect_description TEXT,

  upgrade_level INTEGER DEFAULT 0,
  quantity INTEGER DEFAULT 1,
  is_equipped BOOLEAN DEFAULT FALSE,

  source TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inventory_player ON inventory(player_id);

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own inventory" ON inventory
  FOR ALL USING (player_id IN (SELECT id FROM players WHERE user_id = auth.uid()));

-- Add foreign key constraints for equipped gear
ALTER TABLE players
  ADD CONSTRAINT fk_equipped_weapon FOREIGN KEY (equipped_weapon) REFERENCES inventory(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_equipped_armor_helm FOREIGN KEY (equipped_armor_helm) REFERENCES inventory(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_equipped_armor_chest FOREIGN KEY (equipped_armor_chest) REFERENCES inventory(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_equipped_armor_legs FOREIGN KEY (equipped_armor_legs) REFERENCES inventory(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_equipped_accessory_1 FOREIGN KEY (equipped_accessory_1) REFERENCES inventory(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_equipped_accessory_2 FOREIGN KEY (equipped_accessory_2) REFERENCES inventory(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_equipped_accessory_3 FOREIGN KEY (equipped_accessory_3) REFERENCES inventory(id) ON DELETE SET NULL;

-----------------------------------------------------------
-- SHADOW ARMY
-----------------------------------------------------------
CREATE TABLE shadow_army (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,

  shadow_name TEXT NOT NULL,
  habit_description TEXT NOT NULL,
  domain TEXT NOT NULL CHECK (domain IN ('STR','AGI','VIT','INT','PER')),

  grade TEXT NOT NULL DEFAULT 'Normal' CHECK (grade IN ('Normal','Elite','Knight','Elite Knight','General','Grand Marshal')),

  started_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_confirmed_date TIMESTAMPTZ DEFAULT NOW(),
  consecutive_days INTEGER DEFAULT 0,

  stat_bonus_granted INTEGER DEFAULT 1,
  personality_trait TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shadow_player ON shadow_army(player_id);

ALTER TABLE shadow_army ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own shadows" ON shadow_army
  FOR ALL USING (player_id IN (SELECT id FROM players WHERE user_id = auth.uid()));

-----------------------------------------------------------
-- CHAT HISTORY
-----------------------------------------------------------
CREATE TABLE chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,

  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL,

  session_number INTEGER,
  state_delta JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_player ON chat_history(player_id);
CREATE INDEX idx_chat_created ON chat_history(player_id, created_at DESC);

ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own chats" ON chat_history
  FOR ALL USING (player_id IN (SELECT id FROM players WHERE user_id = auth.uid()));

-----------------------------------------------------------
-- TITLES UNLOCKED
-----------------------------------------------------------
CREATE TABLE titles_unlocked (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,

  title_name TEXT NOT NULL,
  earned_condition TEXT NOT NULL,
  earned_date TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT FALSE,

  UNIQUE(player_id, title_name)
);

ALTER TABLE titles_unlocked ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own titles" ON titles_unlocked
  FOR ALL USING (player_id IN (SELECT id FROM players WHERE user_id = auth.uid()));
