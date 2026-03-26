import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPlayerByUserId, updatePlayer } from "@/lib/db/players";
import { calculateMaxHP, calculateMaxMP } from "@/lib/types/game";
import type { StatDomain } from "@/lib/types/database";

export async function POST(request: NextRequest) {
  try {
    const { allocations } = await request.json();

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

    // Validate allocations
    const validStats: StatDomain[] = ["STR", "AGI", "VIT", "INT", "PER"];
    const statKeyMap: Record<StatDomain, keyof typeof player> = {
      STR: "str",
      AGI: "agi",
      VIT: "vit",
      INT: "int",
      PER: "per",
    };

    let totalPoints = 0;
    for (const stat of validStats) {
      const points = allocations[stat] || 0;
      if (points < 0 || !Number.isInteger(points)) {
        return NextResponse.json({ error: "Invalid allocation" }, { status: 400 });
      }
      totalPoints += points;
    }

    if (totalPoints === 0) {
      return NextResponse.json({ error: "No points to allocate" }, { status: 400 });
    }

    if (totalPoints > player.unspent_points) {
      return NextResponse.json({ error: "Not enough unspent points" }, { status: 400 });
    }

    // Build updates
    const updates: Record<string, number> = {
      unspent_points: player.unspent_points - totalPoints,
    };

    for (const stat of validStats) {
      const points = allocations[stat] || 0;
      if (points > 0) {
        const key = statKeyMap[stat];
        updates[key as string] = (player[key] as number) + points;
      }
    }

    // Recalculate derived stats
    const newVit = updates.vit ?? player.vit;
    const newInt = updates.int ?? player.int;
    updates.hp_max = calculateMaxHP(newVit, player.level);
    updates.mp_max = calculateMaxMP(newInt, player.level);

    const updatedPlayer = await updatePlayer(supabase, player.id, updates as unknown as Partial<import("@/lib/types/database").Player>);

    return NextResponse.json({ player: updatedPlayer });
  } catch (error) {
    console.error("Stat allocation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
