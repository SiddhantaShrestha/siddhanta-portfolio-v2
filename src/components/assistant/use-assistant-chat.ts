"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { readEventStream } from "@/lib/assistant/shared/events";
import { buildRequestMessages } from "@/lib/assistant/shared/history";
import {
  ASSISTANT_ENDPOINT,
  ASSISTANT_LIMITS,
} from "@/lib/assistant/shared/protocol";
import type {
  AssistantErrorCode,
  ChatRequestBody,
  SourceLink,
} from "@/lib/assistant/shared/protocol";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources: SourceLink[];
  notice?: string;
  error?: { code: AssistantErrorCode | "network"; message: string };
  /** True while the answer is still being produced. */
  pending: boolean;
};

export type ChatStatus = "idle" | "waiting" | "streaming";

const NETWORK_MESSAGE =
  "Could not reach the assistant. Check your connection and try again.";

function isErrorBody(
  value: unknown,
): value is { code: AssistantErrorCode; message: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { message?: unknown }).message === "string" &&
    typeof (value as { code?: unknown }).code === "string"
  );
}

export function useAssistantChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [announcement, setAnnouncement] = useState("");

  // A ref blocks a second submit in the same tick, before state updates.
  const busyRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const counterRef = useRef(0);
  const messagesRef = useRef<ChatMessage[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const nextId = () => {
    counterRef.current += 1;
    return `m${counterRef.current}`;
  };

  const patchLast = useCallback(
    (patch: (message: ChatMessage) => ChatMessage) => {
      setMessages((current) => {
        const last = current[current.length - 1];
        if (!last) return current;
        return [...current.slice(0, -1), patch(last)];
      });
    },
    [],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  useEffect(() => stop, [stop]);

  const send = useCallback(
    async (rawQuestion: string, starterId?: string) => {
      const question = rawQuestion
        .trim()
        .slice(0, ASSISTANT_LIMITS.maxUserChars);
      if (!question || busyRef.current) return;
      busyRef.current = true;

      const completed = messagesRef.current
        .filter((m) => !m.pending && !m.error && m.content.length > 0)
        .map((m) => ({ role: m.role, content: m.content }));
      const requestMessages = buildRequestMessages(completed, question);

      setMessages((current) => [
        ...current,
        {
          id: nextId(),
          role: "user",
          content: question,
          sources: [],
          pending: false,
        },
        {
          id: nextId(),
          role: "assistant",
          content: "",
          sources: [],
          pending: true,
        },
      ]);
      setStatus("waiting");
      setAnnouncement("Thinking");

      const controller = new AbortController();
      abortRef.current = controller;
      let failed = false;
      let sawDone = false;

      const fail = (code: AssistantErrorCode | "network", message: string) => {
        failed = true;
        patchLast((m) => ({ ...m, pending: false, error: { code, message } }));
        setAnnouncement(message);
      };

      try {
        const body: ChatRequestBody = { messages: requestMessages };
        if (starterId) body.starterId = starterId;

        const response = await fetch(ASSISTANT_ENDPOINT, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
          cache: "no-store",
        });

        const isStream = (response.headers.get("content-type") ?? "").includes(
          "application/x-ndjson",
        );

        if (!response.ok || !response.body || !isStream) {
          let parsed: unknown = null;
          try {
            parsed = await response.json();
          } catch {
            parsed = null;
          }
          if (isErrorBody(parsed)) {
            fail(parsed.code, parsed.message.slice(0, 300));
          } else {
            fail("upstream", "The assistant had a problem. Please try again.");
          }
          return;
        }

        for await (const event of readEventStream(response.body)) {
          switch (event.t) {
            case "text":
              setStatus("streaming");
              patchLast((m) => ({ ...m, content: m.content + event.v }));
              break;
            case "notice":
              patchLast((m) => ({ ...m, notice: event.v }));
              break;
            case "sources":
              patchLast((m) => ({ ...m, sources: event.v }));
              break;
            case "error":
              fail(event.code, event.message);
              break;
            case "done":
              sawDone = true;
              break;
            case "meta":
              break;
          }
        }

        if (!failed && !sawDone) {
          fail("network", "The answer was cut off. Please try again.");
        } else if (!failed) {
          patchLast((m) => ({ ...m, pending: false }));
          setAnnouncement("Answer ready");
        }
      } catch (error) {
        if (controller.signal.aborted) {
          // Cleared, closed or stopped by the visitor. Not an error.
          setAnnouncement("");
        } else {
          console.error(
            "[assistant] request failed",
            error instanceof Error ? error.name : "unknown",
          );
          fail("network", NETWORK_MESSAGE);
        }
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        busyRef.current = false;
        setStatus("idle");
      }
    },
    [patchLast],
  );

  const clear = useCallback(() => {
    stop();
    setMessages([]);
    setAnnouncement("");
  }, [stop]);

  return { messages, status, announcement, send, stop, clear };
}
