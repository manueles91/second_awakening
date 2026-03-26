import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPlayerByUserId, updatePlayer } from "@/lib/db/players";
import { addItem } from "@/lib/db/inventory";
import type { Rank, Player } from "@/lib/types/database";

interface ShopItem {
  name: string;
  cost: number;
  type: "consumable";
  effect: string;
}

const SHOP_ITEMS: Record<string, ShopItem> = {
  minor_health_potion: { name: "Minor Health Potion", cost: 50, type: "consumable", effect: "Restore 30 HP" },
  health_potion: { name: "Health Potion", cost: 150, type: "consumable", effect: "Restore 80 HP" },
  minor_mana_potion: { name: "Minor Mana Potion", cost: 50, type: "consumable", effect: "Restore 30 MP" },
  mana_potion: { name: "Mana Potion", cost: 150, type: "consumable", effect: "Restore 80 MP" },
  fatigue_tonic: { name: "Fatigue Tonic", cost: 200, type: "consumable", effect: "Reduce fatigue by 20" },
  xp_boost_scroll: { name: "XP Boost Scroll", cost: 300, type: "consumable", effect: "1.5x XP for next quest" },
  gold_boost_scroll: { name: "Gold Boost Scroll", cost: 200, type: "consumable", effect: "2x Gold for next quest" },
  streak_shield: { name: "Streak Shield", cost: 500, type: "consumable", effect: "Protects streak for 1 missed day" },
  reroll_token: { name: "Reroll Token", cost: 400, type: "consumable", effect: "Get a new daily quest" },
  stat_reset_scroll: { name: "Stat Reset Scroll", cost: 1000, type: "consumable", effect: "Redistribute all stat points" },
};

export async function POST(request: NextRequest) {
  try {
    const { item: itemKey, quantity = 1 } = await request.json();

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

    const shopItem = SHOP_ITEMS[itemKey];
    if (!shopItem) {
      return NextResponse.json({ error: "Item not found in shop" }, { status: 404 });
    }

    const totalCost = shopItem.cost * quantity;
    if (player.gold < totalCost) {
      return NextResponse.json({ error: "Not enough gold" }, { status: 400 });
    }

    // Deduct gold
    const updatedPlayer = await updatePlayer(supabase, player.id, {
      gold: player.gold - totalCost,
    } as Partial<Player>);

    // Add item to inventory
    await addItem(supabase, {
      player_id: player.id,
      item_type: "consumable",
      item_name: shopItem.name,
      item_rank: player.rank as Rank,
      attack: 0,
      defense: 0,
      special_effect: shopItem.effect,
      special_effect_description: shopItem.effect,
      upgrade_level: 0,
      quantity,
      is_equipped: false,
      source: "shop",
    });

    return NextResponse.json({
      player: updatedPlayer,
      purchased: { item: shopItem.name, quantity, cost: totalCost },
    });
  } catch (error) {
    console.error("Shop purchase error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
