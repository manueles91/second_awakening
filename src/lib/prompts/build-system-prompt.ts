import { readFileSync } from "fs";
import { join } from "path";
import type { Player, PlayerPreferences, Quest, Shadow, InventoryItem } from "@/lib/types/database";

// Load static prompt files at module level
const promptsDir = join(process.cwd(), "src/lib/prompts");

function loadPromptFile(filename: string): string {
  return readFileSync(join(promptsDir, filename), "utf-8");
}

let cachedSystemRules: string | null = null;
let cachedStoryEngine: string | null = null;
let cachedGearCatalog: string | null = null;

function getSystemRules(): string {
  if (!cachedSystemRules) cachedSystemRules = loadPromptFile("SYSTEM_RULES.md");
  return cachedSystemRules;
}

function getStoryEngine(): string {
  if (!cachedStoryEngine) cachedStoryEngine = loadPromptFile("STORY_ENGINE.md");
  return cachedStoryEngine;
}

function getGearCatalog(): string {
  if (!cachedGearCatalog) cachedGearCatalog = loadPromptFile("GEAR_AND_REWARDS_CATALOG.md");
  return cachedGearCatalog;
}

interface PlayerState {
  player: Player;
  preferences: PlayerPreferences | null;
  activeQuests: Quest[];
  shadows: Shadow[];
  equippedItems: InventoryItem[];
  recentFeedback: string[];
}

function buildPlayerStateBlock(state: PlayerState): string {
  const { player, preferences, activeQuests, shadows, equippedItems, recentFeedback } = state;

  const equippedWeapon = equippedItems.find((i) => i.item_type === "weapon");
  const equippedArmor = equippedItems.filter((i) => i.item_type.startsWith("armor_"));
  const equippedAccessories = equippedItems.filter((i) => i.item_type === "accessory");

  const activeDaily = activeQuests.find((q) => q.quest_type === "daily");
  const activeWeekly = activeQuests.find((q) => q.quest_type === "weekly");

  return `<player_state>
  rank: ${player.rank} | level: ${player.level} | xp: ${player.xp} | class: ${player.class || "null"}
  str: ${player.str} | agi: ${player.agi} | vit: ${player.vit} | int: ${player.int} | per: ${player.per}
  unspent_points: ${player.unspent_points}
  hp: ${player.hp_current}/${player.hp_max} | mp: ${player.mp_current}/${player.mp_max} | fatigue: ${player.fatigue}
  gold: ${player.gold} | streak: ${player.current_streak} | longest_streak: ${player.longest_streak}
  equipped_weapon: ${equippedWeapon ? `"${equippedWeapon.item_name}" [${equippedWeapon.item_rank}-Rank]` : "none"}
  equipped_armor: [${equippedArmor.map((a) => `"${a.item_name}" [${a.item_rank}]`).join(", ") || "none"}]
  equipped_accessories: [${equippedAccessories.map((a) => `"${a.item_name}"`).join(", ") || "none"}]
  active_title: "${player.active_title}"
  shadow_army: [${shadows.map((s) => `{name:"${s.shadow_name}", habit:"${s.habit_description}", grade:"${s.grade}"}`).join(", ") || "none"}]
  active_daily_quest: ${activeDaily ? `{name: "${activeDaily.quest_name}", status: "${activeDaily.status}", components: ${JSON.stringify(activeDaily.components)}}` : "none"}
  active_weekly_quest: ${activeWeekly ? `{name: "${activeWeekly.quest_name}", status: "${activeWeekly.status}"}` : "none"}
  recent_feedback: [${recentFeedback.map((f) => `"${f}"`).join(",")}]
  onboarding_complete: ${player.onboarding_complete}
  total_quests_completed: ${player.total_quests_completed}
  total_quests_failed: ${player.total_quests_failed}
  program_start_date: ${player.program_start_date || "not started"}
  ${preferences ? `genre: "${preferences.primary_genre}"
  story_tone: "${preferences.story_tone}"
  goals: [${preferences.goals.map((g) => `"${g.description} (${g.domain})"`).join(", ")}]
  difficulty: "${preferences.difficulty}"
  narrative_depth: "${preferences.narrative_depth}"
  session_length: "${preferences.session_length}"
  fitness_level: "${preferences.fitness_level}"
  physical_limitations: [${(preferences.physical_limitations || []).map((l) => `"${l}"`).join(", ")}]
  task_exclusions: [${(preferences.task_exclusions || []).map((e) => `"${e}"`).join(", ")}]
  missed_day_handling: "${preferences.missed_day_handling}"` : "preferences: not set (onboarding needed)"}
</player_state>`;
}

