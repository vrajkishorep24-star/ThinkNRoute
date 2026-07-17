"use client";

import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { formatRelativeTime } from "@/lib/utils";
import { useProviderStore } from "@/stores/provider-store";
import type { ChatMessage } from "@/types/chat";

interface MessageBubbleProps {
  message: ChatMessage;
}

const PROVIDER_LABELS: Record<string, string> = {
  gemini: "Google Gemini",
  groq: "Groq",
  cloudflare: "Cloudflare Workers AI",
  ollama: "Ollama",
};

export function MessageBubble({ message }: MessageBubbleProps) {
  const provider = useProviderStore((state) => state.providers.find((item) => item.id === message.providerId));
  const model = provider?.availableModels.find((item) => item.id === message.modelId);
  const isUser = message.role === "user";
  const routing = message.routing;
  const context = message.context;

  return (
    <motion.article
      animate={{ opacity: 1, y: 0 }}
      className="group grid gap-2"
      initial={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.18 }}
    >
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">
          {isUser ? "You" : provider?.name ?? message.providerId ?? "Assistant"}
        </span>
        <span>{formatRelativeTime(new Date(message.createdAt))}</span>
        {message.modelId ? <span>{model?.name ?? message.modelId}</span> : null}
      </div>
      <div className="markdown-body max-w-[860px] rounded-md border border-border bg-secondary/35 px-4 py-3 text-sm leading-6 shadow-sm">
        <ReactMarkdown>{message.content}</ReactMarkdown>
      </div>
      {!isUser && routing ? (
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-md border border-accent/25 bg-accent/8 px-2 py-0.5 text-[10px] font-medium text-accent">
              Routed to {PROVIDER_LABELS[routing.provider] ?? routing.provider}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground capitalize">
              Intent: {routing.intent.replace("_", " ")}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground capitalize">
              {routing.complexity}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {Math.round(routing.confidence * 100)}%
            </span>
            {typeof routing.total_ms === "number" && routing.total_ms > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {(routing.total_ms / 1000).toFixed(2)}s
              </span>
            ) : null}
          </div>
          {routing.reason ? (
            <p className="text-[10px] leading-4 text-muted-foreground/70 italic pl-0.5">
              {routing.reason}
            </p>
          ) : null}
        </div>
      ) : null}
      {!isUser && context ? <ContextChip context={context} /> : null}
    </motion.article>
  );
}

function ContextChip({ context }: { context: NonNullable<ChatMessage["context"]> }) {
  if (!context.used) {
    return (
      <div className="flex items-center gap-1.5 pl-0.5 text-[10px] text-muted-foreground/70">
        <span>🧠</span>
        <span>No previous context used{context.is_new_topic ? " — new topic" : ""}.</span>
      </div>
    );
  }

  return (
    <div className="space-y-1 rounded-md border border-accent/20 bg-accent/5 px-2.5 py-1.5">
      <div className="flex items-center gap-1.5 text-[10px] font-medium text-accent">
        <span>🧠</span>
        <span>
          Context Used — {context.used_count} of {context.total_history} prior message
          {context.total_history !== 1 ? "s" : ""}
        </span>
      </div>
      <ul className="grid gap-0.5">
        {context.messages
          .filter((m) => m.role === "user")
          .map((m, i) => (
            <li
              className="truncate text-[10px] leading-4 text-muted-foreground"
              key={`${i}-${m.content.slice(0, 12)}`}
              title={m.content}
            >
              • {m.content}
            </li>
          ))}
      </ul>
    </div>
  );
}
