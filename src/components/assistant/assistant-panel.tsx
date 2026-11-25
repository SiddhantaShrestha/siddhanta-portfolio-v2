"use client";

import Link from "next/link";
import { ChevronDown, SendHorizontal, Trash2, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { cn } from "@/lib/cn";
import { ASSISTANT_LIMITS } from "@/lib/assistant/shared/protocol";
import { starterQuestions } from "@/lib/assistant/shared/starter-questions";
import { MessageText } from "./message-text";
import { useAssistantChat } from "./use-assistant-chat";
import type { ChatMessage } from "./use-assistant-chat";

/** Questions shown before the visitor asks for more, or types their own. */
const INITIAL_STARTERS = 3;

type AssistantPanelProps = {
  panelId: string;
  onClose: () => void;
};

export function AssistantPanel({ panelId, onClose }: AssistantPanelProps) {
  const { messages, status, announcement, send, stop, clear } =
    useAssistantChat();
  const [draft, setDraft] = useState("");
  // Empty state: show 3 starters, with a way to see the rest.
  const [showAllStarters, setShowAllStarters] = useState(false);
  // After the chat starts: suggestions stay one tap away, closed by default.
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const startersId = useId();
  const inputId = useId();
  const busy = status !== "idle";

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Keep the newest text in view by scrolling the panel list only. Instant,
  // so reduced motion is respected, and the page behind never moves.
  // While an answer streams, follow it only if the visitor has not scrolled
  // up to read earlier messages. A new message always jumps to the bottom.
  const followRef = useRef(true);
  const messageCount = messages.length;

  useEffect(() => {
    followRef.current = true;
  }, [messageCount]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el && messageCount > 0 && followRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, messageCount]);

  function onListScroll() {
    const el = scrollRef.current;
    if (!el) return;
    followRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  const hasConversation = messages.length > 0;

  function submit(event?: FormEvent) {
    event?.preventDefault();
    if (busy || draft.trim().length === 0) return;
    const question = draft;
    setDraft("");
    setSuggestionsOpen(false);
    void send(question);
  }

  function ask(starter: (typeof starterQuestions)[number]) {
    if (busy) return;
    setSuggestionsOpen(false);
    void send(starter.question, starter.id);
    // The starter button is about to unmount. Keep focus in the panel.
    inputRef.current?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    // preventDefault tells the 3D workstation's own Escape handler to stand
    // down, so closing the assistant never also closes a station panel.
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <section
      id={panelId}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      onKeyDown={onKeyDown}
      className={cn(
        "fixed inset-x-0 bottom-0 z-[45] flex max-h-[85dvh] flex-col border border-line-strong bg-navy/95 text-foreground shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-sm",
        "sm:inset-x-auto sm:right-4 sm:bottom-20 sm:w-[24rem]",
        // Compact until a conversation starts, then the history gets the room.
        hasConversation
          ? "h-[min(85dvh,36rem)] sm:h-[34rem]"
          : "h-auto sm:max-h-[34rem]",
      )}
    >
      <header className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <h2 id={titleId} className="text-sm font-medium tracking-wide">
            Ask about my work
          </h2>
          <p className="text-xs text-muted">
            AI assistant · verified content only
          </p>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 ? (
            <button
              type="button"
              onClick={clear}
              className="inline-flex min-h-11 min-w-11 items-center justify-center text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              aria-label="Clear conversation"
            >
              <Trash2 aria-hidden="true" className="size-4" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 min-w-11 items-center justify-center text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            aria-label="Close assistant"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>
      </header>

      <div
        ref={scrollRef}
        onScroll={onListScroll}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3"
      >
        {hasConversation ? (
          <ol className="space-y-4" aria-label="Conversation">
            {messages.map((message) => (
              <MessageItem key={message.id} message={message} />
            ))}
          </ol>
        ) : (
          <>
            <p className="mb-2 text-sm leading-relaxed text-muted">
              Answers come from verified content on this site.
            </p>
            <p className="mb-2 text-xs tracking-wide text-muted uppercase">
              Suggested questions
            </p>
            <ul id={startersId} className="flex flex-col gap-2">
              {(showAllStarters
                ? starterQuestions
                : starterQuestions.slice(0, INITIAL_STARTERS)
              ).map((starter) => (
                <li key={starter.id}>
                  <StarterButton
                    question={starter.question}
                    disabled={busy}
                    onClick={() => ask(starter)}
                  />
                </li>
              ))}
            </ul>
            {starterQuestions.length > INITIAL_STARTERS ? (
              <button
                type="button"
                onClick={() => setShowAllStarters((value) => !value)}
                aria-expanded={showAllStarters}
                aria-controls={startersId}
                className="mt-2 inline-flex min-h-11 items-center gap-1 text-xs text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {showAllStarters ? "Fewer questions" : "More questions"}
                <ChevronDown
                  aria-hidden="true"
                  className={cn("size-3.5", showAllStarters && "rotate-180")}
                />
              </button>
            ) : null}
          </>
        )}
      </div>

      {hasConversation && !busy ? (
        <div className="border-t border-line px-3 pt-1">
          <button
            type="button"
            onClick={() => setSuggestionsOpen((value) => !value)}
            aria-expanded={suggestionsOpen}
            aria-controls={startersId}
            className="inline-flex min-h-11 items-center gap-1 text-xs text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Suggested questions
            <ChevronDown
              aria-hidden="true"
              className={cn("size-3.5", suggestionsOpen && "rotate-180")}
            />
          </button>
          {suggestionsOpen ? (
            <ul
              id={startersId}
              className="mb-2 flex max-h-28 flex-col gap-2 overflow-y-auto"
            >
              {starterQuestions.map((starter) => (
                <li key={starter.id}>
                  <StarterButton
                    question={starter.question}
                    disabled={busy}
                    onClick={() => ask(starter)}
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>

      <form
        onSubmit={submit}
        className={cn(
          "p-3",
          !(hasConversation && !busy) && "border-t border-line",
        )}
      >
        <label htmlFor={inputId} className="sr-only">
          Your question
        </label>
        <div className="flex items-end gap-2">
          <textarea
            id={inputId}
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onInputKeyDown}
            rows={2}
            maxLength={ASSISTANT_LIMITS.maxUserChars}
            placeholder="Ask about my projects or skills"
            className="min-h-11 flex-1 resize-none border border-line bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          />
          {busy ? (
            <button
              type="button"
              onClick={stop}
              className="inline-flex min-h-11 items-center justify-center border border-line px-3 text-sm text-foreground transition-colors hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={draft.trim().length === 0}
              className="inline-flex min-h-11 min-w-11 items-center justify-center border border-accent/40 bg-accent/10 text-foreground transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Send question"
            >
              <SendHorizontal aria-hidden="true" className="size-4" />
            </button>
          )}
        </div>
        <p className="mt-2 text-[11px] leading-snug text-muted">
          Answers may be wrong. Questions are sent to an AI service, so please
          do not share personal details.
        </p>
      </form>
    </section>
  );
}

function StarterButton({
  question,
  disabled,
  onClick,
}: {
  question: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="min-h-11 w-full border border-line bg-surface px-3 py-2 text-left text-sm transition-colors hover:border-accent/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
    >
      {question}
    </button>
  );
}

function MessageItem({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const waiting =
    message.pending && message.content.length === 0 && !message.error;

  return (
    <li className={cn("flex flex-col gap-1", isUser && "items-end")}>
      <span className="sr-only">{isUser ? "You" : "Assistant"}</span>
      <div
        className={cn(
          "max-w-[92%] px-3 py-2.5 text-[15px] leading-relaxed",
          isUser
            ? "border border-accent/30 bg-accent/10 whitespace-pre-wrap"
            : "border border-line bg-surface",
        )}
      >
        {waiting ? (
          <span className="text-muted">Thinking…</span>
        ) : isUser ? (
          message.content
        ) : (
          <MessageText text={message.content} />
        )}
        {message.notice ? (
          <p className="mt-2 text-xs text-muted italic">{message.notice}</p>
        ) : null}
        {message.error ? (
          <p className="mt-2 text-xs text-[#ffb4a8]">{message.error.message}</p>
        ) : null}
      </div>
      {message.sources.length > 0 ? (
        <div className="flex max-w-[92%] flex-wrap items-center gap-2 text-xs">
          <span className="text-muted">Sources</span>
          {message.sources.map((source) => (
            <Link
              key={source.href}
              href={source.href}
              className="border border-line px-2 py-1 text-foreground underline-offset-4 transition-colors hover:border-accent/60 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {source.label}
            </Link>
          ))}
        </div>
      ) : null}
    </li>
  );
}
