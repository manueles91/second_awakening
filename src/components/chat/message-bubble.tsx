"use client";

import { cn } from "@/lib/utils";
import type { ChatMessageUI } from "@/hooks/use-chat";

interface MessageBubbleProps {
  message: ChatMessageUI;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "system-glow bg-card text-card-foreground rounded-bl-md"
        )}
      >
        {!isUser && (
          <div className="mb-1 flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              System
            </span>
          </div>
        )}
        <div className="whitespace-pre-wrap">{message.content}</div>
        <div
          className={cn(
            "mt-1 text-[10px]",
            isUser ? "text-primary-foreground/60" : "text-muted-foreground"
          )}
        >
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}
