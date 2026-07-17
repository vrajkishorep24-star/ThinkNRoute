"use client";

import { useAutoScroll } from "@/hooks/use-auto-scroll";
import { useChatStore } from "@/stores/chat-store";
import { EmptyState } from "@/components/chat/empty-state";
import { MessageBubble } from "@/components/chat/message-bubble";
import { TypingIndicator } from "@/components/chat/typing-indicator";

export function MessageList() {
  const messages = useChatStore((state) => state.messages);
  const isSending = useChatStore((state) => state.isSending);
  const scrollRef = useAutoScroll(messages.length);

  if (messages.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-5 px-5 py-6">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {isSending ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <TypingIndicator />
          Thinking
        </div>
      ) : null}
      <div ref={scrollRef} />
    </div>
  );
}
