"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { ExperienceErrorBoundary } from "@/components/workstation/experience-error-boundary";
import { ExperienceLoader } from "@/components/workstation/experience-loader";
import { ThreeDSwitch } from "@/components/workstation/three-d-switch";
import { cn } from "@/lib/cn";
import {
  useDocumentVisible,
  useIsDesktopDevice,
  usePrefersReducedMotion,
  useSaveData,
  useWebGLSupport,
} from "@/lib/workstation/capability";
import {
  getPreference,
  getServerPreference,
  setPreference,
  subscribePreference,
} from "@/lib/workstation/preference";

type WorkstationShellProps = {
  /** Server-rendered intro copy. */
  header: ReactNode;
  /** Server-rendered poster art and its station hotspots. */
  poster: ReactNode;
  /** Server-rendered station links. */
  dock: ReactNode;
};

const LOAD_TIMEOUT_MS = 15_000;

/**
 * Client shell around the server-rendered poster.
 *
 * The poster and the station links are always in the page. The canvas is added
 * on top only when 3D is wanted and allowed, and the poster stays visible
 * until the first 3D frame is rendered.
 *
 * Decision rules:
 * - Automatic: capable desktop (fine pointer, 1024px or wider), WebGL works,
 *   no reduced motion, no Save-Data.
 * - Everything else starts on the poster. The switch can still turn 3D on, as
 *   long as WebGL works. Manual use on a non-desktop device or with reduced
 *   motion gets the light tier and a still view.
 */
export function WorkstationShell({
  header,
  poster,
  dock,
}: WorkstationShellProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  const webgl = useWebGLSupport();
  const reducedMotion = usePrefersReducedMotion();
  const desktop = useIsDesktopDevice();
  const saveData = useSaveData();
  const documentVisible = useDocumentVisible();
  const preference = useSyncExternalStore(
    subscribePreference,
    getPreference,
    getServerPreference,
  );

  const [idleReady, setIdleReady] = useState(false);
  const [inView, setInView] = useState(false);
  const [everInView, setEverInView] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  const supported = webgl === true;
  const autoEligible = supported && desktop && !reducedMotion && !saveData;
  const enabled =
    supported && (preference ? preference === "on" : autoEligible);
  const tier = autoEligible ? "full" : "light";

  // Mount only when wanted, the page is idle, and the stage has been seen.
  const shouldMount = enabled && idleReady && everInView && !failed;
  const active = inView && documentVisible;

  // Reset "ready" as soon as the canvas goes away, so a later mount starts
  // from the poster again.
  if (!shouldMount && ready) {
    setReady(false);
  }

  useEffect(() => {
    const element = rootRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setInView(entry.isIntersecting);
        if (entry.isIntersecting) setEverInView(true);
      },
      { threshold: 0.05 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Keep the 3D chunk out of the critical path: wait for load, then idle time.
  useEffect(() => {
    let cancelled = false;
    let idleHandle: number | undefined;
    let timeoutHandle: number | undefined;

    function start() {
      if (!cancelled) setIdleReady(true);
    }

    function schedule() {
      if (typeof window.requestIdleCallback === "function") {
        idleHandle = window.requestIdleCallback(start, { timeout: 2500 });
      } else {
        timeoutHandle = window.setTimeout(start, 800);
      }
    }

    if (document.readyState === "complete") {
      schedule();
    } else {
      window.addEventListener("load", schedule, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener("load", schedule);
      if (idleHandle !== undefined) window.cancelIdleCallback(idleHandle);
      if (timeoutHandle !== undefined) window.clearTimeout(timeoutHandle);
    };
  }, []);

  // Give up on 3D if it never produces a frame.
  useEffect(() => {
    if (!shouldMount || ready) return;
    const timer = window.setTimeout(() => setFailed(true), LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [shouldMount, ready]);

  const handleReady = useCallback(() => setReady(true), []);
  const handleFail = useCallback(() => setFailed(true), []);

  function handleToggle() {
    setFailed(false);
    setIdleReady(true); // a manual choice skips the idle wait
    setPreference(enabled ? "off" : "on");
  }

  function handleRetry() {
    setFailed(false);
    setIdleReady(true);
  }

  const visualState = failed
    ? "error"
    : shouldMount && ready
      ? "3d"
      : shouldMount
        ? "loading"
        : "poster";

  let statusText = "";
  if (webgl === false) statusText = "3D is not available on this device";
  else if (failed) statusText = "3D could not start";
  else if (enabled && !ready) statusText = "Loading 3D";
  else if (enabled && reducedMotion)
    statusText = "Still view, reduced motion is on";

  return (
    <div
      ref={rootRef}
      role="group"
      aria-label="Developer workstation"
      className="workstation-stage aspect-[4/5] w-full sm:aspect-[16/11] lg:aspect-[16/10]"
      data-workstation-stage
      data-state={visualState}
    >
      <div className="workstation-scan" aria-hidden />

      {shouldMount ? (
        <div
          aria-hidden
          data-workstation-canvas
          className={cn(
            "absolute inset-0 z-[1] transition-opacity duration-500 motion-reduce:transition-none",
            ready ? "opacity-100" : "opacity-0",
          )}
        >
          <ExperienceErrorBoundary onError={handleFail}>
            <ExperienceLoader
              active={active}
              tier={tier}
              calm={reducedMotion}
              onReady={handleReady}
              onFail={handleFail}
            />
          </ExperienceErrorBoundary>
        </div>
      ) : null}

      <div className="pointer-events-none relative z-10 flex h-full flex-col p-4 sm:p-6 lg:p-8">
        <div className="flex items-start justify-between gap-4">
          {header}

          <div className="pointer-events-auto flex min-h-9 flex-col items-end gap-1.5 text-right">
            {webgl === null ? null : (
              <ThreeDSwitch
                checked={enabled}
                disabled={!supported}
                onToggle={handleToggle}
              />
            )}
            <p
              role="status"
              className="max-w-40 font-mono text-[0.6rem] leading-snug tracking-wide text-muted sm:max-w-56"
            >
              {statusText}
              {failed ? (
                <>
                  {" "}
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="text-accent underline underline-offset-2"
                  >
                    Try again
                  </button>
                </>
              ) : null}
            </p>
          </div>
        </div>

        <div className="relative mt-4 min-h-0 flex-1">{poster}</div>

        {dock}
      </div>
    </div>
  );
}
