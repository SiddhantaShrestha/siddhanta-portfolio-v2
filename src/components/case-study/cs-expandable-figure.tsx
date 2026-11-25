"use client";

import Image from "next/image";
import { useEffect, useId, useRef } from "react";
import { Expand, X } from "lucide-react";
import type { CaseStudyFigure } from "@/content/projects";
import { cn } from "@/lib/cn";

type CsExpandableFigureProps = {
  figure: CaseStudyFigure;
  /** Larger in-page frame for product screenshots. */
  prominent?: boolean;
  priority?: boolean;
};

/**
 * Captioned figure with an optional native dialog for inspecting a large
 * image. No extra libraries. Escape and the Close button dismiss the dialog.
 */
export function CsExpandableFigure({
  figure,
  prominent = false,
  priority = false,
}: CsExpandableFigureProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const expandable = figure.expandable === true;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const onClose = () => {
      document.body.classList.remove("overflow-hidden");
    };
    dialog.addEventListener("close", onClose);
    return () => dialog.removeEventListener("close", onClose);
  }, []);

  function openDialog() {
    const dialog = dialogRef.current;
    if (!dialog) return;
    document.body.classList.add("overflow-hidden");
    dialog.showModal();
  }

  function closeDialog() {
    dialogRef.current?.close();
  }

  return (
    <figure>
      <div
        className={cn(
          "overflow-hidden border bg-surface",
          prominent ? "border-line-strong" : "border-line",
        )}
      >
        <Image
          src={figure.src}
          alt={figure.alt}
          width={figure.width}
          height={figure.height}
          priority={priority}
          className="h-auto w-full"
          sizes={
            prominent
              ? "(max-width: 768px) 100vw, (max-width: 1536px) 92vw, 1200px"
              : "(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1072px"
          }
        />
      </div>
      <figcaption className="mt-4 max-w-3xl text-[0.9375rem] leading-7 text-muted">
        {figure.caption}
      </figcaption>
      {expandable ? (
        <div className="mt-4">
          <button
            type="button"
            onClick={openDialog}
            className="inline-flex min-h-11 items-center gap-2 border border-accent/40 bg-accent/10 px-4 text-sm tracking-wide text-foreground transition-colors hover:border-accent hover:bg-accent/15"
          >
            <Expand size={16} aria-hidden />
            View full diagram
          </button>
        </div>
      ) : null}

      {expandable ? (
        <dialog
          ref={dialogRef}
          aria-labelledby={titleId}
          className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none border-0 bg-transparent p-0 text-foreground backdrop:bg-background/90 open:flex open:flex-col"
          onClick={(event) => {
            if (event.target === dialogRef.current) closeDialog();
          }}
          onCancel={(event) => {
            event.preventDefault();
            closeDialog();
          }}
        >
          <div className="flex items-center justify-between gap-4 border-b border-line bg-background px-4 py-3 sm:px-6">
            <p
              id={titleId}
              className="min-w-0 truncate text-sm text-foreground sm:text-base"
            >
              {figure.alt}
            </p>
            <button
              type="button"
              onClick={closeDialog}
              className="inline-flex min-h-11 shrink-0 items-center gap-2 border border-line bg-surface px-4 text-sm text-foreground hover:border-line-strong"
            >
              <X size={16} aria-hidden />
              Close
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
            <div className="mx-auto w-fit max-w-none border border-line bg-surface p-2">
              {/* Native img so the dialog can show the source at full pixel size. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={figure.src}
                alt={figure.alt}
                width={figure.width}
                height={figure.height}
                className="h-auto max-w-none"
              />
            </div>
            <p className="mx-auto mt-4 max-w-3xl text-[0.9375rem] leading-7 text-muted">
              {figure.caption}
            </p>
          </div>
        </dialog>
      ) : null}
    </figure>
  );
}
