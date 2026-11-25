"use client";

import dynamic from "next/dynamic";
import { MessageCircle } from "lucide-react";
import { useCallback, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";

// The chat code loads only when the visitor opens it or shows interest.
const loadPanel = () =>
  import("./assistant-panel").then((module) => module.AssistantPanel);

const AssistantPanel = dynamic(loadPanel, { ssr: false, loading: () => null });

export function AssistantLauncher() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  const preload = useCallback(() => {
    void loadPanel();
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    // Hand focus back to the button that opened the panel.
    requestAnimationFrame(() => buttonRef.current?.focus());
  }, []);

  return (
    <>
      {open ? <AssistantPanel panelId={panelId} onClose={close} /> : null}
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((value) => !value)}
        onPointerEnter={preload}
        onFocus={preload}
        className={cn(
          "fixed right-4 bottom-4 z-[45] inline-flex min-h-11 items-center gap-2 border border-accent/40 bg-navy/95 px-4 text-sm tracking-wide text-foreground shadow-[0_8px_24px_rgba(0,0,0,0.4)] backdrop-blur-sm transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          // On phones the open panel is a full-width sheet with its own close button.
          open && "max-sm:hidden",
        )}
      >
        <MessageCircle aria-hidden="true" className="size-4 text-accent" />
        <span>{open ? "Close assistant" : "Ask about my work"}</span>
      </button>
    </>
  );
}
