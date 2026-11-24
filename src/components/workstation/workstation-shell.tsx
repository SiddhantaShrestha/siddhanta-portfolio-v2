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
import {
  ExperienceLoader,
  resetExperienceCaches,
} from "@/components/workstation/experience-loader";
import { StationDock } from "@/components/workstation/station-dock";
import { StationPanel } from "@/components/workstation/station-panel";
import { ThreeDSwitch } from "@/components/workstation/three-d-switch";
import type { StationId } from "@/content/lab";
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
};

type FailureKind = "chunk" | "timeout" | "context" | "error";

const LOAD_TIMEOUT_MS = 15_000;
const SLOW_LOAD_MS = 6_000;
/** How long to wait for the browser to give a lost WebGL context back. */
const CONTEXT_RESTORE_WAIT_MS = 5_000;
/** One automatic recovery per lost context, and no more than this per visit. */
const MAX_CONTEXT_RECOVERIES = 2;
const COMPACT_QUERY = "(max-width: 1023px)";

function subscribeCompact(onStoreChange: () => void) {
  const media = window.matchMedia(COMPACT_QUERY);
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function getCompact() {
  return window.matchMedia(COMPACT_QUERY).matches;
}

function getServerCompact() {
  return false;
}

/** Separates "the code could not be downloaded" from other failures. */
function classifyFailure(error: unknown): FailureKind {
  const text = error instanceof Error ? `${error.name} ${error.message}` : "";
  if (
    /ChunkLoadError|Failed to load chunk|Loading chunk|dynamically imported module|Importing a module script failed/i.test(
      text,
    )
  ) {
    return "chunk";
  }
  return "error";
}

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
 *
 * Failure rules: any failure returns to the poster, which keeps working. A
 * lost WebGL context gets one patient wait for the browser to restore it, then
 * a fresh canvas. Everything else shows a status line with a retry.
 */
export function WorkstationShell({ header, poster }: WorkstationShellProps) {
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
  const compactPanel = useSyncExternalStore(
    subscribeCompact,
    getCompact,
    getServerCompact,
  );

  const [idleReady, setIdleReady] = useState(false);
  const [inView, setInView] = useState(false);
  const [everInView, setEverInView] = useState(false);
  const [failure, setFailure] = useState<FailureKind | null>(null);
  const [failureCount, setFailureCount] = useState(0);
  const [ready, setReady] = useState(false);
  const [slow, setSlow] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [mountKey, setMountKey] = useState(0);
  const [selectedStation, setSelectedStation] = useState<StationId | null>(
    null,
  );

  const restoreFocusFor = useRef<StationId | null>(null);
  const contextRecoveries = useRef(0);

  const failed = failure !== null;
  const supported = webgl === true;
  const autoEligible = supported && desktop && !reducedMotion && !saveData;
  const enabled =
    supported && (preference ? preference === "on" : autoEligible);
  const tier = autoEligible ? "full" : "light";

  // Mount only when wanted, the page is idle, and the stage has been seen.
  const shouldMount = enabled && idleReady && everInView && !failed;
  const active = inView && documentVisible;
  const interactive = shouldMount && ready && !failed;

  // Reset "ready" as soon as the canvas goes away, so a later mount starts
  // from the poster again.
  if (!shouldMount && (ready || recovering || slow)) {
    setReady(false);
    setRecovering(false);
    setSlow(false);
  }

  // Leaving 3D clears the station so the poster stays usable.
  if (!interactive && selectedStation) {
    setSelectedStation(null);
  }

  const select = setSelectedStation;

  /**
   * Closes the panel. When keyboard focus is inside it, focus goes back to the
   * dock item of that station, so the visitor is not dropped at the page top.
   */
  const closePanel = useCallback(() => {
    const panel = rootRef.current?.querySelector("[data-station-panel]");
    if (panel?.contains(document.activeElement)) {
      restoreFocusFor.current = selectedStation;
    }
    setSelectedStation(null);
  }, [selectedStation]);

  useEffect(() => {
    if (selectedStation || !restoreFocusFor.current) return;
    const station = restoreFocusFor.current;
    restoreFocusFor.current = null;
    const root = rootRef.current;
    const target =
      root?.querySelector<HTMLElement>(
        `[data-station-dock] [data-station="${station}"]`,
      ) ?? root?.querySelector<HTMLElement>('[role="switch"]');
    target?.focus({ preventScroll: true });
  }, [selectedStation]);

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

  const fail = useCallback((kind: FailureKind) => {
    setFailure((current) => current ?? kind);
    setFailureCount((count) => count + 1);
  }, []);

  // Say so when loading takes long, and give up if no frame ever arrives.
  useEffect(() => {
    if (!shouldMount || ready) return;
    const slowTimer = window.setTimeout(() => setSlow(true), SLOW_LOAD_MS);
    const failTimer = window.setTimeout(() => fail("timeout"), LOAD_TIMEOUT_MS);
    return () => {
      window.clearTimeout(slowTimer);
      window.clearTimeout(failTimer);
    };
  }, [shouldMount, ready, mountKey, attempt, fail]);

  // A lost context may come back. Wait once, patiently, then give up.
  useEffect(() => {
    if (!recovering) return;
    const timer = window.setTimeout(
      () => fail("context"),
      CONTEXT_RESTORE_WAIT_MS,
    );
    return () => window.clearTimeout(timer);
  }, [recovering, fail]);

  useEffect(() => {
    if (!selectedStation) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !event.defaultPrevented) {
        event.preventDefault();
        closePanel();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedStation, closePanel]);

  const handleReady = useCallback(() => {
    setReady(true);
    setSlow(false);
    setFailureCount(0);
  }, []);

  const handleBoundaryError = useCallback(
    (error: Error) => fail(classifyFailure(error)),
    [fail],
  );

  const handleContextLost = useCallback(() => {
    // Back to the poster while the browser decides. Nothing else to do here.
    setReady(false);
    setRecovering(true);
  }, []);

  const handleContextRestored = useCallback(() => {
    setRecovering(false);
    if (contextRecoveries.current >= MAX_CONTEXT_RECOVERIES) {
      fail("context");
      return;
    }
    contextRecoveries.current += 1;
    // Baked environment and shadow textures are gone with the old context.
    // A fresh canvas rebuilds them from the cached models.
    setMountKey((key) => key + 1);
  }, [fail]);

  function handleToggle() {
    setFailure(null);
    setFailureCount(0);
    contextRecoveries.current = 0;
    select(null);
    setIdleReady(true); // a manual choice skips the idle wait
    setPreference(enabled ? "off" : "on");
  }

  async function handleRetry() {
    // Forget failed model downloads, then start a clean attempt.
    await resetExperienceCaches();
    contextRecoveries.current = 0;
    setFailure(null);
    setRecovering(false);
    setAttempt((value) => value + 1);
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
  else if (failure === "chunk") statusText = "3D could not be downloaded";
  else if (failure === "context")
    statusText = "3D stopped, graphics were reset";
  else if (failure === "timeout") statusText = "3D took too long to start";
  else if (failure) statusText = "3D could not start";
  else if (recovering) statusText = "Restoring 3D";
  else if (enabled && !ready)
    statusText = slow ? "Still loading 3D" : "Loading 3D";
  else if (enabled && reducedMotion)
    statusText = "Still view, reduced motion is on";

  // A chunk that failed once may stay failed in the bundler's cache, so a
  // reload is offered right away for it, and after repeated failures.
  const offerReload = failure === "chunk" || failureCount >= 2;

  return (
    <div
      ref={rootRef}
      role="group"
      aria-label="Developer workstation"
      className="workstation-stage aspect-[4/5] w-full sm:aspect-[16/11] lg:aspect-[16/10]"
      data-workstation-stage
      data-state={visualState}
      data-selected={selectedStation ?? undefined}
      data-failure={failure ?? undefined}
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
          <ExperienceErrorBoundary onError={handleBoundaryError}>
            <ExperienceLoader
              key={mountKey}
              attempt={attempt}
              active={active}
              tier={tier}
              calm={reducedMotion}
              selectedStation={selectedStation}
              compactPanel={compactPanel}
              onSelectStation={select}
              onReady={handleReady}
              onContextLost={handleContextLost}
              onContextRestored={handleContextRestored}
            />
          </ExperienceErrorBoundary>
        </div>
      ) : null}

      {interactive && selectedStation ? (
        <StationPanel
          station={selectedStation}
          compact={compactPanel}
          onClose={closePanel}
        />
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
                  {offerReload ? (
                    <>
                      {" "}
                      <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="text-accent underline underline-offset-2"
                      >
                        Reload page
                      </button>
                    </>
                  ) : null}
                </>
              ) : null}
            </p>
          </div>
        </div>

        <div className="relative mt-4 min-h-0 flex-1">{poster}</div>

        <StationDock
          interactive={interactive}
          selectedStation={selectedStation}
          onSelect={(id) => select(selectedStation === id ? null : id)}
        />
      </div>
    </div>
  );
}
