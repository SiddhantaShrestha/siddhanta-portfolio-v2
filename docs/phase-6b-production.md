# Phase 6B: production protection

Phase 6B keeps the Phase 6A design and adds real protection for the model
path. Public AI access is still off. Nothing is deployed.

## What changed

- **Shared gate.** One Durable Object (`AssistantGate`) holds the daily model
  budget, the per-visitor limit and the in-flight lock. It is exact across all
  Worker isolates and locations. Code: `cloudflare/gate-core.ts` (logic),
  `cloudflare/assistant-gate.ts` (the class), `src/lib/assistant/server/gate*.ts`
  (client, fails closed).
- **Edge pre-filter.** Optional Rate Limiting binding `ASSISTANT_EDGE_LIMIT`.
  It is per location and approximate, so it only blocks early and is never the
  strict limit.
- **Trusted IP only.** The visitor key uses `cf-connecting-ip` and only when
  Cloudflare bindings are present (or in development). `x-forwarded-for` and
  `x-real-ip` are never read. IPv6 is grouped by /64. Without a trusted header
  every caller shares one bucket.
- **Model path is closed in production unless all of these hold:**
  1. the shared gate is bound and answers,
  2. `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_AI_API_TOKEN` are set,
  3. `ASSISTANT_PRODUCTION_GATES_CONFIRMED` is `true`.
     A missing `NODE_ENV` counts as production. Starters never need any of this.
- **Origin check** also accepts an Origin that matches the `Host` header,
  because OpenNext reports `request.url` as `http://localhost:PORT`.

## Limits

| Limit                 | Value                        | Enforced by                  |
| --------------------- | ---------------------------- | ---------------------------- |
| Model turns per day   | `ASSISTANT_DAILY_LIMIT`, 100 | Durable Object, hard max 500 |
| Per visitor           | 6 per minute                 | Durable Object               |
| One request at a time | per visitor                  | Durable Object, 30 s expiry  |
| Edge pre-filter       | 30 per minute per location   | Rate Limiting binding        |
| All requests          | 40 per minute per process    | memory, soft layer           |

A turn costs at most about 80 neurons on the default model (about 7.6k input
tokens at 9,091 neurons per M, 400 output tokens at 27,273 per M). 100 turns
stay under the 10,000 neuron free allocation. A refused request does not use
budget. An allowed request is counted even if the model then fails.

A crowd can still use up the daily budget and switch the AI off for others
until 00:00 UTC. It cannot go over the budget. Starters keep working.

## Spending

On Workers Free, Cloudflare stops Workers AI and Durable Objects at the free
limit with an error, so there is no overage bill. This comes from the
Cloudflare docs. It was not tested live. It stops being true if the account is
moved to Workers Paid. Do not upgrade without a spend plan.

## Account setup needed from you

1. Keep the account on Workers Free. Check the billing page shows no paid plan.
2. Create an API token with Workers AI permission only, limited to this
   account. Store it as a Worker secret, never in the repo.
3. `wrangler secret put CLOUDFLARE_ACCOUNT_ID` and
   `wrangler secret put CLOUDFLARE_AI_API_TOKEN`.
4. Add the bindings from `cloudflare/wrangler.assistant.example.jsonc`.
5. Set `NEXT_PUBLIC_SITE_URL` to the real origin at build time.
6. Optional: a Cloudflare WAF rate limiting rule on `/api/assistant`.
7. Do not turn on AI Gateway logging.
8. Rotate and remove the committed secrets (still open from earlier phases).

## Deployment compatibility (checked)

Checked in a throwaway copy, not in this repo.

- OpenNext (`@opennextjs/cloudflare` 1.20.18, wrangler 4.168.0): the build
  works. `/api/assistant`, the Durable Object gate, the Rate Limiting binding,
  vars and secrets all work on local workerd. **Pages return 500 with
  `cacheComponents: true`** (the Worker "hangs"). With `cacheComponents: false`
  the same build serves pages and the assistant. The adapter prints that Cache
  Components are not fully supported. This is not caused by the assistant: even
  `robots.txt` failed.
- vinext (`npx vinext check`): reports `cacheComponents` as experimental, and
  says Turbopack loader rules are ignored. This project uses a Turbopack rule
  for Tailwind, so styling would need a Vite plugin.
- So neither path works unchanged. Deciding between them (or turning off
  `cacheComponents`) is a deployment decision and was not made here.

The assistant itself works with either adapter. It finds bindings through the
OpenNext context or `cloudflare:workers` (both checked on workerd).

If you use OpenNext, the Worker entry must re-export the class:

```ts
import { default as handler } from "./.open-next/worker.js";
export default { fetch: handler.fetch };
export { AssistantGate } from "./cloudflare/assistant-gate";
```

## Real model check

`npm run eval:assistant-live -- --yes` runs 10 questions through the real
prompt, provider and guard. It needs the two env values. It does not use the
route or the gate. It prints answers, sources, guard stops and latency, and
estimates about 700 neurons. It was only run against a local stand-in server so
far.

## Still open before public use

- Choose and set up the deployment adapter (see above).
- Run the live check with real credentials and read the answers.
- Confirm the account is on Workers Free and the token is scoped.
- Rotate and remove the committed secrets.
- Then set `ASSISTANT_PRODUCTION_GATES_CONFIRMED=true`.
