"use client";

import { ChatInterface } from "@/components/chat/chat-interface";
import { useChat } from "@/hooks/use-chat";
import { useGameContext } from "../layout";

export default function ChatPage() {
  const { updatePlayer, updateQuests } = useGameContext();

  const { messages, isLoading, error, sendMessage } = useChat({
    onPlayerUpdate: updatePlayer,
    onQuestsUpdate: updateQuests,
  });

  return (
    <div className="h-full">
      <ChatInterface
        messages={messages}
        isLoading={isLoading}
        error={error}
        onSend={sendMessage}
      />
    </div>
  );
}
