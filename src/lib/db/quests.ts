import type { SupabaseClient } from "@supabase/supabase-js";
import type { Quest, QuestStatus } from "@/lib/types/database";

export async function getActiveQuests(
  supabase: SupabaseClient,
  playerId: string
): Promise<Quest[]> {
  const { data, error } = await supabase
    .from("quest_log")
    .select("*")
    .eq("player_id", playerId)
    .eq("status", "active")
    .order("assigned_date", { ascending: false });

  if (error) {
    console.error("Error fetching active quests:", error);
    return [];
  }
  return data as Quest[];
}

export async function getQuestById(
  supabase: SupabaseClient,
  questId: string
): Promise<Quest | null> {
  const { data, error } = await supabase
    .from("quest_log")
    .select("*")
    .eq("id", questId)
    .single();

  if (error) return null;
  return data as Quest;
}

export async function createQuest(
  supabase: SupabaseClient,
  quest: Omit<Quest, "id" | "created_at">
): Promise<Quest | null> {
  const { data, error } = await supabase
    .from("quest_log")
    .insert(quest)
    .select()
    .single();

  if (error) {
    console.error("Error creating quest:", error);
    return null;
  }
  return data as Quest;
}

export async function updateQuestStatus(
  supabase: SupabaseClient,
  questId: string,
  status: QuestStatus,
  extras?: Partial<Quest>
): Promise<Quest | null> {
  const updates: Record<string, unknown> = { status, ...extras };
  if (status === "completed") {
    updates.completed_date = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("quest_log")
    .update(updates)
    .eq("id", questId)
    .select()
    .single();

  if (error) {
    console.error("Error updating quest:", error);
    return null;
  }
  return data as Quest;
}

export async function updateQuestComponents(
  supabase: SupabaseClient,
  questId: string,
  components: Quest["components"]
): Promise<Quest | null> {
  const { data, error } = await supabase
    .from("quest_log")
    .update({ components })
    .eq("id", questId)
    .select()
    .single();

  if (error) {
    console.error("Error updating quest components:", error);
    return null;
  }
  return data as Quest;
}

export async function getRecentQuests(
  supabase: SupabaseClient,
  playerId: string,
  limit: number = 10
): Promise<Quest[]> {
  const { data, error } = await supabase
    .from("quest_log")
    .select("*")
    .eq("player_id", playerId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching recent quests:", error);
    return [];
  }
  return data as Quest[];
}
