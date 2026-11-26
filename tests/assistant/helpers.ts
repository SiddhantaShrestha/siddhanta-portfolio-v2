import { DatabaseSync } from "node:sqlite";
import { AssistantGate } from "../../cloudflare/assistant-gate";
import type { GateSql, SqlValue } from "../../cloudflare/gate-core";
import { createDurableGate } from "@/lib/assistant/server/gate-durable";
import type { DurableObjectNamespaceLike } from "@/lib/assistant/server/gate-durable";
import { createDefaultDeps } from "@/lib/assistant/server/handler";
import type { HandlerDeps } from "@/lib/assistant/server/handler";
import { ProviderError } from "@/lib/assistant/server/provider";
import type { RuntimeContext } from "@/lib/assistant/server/runtime";
import type {
  ChatProvider,
  ProviderRequest,
} from "@/lib/assistant/server/provider";
import type { AssistantEvent } from "@/lib/assistant/shared/protocol";

export const ORIGIN = "http://localhost:3000";

export const FAKE_CONFIG = {
  accountId: "a".repeat(32),
  apiToken: "test-token-not-a-real-credential",
  model: "@cf/test/fake-model",
  baseUrl: "https://example.invalid/client/v4",
  maxOutputTokens: 400,
  maxOutputChars: 1800,
  timeoutMs: 5_000,
};

export type ScriptedProvider = ChatProvider & {
  calls: ProviderRequest[];
};

/** A model that replays fixed text deltas, or throws a chosen error. */
export function scriptedProvider(
  script: string[] | { error: ProviderError },
): ScriptedProvider {
  const calls: ProviderRequest[] = [];
  return {
    id: "scripted",
    calls,
    async *stream(request) {
      calls.push(request);
      if (!Array.isArray(script)) throw script.error;
      for (const delta of script) {
        if (request.signal.aborted) return;
        yield delta;
        // Let the consumer interleave, like a real network stream.
        await Promise.resolve();
      }
    },
  };
}

export function makeDeps(
  provider: ChatProvider | null,
  overrides: Partial<HandlerDeps> = {},
): HandlerDeps {
  return {
    ...createDefaultDeps(),
    getConfig: () =>
      provider
        ? { status: "ready", config: FAKE_CONFIG }
        : { status: "unconfigured" },
    getProvider: () => {
      if (!provider) throw new Error("No provider in this test.");
      return provider;
    },
    ...overrides,
  };
}

export function chatRequest(
  body: unknown,
  options: {
    ip?: string;
    origin?: string | null;
    contentType?: string;
    raw?: BodyInit;
    headers?: Record<string, string>;
  } = {},
): Request {
  const headers: Record<string, string> = {
    "content-type": options.contentType ?? "application/json",
    "cf-connecting-ip": options.ip ?? "203.0.113.7",
    ...options.headers,
  };
  if (options.origin !== null) headers.origin = options.origin ?? ORIGIN;

  return new Request(`${ORIGIN}/api/assistant`, {
    method: "POST",
    headers,
    body: options.raw ?? JSON.stringify(body),
  });
}

export function ask(question: string, extra: Record<string, unknown> = {}) {
  return { messages: [{ role: "user", content: question }], ...extra };
}

export async function readEvents(
  response: Response,
): Promise<AssistantEvent[]> {
  const text = await response.text();
  return text
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as AssistantEvent);
}

export function textOf(events: AssistantEvent[]): string {
  return events
    .filter((e): e is Extract<AssistantEvent, { t: "text" }> => e.t === "text")
    .map((e) => e.v)
    .join("");
}

export function sourcesOf(events: AssistantEvent[]) {
  const found = events.find(
    (e): e is Extract<AssistantEvent, { t: "sources" }> => e.t === "sources",
  );
  return found?.v ?? [];
}

/** Build an SSE byte stream split into the given chunks. */
export function sseResponse(chunks: string[], init: ResponseInit = {}) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
  return new Response(stream, {
    status: 200,
    headers: { "content-type": "text/event-stream" },
    ...init,
  });
}

export function sseData(content: string): string {
  return `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`;
}

/** Wraps a real SQLite engine in the shape of Durable Object SQL storage. */
export function sqliteGateSql(db = new DatabaseSync(":memory:")): GateSql {
  return {
    exec(query: string, ...bindings: SqlValue[]) {
      const statement = db.prepare(query);
      const rows = /^\s*select/i.test(query)
        ? (statement.all(...bindings) as Record<string, unknown>[])
        : (statement.run(...bindings), []);
      return { toArray: () => rows };
    },
  };
}

export type FakeGateNamespace = DurableObjectNamespaceLike & {
  /** Every request the namespace received, in order. */
  requests: { path: string; body: unknown }[];
  /** Make the next calls fail like a broken or slow Durable Object. */
  failWith: ((url: string) => Promise<Response>) | null;
};

/**
 * One real AssistantGate (the Durable Object class) on in-memory SQLite.
 * Sharing it between several makeDeps() calls models several Worker isolates
 * that each have their own in-memory counters but one shared Durable Object.
 */
export function fakeGateNamespace(): FakeGateNamespace {
  const gate = new AssistantGate({ storage: { sql: sqliteGateSql() } });
  const namespace: FakeGateNamespace = {
    requests: [],
    failWith: null,
    idFromName: (name) => name,
    get: () => ({
      async fetch(input, init) {
        const raw = String(init?.body ?? "null");
        let body: unknown = raw;
        try {
          body = JSON.parse(raw);
        } catch {
          // Keep the raw text for requests that are not JSON.
        }
        namespace.requests.push({ path: new URL(input).pathname, body });
        if (namespace.failWith) return namespace.failWith(input);
        return gate.fetch(new Request(input, init));
      },
    }),
  };
  return namespace;
}

export const GATE_LIMITS = {
  perVisitorLimit: 6,
  windowMs: 60_000,
  dailyLimit: 100,
  lockMs: 30_000,
};

/** Deps shaped like Cloudflare production, with a shared gate. */
export function cloudflareRuntime(
  namespace: DurableObjectNamespaceLike,
  limits: Partial<typeof GATE_LIMITS> = {},
  extra: Partial<RuntimeContext> = {},
): RuntimeContext {
  return {
    cloudflare: true,
    gate: createDurableGate(namespace, { ...GATE_LIMITS, ...limits }),
    edgeLimit: null,
    ai: null,
    env: undefined,
    ...extra,
  };
}
