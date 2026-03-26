import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPlayerByUserId } from "@/lib/db/players";
import { getActiveQuests } from "@/lib/db/quests";
import { getEquippedItems, getShadowArmy } from "@/lib/db/inventory";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const player = await getPlayerByUserId(supabase, user.id);
    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const [activeQuests, equippedItems, shadows] = await Promise.all([
      getActiveQuests(supabase, player.id),
      getEquippedItems(supabase, player.id),
      getShadowArmy(supabase, player.id),
    ]);

    return NextResponse.json({
      player,
      active_quests: activeQuests,
      equipped_items: equippedItems,
      shadows,
    });
  } catch (error) {
    console.error("Player API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
