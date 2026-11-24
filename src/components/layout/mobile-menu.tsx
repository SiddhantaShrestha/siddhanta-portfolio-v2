"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { navItems } from "@/content/navigation";
import { cn } from "@/lib/cn";

type MobileMenuProps = {
  activeId: string | null;
};

export function MobileMenu({ activeId }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function closeAndNavigate() {
    setOpen(false);
  }

  return (
    <div className="md:hidden">
      <button
        type="button"
        className="inline-flex min-h-11 min-w-11 items-center justify-center border border-line bg-surface text-foreground"
        aria-expanded={open}
        aria-controls="mobile-nav-dialog"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <Menu size={18} aria-hidden />
        <span className="sr-only">Open menu</span>
      </button>

      <dialog
        id="mobile-nav-dialog"
        ref={dialogRef}
        aria-labelledby={titleId}
        className="fixed inset-0 m-0 h-dvh max-h-dvh w-full max-w-none border-0 bg-background/96 p-0 text-foreground backdrop:bg-black/60"
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === dialogRef.current) {
            setOpen(false);
          }
        }}
      >
        <div className="flex h-full flex-col px-5 pt-5 pb-8">
          <div className="flex items-center justify-between">
            <p
              id={titleId}
              className="font-mono text-xs tracking-[0.18em] text-accent uppercase"
            >
              Menu
            </p>
            <button
              type="button"
              className="inline-flex min-h-11 min-w-11 items-center justify-center border border-line bg-surface"
              onClick={() => setOpen(false)}
            >
              <X size={18} aria-hidden />
              <span className="sr-only">Close menu</span>
            </button>
          </div>

          <nav aria-label="Mobile" className="mt-10">
            <ul className="flex flex-col gap-2">
              {navItems.map((item) => {
                const isActive =
                  activeId !== null &&
                  (item.id === activeId ||
                    (item.id === "about" && activeId === "skills"));

                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex min-h-14 items-center border-b border-line px-1 text-2xl tracking-tight",
                        isActive ? "text-accent" : "text-foreground",
                      )}
                      aria-current={isActive ? "true" : undefined}
                      onClick={closeAndNavigate}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </dialog>
    </div>
  );
}
