"use client";

import { ErrorFallback } from "@/components/ui/error-fallback";
import "./globals.css";

type GlobalErrorProps = {
  error: unknown;
  retry: () => void;
};

export default function GlobalError({ error, retry }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body className="min-h-full bg-background font-sans text-foreground antialiased">
        <ErrorFallback error={error} retry={retry} />
      </body>
    </html>
  );
}
