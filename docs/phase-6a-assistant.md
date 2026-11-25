# Phase 6A: AI portfolio assistant

Status: implemented for review. Not deployed.

## How it works

- `POST /api/assistant` (`src/app/api/assistant/route.ts`) is a thin wrapper. The logic is in `src/lib/assistant/server/`.
- Knowledge is built from the typed content files plus `src/content/assistant/notes.ts`. About 28k characters, about 7k tokens. No retrieval, no database.
- The five suggested questions have fixed answers built from the same content. They need no API key and no model.
- Other questions go to a `ChatProvider`. The only provider today is Workers AI over plain `fetch` (`workers-ai.ts`).
- The response is NDJSON: `meta`, `text`, `notice`, `sources`, `error`, `done`. The server holds the link allowlist. The browser only renders what the server sends and checks each link again.

## Environment (server only)

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_AI_API_TOKEN` (API token limited to Workers AI)
- `ASSISTANT_MODEL` (optional, default `@cf/google/gemma-4-26b-a4b-it`)
- `ASSISTANT_PRODUCTION_GATES_CONFIRMED` (see below)

No `NEXT_PUBLIC_` variables are used. Keep real values in `.env.local` or host secrets, never in git.

## Deployment gates

In a production build the model path is **off** unless `ASSISTANT_PRODUCTION_GATES_CONFIRMED=true`. Starter answers still work. Set the flag only after every item is done and checked:

1. Rotate and remove the committed secrets found earlier. This is an unresolved security task and a deployment blocker.
2. A production rate limit is in place and tested (for example the Cloudflare Rate Limiting binding, per visitor). The in-memory limiter is per process and is not a public limit.
3. A global usage cap is in place and tested (for example an AI Gateway rate limit), so total cost has a ceiling.
4. A spending control is configured and verified in the Cloudflare dashboard. Do not enable paid billing without approval.
5. AI Gateway request logging stays **off** unless explicitly approved. Phase 6A does not use a gateway.
6. Confirm the chosen model is still on the plan you use (Workers AI plan rules change).
7. Decide the `cacheComponents` question for the chosen Cloudflare adapter. Phase 6A did not change it.

## Known limits

- In-memory limits are per process. Serverless instances do not share them.
- The visitor key comes from `cf-connecting-ip`, then `x-real-ip`, then `x-forwarded-for`. The last two can be spoofed when the app is reachable without a trusted proxy.
- The output guard checks one sentence at a time. It catches figures that are not in the verified content, ownership phrases that contradict the notes, copied system rules, and unverified links. It cannot judge every false statement.
- Small whole numbers (12 or less) pass unless they carry a unit such as "years" or "%".

## Checks

- `npm run test:assistant` runs the unit and red-team tests with Node's test runner. No new dependencies.
- `npm run check:assistant-bundle` runs after `npm run build` and fails if server-only strings appear in `.next/static`.
