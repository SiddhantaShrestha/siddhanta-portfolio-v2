/**
 * Durable Object class for the assistant usage gate.
 *
 * This file is NOT part of the Next.js app. It is exported from the Worker
 * entry (see cloudflare/README.md) and bound as ASSISTANT_GATE. It uses the
 * classic fetch interface, so it needs no imports from "cloudflare:workers".
 *
 * Use ONE instance, named "global". That single instance is what makes the
 * daily model budget real.
 */
import { acquire, initSchema, parseAcquire, release } from "./gate-core";
import type { GateSql } from "./gate-core";

type DurableState = {
  storage: {
    sql: GateSql;
    transactionSync?: <T>(closure: () => T) => T;
  };
};

const MAX_BODY_CHARS = 1_024;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });
}

export class AssistantGate {
  private readonly sql: GateSql;
  private readonly transaction: <T>(closure: () => T) => T;

  constructor(state: DurableState) {
    this.sql = state.storage.sql;
    this.transaction =
      state.storage.transactionSync?.bind(state.storage) ??
      ((closure) => closure());
    initSchema(this.sql);
  }

  async fetch(request: Request): Promise<Response> {
    if (request.method !== "POST") return json({ error: "method" }, 405);

    const text = await request.text();
    if (text.length > MAX_BODY_CHARS) return json({ error: "too_large" }, 413);

    let input: unknown;
    try {
      input = JSON.parse(text);
    } catch {
      return json({ error: "bad_json" }, 400);
    }

    const { pathname } = new URL(request.url);

    if (pathname === "/acquire") {
      const parsed = parseAcquire(input);
      if (!parsed) return json({ error: "bad_request" }, 400);
      const result = this.transaction(() =>
        acquire(this.sql, parsed, Date.now(), crypto.randomUUID()),
      );
      return json(result);
    }

    if (pathname === "/release") {
      const raw = (input ?? {}) as Record<string, unknown>;
      if (typeof raw.visitor !== "string" || typeof raw.token !== "string") {
        return json({ error: "bad_request" }, 400);
      }
      this.transaction(() =>
        release(this.sql, raw.visitor as string, raw.token as string),
      );
      return json({ ok: true });
    }

    return json({ error: "not_found" }, 404);
  }
}
