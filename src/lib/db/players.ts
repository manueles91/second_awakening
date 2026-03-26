import type { SupabaseClient } from "@supabase/supabase-js";
import type { Player, PlayerPreferences } from "@/lib/types/database";

export async function getPlayerByUserId(
  supabase: SupabaseClient,
  userId: string
): Promise<Player | null> {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) return null;
  return data as Player;
}

export async function getPlayerById(
  supabase: SupabaseClient,
  playerId: string
): Promise<Player | null> {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("id", playerId)
    .single();

  if (error) return null;
  return data as Player;
}

export async function createPlayer(
  supabase: SupabaseClient,
  userId: string,
  playerName: string,
  hunterName: string
): Promise<Player | null> {
  const { data, error } = await supabase
    .from("players")
    .insert({
      user_id: userId,
      player_name: playerName,
      hunter_name: hunterName,
      program_start_date: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating player:", error);
    return null;
  }
  return data as Player;
}

export async function updatePlayer(
  supabase: SupabaseClient,
  playerId: string,
  updates: Partial<Player>
): Promise<Player | null> {
  const { data, error } = await supabase
    .from("players")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", playerId)
    .select()
    .single();

  if (error) {
    console.error("Error updating player:", error);
    return null;
  }
  return data as Player;
}

export async function getPlayerPreferences(
  supabase: SupabaseClient,
  playerId: string
): Promise<PlayerPreferences | null> {
  const { data, error } = await supabase
    .from("player_preferences")
    .select("*")
    .eq("player_id", playerId)
    .single();

  if (error) return null;
  return data as PlayerPreferences;
}

export async function createPlayerPreferences(
  supabase: SupabaseClient,
  playerId: string,
  preferences: Partial<PlayerPreferences>
): Promise<PlayerPreferences | null> {
  const { data, error } = await supabase
    .from("player_preferences")
    .insert({ ...preferences, player_id: playerId })
    .select()
    .single();

  if (error) {
    console.error("Error creating preferences:", error);
    return null;
  }
  return data as PlayerPreferences;
}

export async function updatePlayerPreferences(
  supabase: SupabaseClient,
  playerId: string,
  updates: Partial<PlayerPreferences>
): Promise<PlayerPreferences | null> {
  const { data, error } = await supabase
    .from("player_preferences")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("player_id", playerId)
    .select()
    .single();

  if (error) {
    console.error("Error updating preferences:", error);
    return null;
  }
  return data as PlayerPreferences;
}
