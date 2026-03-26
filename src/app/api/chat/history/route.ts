import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPlayerByUserId } from "@/lib/db/players";
import { getRecentChatHistory } from "@/lib/db/chat";

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
      return NextResponse.json({ messages: [] });
    }

    const messages = await getRecentChatHistory(supabase, player.id, 50);

    return NextResponse.json({
      messages: messages.filter((m) => m.role !== "system"),
    });
  } catch (error) {
    console.error("Chat history error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
