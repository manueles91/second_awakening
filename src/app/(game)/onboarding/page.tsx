"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MessageBubble } from "@/components/chat/message-bubble";
import { ChatInput } from "@/components/chat/chat-input";
import type { ChatMessageUI } from "@/hooks/use-chat";

export default function OnboardingPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessageUI[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Start onboarding conversation
  const startOnboarding = useCallback(async () => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    setIsLoading(true);
    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "I'm ready to begin.",
          history: [],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages([
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: data.narrative,
            timestamp: new Date(),
          },
        ]);
      }
    } catch {
      setError("Failed to start onboarding. Please refresh.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    startOnboarding();
  }, [startOnboarding]);

  async function handleSend(content: string) {
    if (!content.trim() || isLoading) return;

    const userMessage: ChatMessageUI = {
      id: `user-${Date.now()}`,
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content.trim(),
          history: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) throw new Error("Request failed");

      const data = await response.json();

      const assistantMessage: ChatMessageUI = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.narrative,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // If onboarding is complete, redirect to chat
      if (data.onboarding_complete) {
        setTimeout(() => {
          router.push("/chat");
        }, 3000);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mx-auto flex max-w-2xl flex-col gap-3">
          {/* Onboarding header */}
          <div className="mb-4 text-center">
            <div className="mb-2 text-2xl font-bold">
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                ARISE
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Hunter Awakening Protocol</p>
          </div>

          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="system-glow rounded-2xl rounded-bl-md bg-card px-4 py-3">
                <div className="mb-1 text-xs font-bold uppercase tracking-wider text-primary">
                  System
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-primary" />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>
      </div>

      <ChatInput onSend={handleSend} isLoading={isLoading} />
    </div>
  );
}
