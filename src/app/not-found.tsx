import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <main
      id="main"
      className="mx-auto flex min-h-[50vh] w-full max-w-6xl flex-col justify-center px-6 py-24"
    >
      <p className="font-mono text-xs tracking-[0.16em] text-accent uppercase">
        404
      </p>
      <h1 className="mt-4 text-3xl font-medium tracking-tight">
        Page not found
      </h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
        That address is not part of this site.
      </p>
      <Link
        href="/"
        className="mt-8 w-fit text-sm text-foreground underline decoration-line underline-offset-4 hover:decoration-accent"
      >
        Return home
      </Link>
    </main>
  );
}
