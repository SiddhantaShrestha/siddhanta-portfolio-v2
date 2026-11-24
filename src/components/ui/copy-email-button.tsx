"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

type CopyEmailButtonProps = {
  email: string;
};

export function CopyEmailButton({ email }: CopyEmailButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex min-h-11 items-center gap-2 border border-line bg-surface px-4 text-sm text-foreground transition-colors hover:border-accent"
      aria-live="polite"
    >
      {copied ? (
        <Check size={16} aria-hidden />
      ) : (
        <Copy size={16} aria-hidden />
      )}
      {copied ? "Copied" : "Copy email"}
    </button>
  );
}
