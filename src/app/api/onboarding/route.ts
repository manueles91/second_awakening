import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { buildOnboardingPrompt } from "@/lib/prompts/build-system-prompt";
import { parseOnboardingResponse } from "@/lib/ai/parse-state-delta";
import { getPlayerByUserId, createPlayer, updatePlayer, createPlayerPreferences } from "@/lib/db/players";
import { saveMessage } from "@/lib/db/chat";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json();

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Build conversation history
    const messages: Array<{ role: "user" | "assistant"; content: string }> = [];

    if (history) {
      for (const msg of history) {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    messages.push({ role: "user", content: message });

    // Call Anthropic with onboarding prompt
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: buildOnboardingPrompt(),
      messages,
    });

    const aiContent = response.content
      .filter((block) => block.type === "text")
      .map((block) => {
        if (block.type === "text") return block.text;
        return "";
      })
      .join("\n");

    const { narrative, delta } = parseOnboardingResponse(aiContent);

    // Check if onboarding is complete
    if (delta.onboarding_complete && delta.player_name && delta.hunter_name) {
      // Create player
      let player = await getPlayerByUserId(supabase, user.id);

      if (!player) {
        player = await createPlayer(supabase, user.id, delta.player_name, delta.hunter_name);
      } else {
        player = await updatePlayer(supabase, player.id, {
          player_name: delta.player_name,
          hunter_name: delta.hunter_name,
          onboarding_complete: true,
        });
      }

      if (player && delta.preferences) {
        // Create preferences
        await createPlayerPreferences(supabase, player.id, {
          primary_genre: delta.preferences.primary_genre || "dark_fantasy",
          story_tone: (delta.preferences.story_tone as "epic" | "humorous" | "dark" | "inspirational" | "balanced") || "balanced",
          goals: delta.preferences.goals || [],
          fitness_level: (delta.preferences.fitness_level as "sedentary" | "lightly_active" | "moderately_active" | "very_active") || "sedentary",
          physical_limitations: delta.preferences.physical_limitations || [],
          difficulty: (delta.preferences.difficulty as "gentle" | "standard" | "challenging") || "standard",
          work_days: delta.preferences.work_days || ["Mon", "Tue", "Wed", "Thu", "Fri"],
          rest_days: delta.preferences.rest_days || ["Sun"],
        } as Partial<import("@/lib/types/database").PlayerPreferences>);

        // Mark onboarding complete
        await updatePlayer(supabase, player.id, { onboarding_complete: true });

        // Save the final messages to chat history
        await saveMessage(supabase, player.id, "assistant", narrative);

        // Create the first quest if included
        if (delta.new_quest) {
          await supabase.from("quest_log").insert({
            player_id: player.id,
            quest_type: delta.new_quest.type,
            quest_name: delta.new_quest.name,
            components: delta.new_quest.components
              ? delta.new_quest.components.map((c) => ({ ...c, done: false }))
              : null,
            xp_reward: delta.new_quest.xp_reward,
            gold_reward: delta.new_quest.gold_reward,
            status: "active",
            rank_at_time: "E",
            level_at_time: 1,
          });
        }
      }

      return NextResponse.json({
        narrative,
        onboarding_complete: true,
        player,
      });
    }

    return NextResponse.json({
      narrative,
      onboarding_complete: false,
    });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
