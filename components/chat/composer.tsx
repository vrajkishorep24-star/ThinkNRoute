"use client";

import { FormEvent, KeyboardEvent } from "react";
import { Paperclip, SendHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTextareaAutosize } from "@/hooks/use-textarea-autosize";
import { useChatStore } from "@/stores/chat-store";
import { useModelStore } from "@/stores/model-store";
import { useSettingsStore } from "@/stores/settings-store";

export function Composer() {
  const draft = useChatStore((state) => state.draft);
  const setDraft = useChatStore((state) => state.setDraft);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const clearConversation = useChatStore((state) => state.clearConversation);
  const isSending = useChatStore((state) => state.isSending);
  const messageCount = useChatStore((state) => state.messages.length);
  const selectedModel = useModelStore((state) => state.selectedModel);
  const routingMode = useSettingsStore((state) => state.routingMode);
  const textareaRef = useTextareaAutosize(draft);

  const isAuto = routingMode === "auto";
  const canSend = draft.trim().length > 0 && !isSending;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage({
      content: draft,
      modelId: isAuto ? null : (selectedModel?.id ?? null),
      providerId: isAuto ? null : (selectedModel?.providerId ?? null),
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (canSend) {
        event.currentTarget.form?.requestSubmit();
      }
    }
  }

  return (
    <form
      className="mx-auto w-full max-w-4xl border-t border-border bg-background/95 px-4 py-4"
      onSubmit={handleSubmit}
    >
      <div className="rounded-md border border-border bg-secondary/30 p-2 shadow-sm">
        <Textarea
          aria-label="Message"
          className="border-0 bg-transparent shadow-none focus-visible:ring-0"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isAuto
              ? "Just type — ThinkRoute will handle the rest..."
              : selectedModel
                ? "Ask the selected model..."
                : "Select a model to start chatting..."
          }
          ref={textareaRef}
          rows={1}
          disabled={isSending}
          value={draft}
        />
        <div className="flex items-center justify-between gap-3 px-1 pt-2">
          <div className="flex items-center gap-1">
            <Button
              aria-label="Attach file"
              disabled
              size="icon"
              title="Attachments are UI-only in this phase"
              type="button"
              variant="ghost"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              aria-label="Clear conversation"
              disabled={messageCount === 0}
              onClick={clearConversation}
              size="icon"
              title="Clear conversation"
              type="button"
              variant="ghost"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <Button disabled={!canSend} type="submit">
            <SendHorizontal className="h-4 w-4" />
            {isSending ? "Sending" : "Send"}
          </Button>
        </div>
      </div>
    </form>
  );
}
