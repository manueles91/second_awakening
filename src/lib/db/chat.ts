import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChatMessage, ChatRole } from "@/lib/types/database";

export async function getChatHistory(
  supabase: SupabaseClient,
  playerId: string,
  limit: number = 50
): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("chat_history")
    .select("*")
    .eq("player_id", playerId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("Error fetching chat history:", error);
    return [];
  }
  return data as ChatMessage[];
}

export async function getRecentChatHistory(
  supabase: SupabaseClient,
  playerId: string,
  limit: number = 50
): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("chat_history")
    .select("*")
    .eq("player_id", playerId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching recent chat:", error);
    return [];
  }
  // Reverse to get chronological order
  return (data as ChatMessage[]).reverse();
}

export async function saveMessage(
  supabase: SupabaseClient,
  playerId: string,
  role: ChatRole,
  content: string,
  stateDelta?: Record<string, unknown>
): Promise<ChatMessage | null> {
  const { data, error } = await supabase
    .from("chat_history")
    .insert({
      player_id: playerId,
      role,
      content,
      state_delta: stateDelta || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error saving message:", error);
    return null;
  }
  return data as ChatMessage;
}
