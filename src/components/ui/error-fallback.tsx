"use client";

import { useEffect } from "react";

type ErrorFallbackProps = {
  error: unknown;
  retry: () => void;
};

export function ErrorFallback({ error, retry }: ErrorFallbackProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const message =
    error instanceof Error
      ? error.message
      : "Something unexpected happened while rendering this page.";

  return (
    <main
      id="main"
      className="mx-auto flex min-h-[50vh] w-full max-w-6xl flex-col justify-center px-6 py-24"
    >
      <p className="font-mono text-xs tracking-[0.16em] text-accent uppercase">
        Error
      </p>
      <h1 className="mt-4 text-3xl font-medium tracking-tight text-foreground">
        This page could not be displayed.
      </h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
        {message}
      </p>
      <button
        type="button"
        onClick={retry}
        className="mt-8 w-fit border border-line bg-surface px-4 py-2 text-sm text-foreground hover:border-accent"
      >
        Try again
      </button>
    </main>
  );
}
