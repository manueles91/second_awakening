import type { SupabaseClient } from "@supabase/supabase-js";
import type { StateDelta } from "@/lib/types/state-delta";
import type { Player } from "@/lib/types/database";
import { STAT_POINTS_PER_LEVEL, calculateMaxHP, calculateMaxMP } from "@/lib/types/game";

export async function applyStateDelta(
  supabase: SupabaseClient,
  player: Player,
  delta: StateDelta
): Promise<Player> {
  const updates: Record<string, unknown> = {};
  const now = new Date().toISOString();

  // XP and Gold
  if (delta.xp_gained) {
    updates.xp = player.xp + delta.xp_gained;
    updates.cumulative_xp = player.cumulative_xp + delta.xp_gained;
  }

  if (delta.gold_gained) {
    updates.gold = (player.gold || 0) + delta.gold_gained;
  }

  if (delta.gold_spent) {
    updates.gold = ((updates.gold as number) ?? player.gold) - delta.gold_spent;
  }

  // Fatigue, HP, MP changes
  if (delta.fatigue_change !== undefined) {
    updates.fatigue = Math.max(0, Math.min(100, player.fatigue + delta.fatigue_change));
  }

  if (delta.hp_change !== undefined) {
    updates.hp_current = Math.max(0, Math.min(player.hp_max, player.hp_current + delta.hp_change));
  }

  if (delta.mp_change !== undefined) {
    updates.mp_current = Math.max(0, Math.min(player.mp_max, player.mp_current + delta.mp_change));
  }

  // Streak
  if (delta.streak_update !== undefined) {
    updates.current_streak = delta.streak_update;
    if (delta.streak_update > player.longest_streak) {
      updates.longest_streak = delta.streak_update;
    }
  }

  // Stat allocation
  if (delta.stat_allocation) {
    const alloc = delta.stat_allocation;
    const totalPoints = Object.values(alloc).reduce((sum, v) => sum + (v || 0), 0);

    if (totalPoints <= player.unspent_points) {
      if (alloc.STR) updates.str = player.str + alloc.STR;
      if (alloc.AGI) updates.agi = player.agi + alloc.AGI;
      if (alloc.VIT) updates.vit = player.vit + alloc.VIT;
      if (alloc.INT) updates.int = player.int + alloc.INT;
      if (alloc.PER) updates.per = player.per + alloc.PER;
      updates.unspent_points = player.unspent_points - totalPoints;

      // Recalculate derived stats
      const newVit = (updates.vit as number) ?? player.vit;
      const newInt = (updates.int as number) ?? player.int;
      const level = player.level;
      updates.hp_max = calculateMaxHP(newVit, level);
      updates.mp_max = calculateMaxMP(newInt, level);
    }
  }

  // Level up
  if (delta.level_up) {
    updates.level = delta.level_up.new_level;
    updates.unspent_points =
      ((updates.unspent_points as number) ?? player.unspent_points) +
      (delta.level_up.stat_points_awarded || STAT_POINTS_PER_LEVEL);
    updates.xp = 0; // Reset XP for new level

    // Recalculate HP/MP max for new level
    const vit = (updates.vit as number) ?? player.vit;
    const int = (updates.int as number) ?? player.int;
    updates.hp_max = calculateMaxHP(vit, delta.level_up.new_level);
    updates.mp_max = calculateMaxMP(int, delta.level_up.new_level);
    // Restore to full on level up
    updates.hp_current = updates.hp_max;
    updates.mp_current = updates.mp_max;
  }

  // Rank up
  if (delta.rank_up) {
    updates.rank = delta.rank_up.new_rank;
  }

  // Class assignment
  if (delta.class_assigned) {
    updates.class = delta.class_assigned;
  }

  // Quest completed counter
  if (delta.quest_completed) {
    updates.total_quests_completed = player.total_quests_completed + 1;
  }

  // Quest failed counter
  if (delta.quest_failed) {
    updates.total_quests_failed = player.total_quests_failed + 1;
  }

  // Apply quest completion
  if (delta.quest_completed) {
    const qc = delta.quest_completed;
    if (qc.quest_id && qc.quest_id !== "active_daily") {
      await supabase
        .from("quest_log")
        .update({
          status: "completed",
          completed_date: now,
          reward_chosen: qc.reward_chosen,
          streak_day_at_completion: (updates.current_streak as number) ?? player.current_streak,
          rank_at_time: (updates.rank as string) ?? player.rank,
          level_at_time: (updates.level as number) ?? player.level,
        })
        .eq("id", qc.quest_id);
    }

    // Handle reward choice
    if (qc.reward_chosen === "status_recovery") {
      updates.hp_current = Math.min(
        ((updates.hp_max as number) ?? player.hp_max),
        ((updates.hp_current as number) ?? player.hp_current) + 20
      );
      updates.mp_current = Math.min(
        ((updates.mp_max as number) ?? player.mp_max),
        ((updates.mp_current as number) ?? player.mp_current) + 20
      );
      updates.fatigue = Math.max(0, ((updates.fatigue as number) ?? player.fatigue) - 10);
    } else if (qc.reward_chosen === "stat_points" && qc.stat_points_awarded) {
      updates.unspent_points =
        ((updates.unspent_points as number) ?? player.unspent_points) + qc.stat_points_awarded;
    }
  }

  // Quest failed
  if (delta.quest_failed && delta.quest_failed.quest_id) {
    await supabase
      .from("quest_log")
      .update({ status: "failed" })
      .eq("id", delta.quest_failed.quest_id);
  }

  // Quest component updates
  if (delta.quest_component_updates) {
    for (const update of delta.quest_component_updates) {
      const { data: quest } = await supabase
        .from("quest_log")
        .select("components")
        .eq("id", update.quest_id)
        .single();

      if (quest?.components) {
        const components = [...quest.components];
        if (components[update.component_index]) {
          components[update.component_index].done = update.done;
          await supabase
            .from("quest_log")
            .update({ components })
            .eq("id", update.quest_id);
        }
      }
    }
  }

  // Create new quest
  if (delta.new_quest) {
    const nq = delta.new_quest;
    await supabase.from("quest_log").insert({
      player_id: player.id,
      quest_type: nq.type,
      quest_name: nq.name,
      quest_description: nq.description || null,
      narrative_frame: nq.narrative_frame || null,
      components: nq.components
        ? nq.components.map((c) => ({ ...c, done: false }))
        : null,
      daily_beats: nq.daily_beats
        ? nq.daily_beats.map((b) => ({ ...b, done: false }))
        : null,
      status: "active",
      xp_reward: nq.xp_reward,
      gold_reward: nq.gold_reward,
      deadline: nq.deadline || null,
      rank_at_time: (updates.rank as string) ?? player.rank,
      level_at_time: (updates.level as number) ?? player.level,
    });
  }

  // Title earned
  if (delta.title_earned) {
    await supabase.from("titles_unlocked").insert({
      player_id: player.id,
      title_name: delta.title_earned.title_name,
      earned_condition: delta.title_earned.earned_condition,
    });
    updates.active_title = delta.title_earned.title_name;
  }

  // Gear earned
  if (delta.gear_earned) {
    const gear = delta.gear_earned;
    await supabase.from("inventory").insert({
      player_id: player.id,
      item_type: gear.item_type,
      item_name: gear.item_name,
      item_rank: gear.item_rank,
      attack: gear.attack || 0,
      defense: gear.defense || 0,
      special_effect: gear.special_effect || null,
      special_effect_description: gear.special_effect_description || null,
      source: "quest_reward",
    });
  }

  // Shadow update
  if (delta.shadow_update) {
    const su = delta.shadow_update;
    if (su.action === "extract" && su.habit_description && su.domain) {
      await supabase.from("shadow_army").insert({
        player_id: player.id,
        shadow_name: su.shadow_name,
        habit_description: su.habit_description,
        domain: su.domain,
      });
    } else if (su.action === "promote" && su.new_grade) {
      await supabase
        .from("shadow_army")
        .update({
          grade: su.new_grade,
          personality_trait: su.personality_trait || null,
          updated_at: now,
        })
        .eq("player_id", player.id)
        .eq("shadow_name", su.shadow_name);
    } else if (su.action === "confirm") {
      // Fetch current shadow to increment consecutive_days
      const { data: shadow } = await supabase
        .from("shadow_army")
        .select("consecutive_days")
        .eq("player_id", player.id)
        .eq("shadow_name", su.shadow_name)
        .single();

      await supabase
        .from("shadow_army")
        .update({
          last_confirmed_date: now,
          consecutive_days: (shadow?.consecutive_days || 0) + 1,
          updated_at: now,
        })
        .eq("player_id", player.id)
        .eq("shadow_name", su.shadow_name);
    }
  }

  // Feedback
  if (delta.feedback_rating) {
    await supabase.from("feedback_log").insert({
      player_id: player.id,
      type: "session_rating",
      rating: delta.feedback_rating,
    });
  }

  // Apply player updates
  if (Object.keys(updates).length > 0) {
    updates.updated_at = now;
    const { data, error } = await supabase
      .from("players")
      .update(updates)
      .eq("id", player.id)
      .select()
      .single();

    if (error) {
      console.error("Error applying state delta:", error);
      return player;
    }
    return data as Player;
  }

  return player;
}
