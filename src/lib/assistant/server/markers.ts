import "server-only";

import { resolveSource } from "@/lib/assistant/server/sources";
import type { SourceCatalog } from "@/lib/assistant/server/sources";
import type { SourceLink } from "@/lib/assistant/shared/protocol";

/** Longest marker body we accept, for example "project:research-evaluation-agent". */
const MAX_MARKER_BODY = 60;
const MARKER_BODY = /^(?:project|page):[a-z0-9-]+$/;

/**
 * Removes [[project:slug]] and [[page:id]] markers from a streamed answer.
 * Valid markers become source links from the allowlist. Invalid ones are
 * dropped. Markers split across chunks are held until they are complete, and
 * an unfinished marker at the end of the stream is discarded.
 */
export class MarkerFilter {
  private pending = "";
  private readonly found = new Map<string, SourceLink>();
  private readonly catalog: SourceCatalog;
  private readonly maxSources: number;

  constructor(catalog: SourceCatalog, maxSources = 4) {
    this.catalog = catalog;
    this.maxSources = maxSources;
  }

  /** Returns text that is safe to forward now. */
  push(chunk: string): string {
    this.pending += chunk;
    let out = "";

    for (;;) {
      const open = this.pending.indexOf("[[");

      if (open === -1) {
        // A trailing "[" could be the first half of "[[". Hold it back.
        if (this.pending.endsWith("[")) {
          out += this.pending.slice(0, -1);
          this.pending = "[";
        } else {
          out += this.pending;
          this.pending = "";
        }
        return out;
      }

      out += this.pending.slice(0, open);
      this.pending = this.pending.slice(open);

      const close = this.pending.indexOf("]]", 2);
      if (close === -1) {
        // Incomplete. Wait for more, unless it can no longer be a marker.
        if (this.pending.length - 2 > MAX_MARKER_BODY) {
          this.pending = this.pending.slice(2);
          continue;
        }
        return out;
      }

      const body = this.pending.slice(2, close);
      this.pending = this.pending.slice(close + 2);
      this.record(body);
    }
  }

  /** Call at the end of the stream. Drops any unfinished marker. */
  flush(): string {
    const rest = this.pending;
    this.pending = "";
    const open = rest.indexOf("[[");
    return open === -1 ? rest.replace(/\[$/, "") : rest.slice(0, open);
  }

  sources(): SourceLink[] {
    return [...this.found.values()];
  }

  private record(body: string): void {
    const key = body.trim().toLowerCase();
    if (key.length > MAX_MARKER_BODY || !MARKER_BODY.test(key)) return;
    if (this.found.size >= this.maxSources || this.found.has(key)) return;
    const link = resolveSource(key, this.catalog);
    if (link) this.found.set(key, link);
  }
}
