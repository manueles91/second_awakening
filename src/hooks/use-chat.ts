"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { Player, Quest } from "@/lib/types/database";
import type { StateDelta } from "@/lib/types/state-delta";

export interface ChatMessageUI {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface UseChatOptions {
  onPlayerUpdate?: (player: Player) => void;
  onQuestsUpdate?: (quests: Quest[]) => void;
}

export function useChat(options: UseChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessageUI[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      setError(null);
      setIsLoading(true);

      // Add user message immediately
      const userMessage: ChatMessageUI = {
        id: `user-${Date.now()}`,
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      try {
        abortControllerRef.current = new AbortController();

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: content.trim() }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Request failed with status ${response.status}`);
        }

        const data = await response.json();

        // Add assistant message
        const assistantMessage: ChatMessageUI = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.narrative,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Notify about state updates
        if (data.player_state) {
          options.onPlayerUpdate?.(data.player_state);
        }
        if (data.active_quests) {
          options.onQuestsUpdate?.(data.active_quests);
        }

        return data.state_delta as StateDelta;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        const errorMessage = err instanceof Error ? err.message : "Failed to send message";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [isLoading, options]
  );

  const loadHistory = useCallback(async () => {
    try {
      const response = await fetch("/api/chat/history");
      if (response.ok) {
        const data = await response.json();
        setMessages(
          data.messages.map((msg: { id: string; role: string; content: string; created_at: string }) => ({
            id: msg.id,
            role: msg.role as "user" | "assistant",
            content: msg.content,
            timestamp: new Date(msg.created_at),
          }))
        );
      }
    } catch {
      // Silently fail — fresh session is fine
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    setMessages,
  };
}
