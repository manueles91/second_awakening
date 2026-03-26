import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { buildSystemPrompt } from "@/lib/prompts/build-system-prompt";
import { parseAIResponse } from "@/lib/ai/parse-state-delta";
import { applyStateDelta } from "@/lib/ai/apply-state-delta";
import { getPlayerByUserId } from "@/lib/db/players";
import { getActiveQuests } from "@/lib/db/quests";
import { getRecentChatHistory, saveMessage } from "@/lib/db/chat";
import { getEquippedItems, getShadowArmy } from "@/lib/db/inventory";
import type { PlayerPreferences, Shadow } from "@/lib/types/database";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch player data
    const player = await getPlayerByUserId(supabase, user.id);
    if (!player) {
      return NextResponse.json({ error: "Player not found. Complete onboarding first." }, { status: 404 });
    }

    // Fetch all player state in parallel
    const [activeQuests, chatHistory, equippedItems, shadowsRaw, prefsResult] = await Promise.all([
      getActiveQuests(supabase, player.id),
      getRecentChatHistory(supabase, player.id, 50),
      getEquippedItems(supabase, player.id),
      getShadowArmy(supabase, player.id),
      supabase
        .from("player_preferences")
        .select("*")
        .eq("player_id", player.id)
        .single(),
    ]);

    const preferences = prefsResult.data as PlayerPreferences | null;
    const shadows = shadowsRaw as Shadow[];

    // Get recent feedback ratings
    const { data: recentFeedback } = await supabase
      .from("feedback_log")
      .select("rating")
      .eq("player_id", player.id)
      .eq("type", "session_rating")
      .order("created_at", { ascending: false })
      .limit(5);

    const feedbackRatings = (recentFeedback || [])
      .map((f: { rating: string | null }) => f.rating)
      .filter(Boolean) as string[];

    // Build system prompt
    const systemPrompt = buildSystemPrompt({
      player,
      preferences,
      activeQuests,
      shadows,
      equippedItems,
      recentFeedback: feedbackRatings,
    });

    // Build conversation history for Anthropic
    const messages = chatHistory
      .filter((msg) => msg.role !== "system")
      .map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

    // Add current message
    messages.push({ role: "user", content: message });

    // Call Anthropic API
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    });

    // Extract text content
    const aiContent = response.content
      .filter((block) => block.type === "text")
      .map((block) => {
        if (block.type === "text") return block.text;
        return "";
      })
      .join("\n");

    // Parse response
    const { narrative, stateDelta } = parseAIResponse(aiContent);

    // Save messages to chat history
    await saveMessage(supabase, player.id, "user", message);
    await saveMessage(supabase, player.id, "assistant", narrative, stateDelta as Record<string, unknown>);

    // Apply state delta
    const updatedPlayer = await applyStateDelta(supabase, player, stateDelta);

    // Fetch updated quests (in case a new one was created)
    const updatedQuests = await getActiveQuests(supabase, player.id);

    return NextResponse.json({
      narrative,
      player_state: updatedPlayer,
      active_quests: updatedQuests,
      state_delta: stateDelta,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