const RESPONSE_FORMAT_INSTRUCTIONS = `
## RESPONSE FORMAT

You MUST end EVERY response with a JSON block wrapped in <state_delta> tags. This block contains all changes to the player's state that the app should persist. Only include fields that actually changed. If nothing changed, return an empty object.

IMPORTANT: The narrative text comes FIRST, then the state_delta block at the very end.

Example:
<state_delta>
{
  "xp_gained": 30,
  "gold_gained": 50,
  "fatigue_change": 10,
  "streak_update": 13,
  "quest_completed": {
    "quest_id": "active_daily",
    "reward_chosen": "stat_points",
    "stat_points_awarded": 3
  },
  "new_quest": {
    "type": "daily",
    "name": "Day of the Tiger",
    "description": "A trial of body, mind, and spirit",
    "narrative_frame": "The Tiger Gate demands your offering",
    "components": [
      {"type": "physical", "task": "30 push-ups", "narrative": "Sword arm training"},
      {"type": "mental", "task": "Read 20 pages", "narrative": "Studying the Art of War"},
      {"type": "reflection", "task": "5-min journal", "narrative": "Finding your center"}
    ],
    "xp_reward": 30,
    "gold_reward": 50
  },
  "stat_allocation": {"str": 2, "agi": 1},
  "title_earned": null,
  "gear_earned": null,
  "feedback_rating": "about_right",
  "narrative_thread_update": {"rival": "introduced this session"}
}
</state_delta>

Available state_delta fields:
- xp_gained (number) — XP earned this interaction
- gold_gained (number) — Gold earned
- gold_spent (number) — Gold spent (shop purchases)
- fatigue_change (number) — Fatigue delta (positive = more tired, negative = recovery)
- hp_change (number) — HP delta
- mp_change (number) — MP delta
- streak_update (number) — New streak count
- stat_allocation (object) — Stats to add: {"str": N, "agi": N, ...}
- quest_completed (object) — {quest_id, reward_chosen, stat_points_awarded}
- quest_failed (object) — {quest_id, reason}
- quest_component_updates (array) — [{quest_id, component_index, done}]
- new_quest (object) — New quest to create
- title_earned (object|null) — {title_name, earned_condition}
- gear_earned (object|null) — {item_type, item_name, item_rank, attack, defense, special_effect, special_effect_description}
- shadow_update (object|null) — {action, shadow_name, habit_description, domain, new_grade, personality_trait}
- feedback_rating (string) — Detected feedback: "too_easy"|"about_right"|"too_hard"|"specific_feedback"
- level_up (object) — {new_level, stat_points_awarded}
- rank_up (object) — {new_rank}
- class_assigned (string) — Class name if Job Change Quest completed
- narrative_thread_update (object) — Story state changes to track
`;

export function buildSystemPrompt(state: PlayerState): string {
  const parts = [
    getSystemRules(),
    "\n---\n",
    getStoryEngine(),
    "\n---\n",
    getGearCatalog(),
    "\n---\n",
    "## CURRENT PLAYER STATE\n",
    buildPlayerStateBlock(state),
    "\n---\n",
    RESPONSE_FORMAT_INSTRUCTIONS,
  ];

  return parts.join("\n");
}

export function buildOnboardingPrompt(): string {
  return `You are The System from a Solo Leveling-inspired life coaching app called Second Awakening.

You are conducting the Player's ONBOARDING — their first interaction with the System. Your goal is to gather the information needed to personalize their experience.

## YOUR PERSONA
- You ARE the System. Cold, authoritative, game-like.
- You've just "awakened" this Player. They are a new Hunter.
- Be engaging but efficient. This should feel like character creation in a game.

## INFORMATION TO GATHER
Collect these through natural conversation (not a form). Ask 2-3 questions at a time:

1. **Player Name** (real name) and **Hunter Name** (their in-game alias)
2. **Goals** — What do they want to achieve? (fitness, learning, productivity, mindfulness, etc.)
   - For each goal, identify which stat domain it maps to (STR/AGI/VIT/INT/PER)
3. **Genre Preference** — What fantasy genre should quests be themed around?
   - Options: dark_fantasy, samurai, sci_fi, mythology, cultivation, superhero, pirate, custom
4. **Story Tone** — epic, humorous, dark, inspirational, or balanced
5. **Fitness Level** — sedentary, lightly_active, moderately_active, very_active
6. **Physical Limitations** — Any injuries or conditions to avoid
7. **Difficulty** — gentle, standard, or challenging
8. **Schedule** — Which days they're busy, rest days, preferred session times

## CONVERSATION FLOW
1. Dramatic awakening message — "You have been chosen..." etc.
2. Ask for names (real + hunter)
3. Ask about goals (what they want to change/achieve)
4. Ask about preferences (genre, tone, difficulty)
5. Ask about physical profile (fitness, limitations)
6. Ask about schedule
7. Summary + confirmation
8. Generate their first daily quest!

## RESPONSE FORMAT
During onboarding, include a <state_delta> block ONLY on the final message when onboarding is complete.

When the onboarding is COMPLETE (you have all info), your state_delta should include:
<state_delta>
{
  "onboarding_complete": true,
  "player_name": "...",
  "hunter_name": "...",
  "preferences": {
    "primary_genre": "...",
    "story_tone": "...",
    "goals": [{"description": "...", "domain": "STR", "measurable": true, "target": "...", "motivation": "..."}],
    "fitness_level": "...",
    "physical_limitations": [],
    "difficulty": "...",
    "work_days": [...],
    "rest_days": [...]
  },
  "new_quest": {
    "type": "daily",
    "name": "...",
    "components": [...],
    "xp_reward": 30,
    "gold_reward": 50
  }
}
</state_delta>
`;
}
