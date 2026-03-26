import type { SupabaseClient } from "@supabase/supabase-js";
import type { InventoryItem } from "@/lib/types/database";

export async function getInventory(
  supabase: SupabaseClient,
  playerId: string
): Promise<InventoryItem[]> {
  const { data, error } = await supabase
    .from("inventory")
    .select("*")
    .eq("player_id", playerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching inventory:", error);
    return [];
  }
  return data as InventoryItem[];
}

export async function getEquippedItems(
  supabase: SupabaseClient,
  playerId: string
): Promise<InventoryItem[]> {
  const { data, error } = await supabase
    .from("inventory")
    .select("*")
    .eq("player_id", playerId)
    .eq("is_equipped", true);

  if (error) {
    console.error("Error fetching equipped items:", error);
    return [];
  }
  return data as InventoryItem[];
}

export async function addItem(
  supabase: SupabaseClient,
  item: Omit<InventoryItem, "id" | "created_at">
): Promise<InventoryItem | null> {
  const { data, error } = await supabase
    .from("inventory")
    .insert(item)
    .select()
    .single();

  if (error) {
    console.error("Error adding item:", error);
    return null;
  }
  return data as InventoryItem;
}

export async function getShadowArmy(
  supabase: SupabaseClient,
  playerId: string
) {
  const { data, error } = await supabase
    .from("shadow_army")
    .select("*")
    .eq("player_id", playerId)
    .order("grade", { ascending: false });

  if (error) {
    console.error("Error fetching shadow army:", error);
    return [];
  }
  return data;
}
