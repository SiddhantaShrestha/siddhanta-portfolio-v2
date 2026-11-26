# Phase 7: Cloudflare Workers preview

Preview deployment of the full portfolio (including the AI assistant) on a
regular `workers.dev` Worker. Production DNS for `siddhantashrestha.com.np` is
not changed here.

## Adapter choice

**OpenNext** (`@opennextjs/cloudflare`), not vinext.

- With `cacheComponents: true`, OpenNext pages hang/500 on workerd.
- This app has no `"use cache"` usage, so `cacheComponents` and
  `partialPrefetching` are off in `next.config.ts` for Workers compatibility.
- vinext would ignore the Turbopack Tailwind loader rule and need a Vite CSS
  plugin. That is a larger change for no gain here.

## Preview Worker

| Item               | Value                                       |
| ------------------ | ------------------------------------------- |
| Worker name        | `siddhanta-portfolio-preview`               |
| Hostname           | `*.workers.dev` only                        |
| Versioned previews | Off (`preview_urls: false`)                 |
| Entry              | `.open-next/worker.js` (patched)            |
| DO                 | `ASSISTANT_GATE` / `AssistantGate` (SQLite) |
| Edge rate limit    | `ASSISTANT_EDGE_LIMIT`                      |
| AI confirmation    | **not set** in config                       |
| Robots             | `noindex` at preview build time             |

`npm run preview:build` runs OpenNext, then
`tools/preview/patch-worker.mjs` copies the gate sources next to the generated
worker and exports `AssistantGate` from it. A separate custom Worker entry that
imports `.open-next/worker.js` makes Wrangler re-bundle OpenNext and page
requests hang, so that pattern is not used.

Do not enable Cloudflare versioned Preview URLs for this Worker while it
exports `AssistantGate`. Deploy the named Worker with a normal
`workers.dev` hostname instead.

## Commands

```bash
# Local workerd (no Cloudflare deploy)
npm run preview:local

# Build only
npm run preview:build

# Deploy ONLY after explicit approval
# Set the real preview origin first, for example:
#   $env:NEXT_PUBLIC_SITE_URL="https://siddhanta-portfolio-preview.<account>.workers.dev"
npm run preview:deploy
```

Secrets (never commit, never print):

```bash
npx wrangler secret put CLOUDFLARE_ACCOUNT_ID --name siddhanta-portfolio-preview
npx wrangler secret put CLOUDFLARE_AI_API_TOKEN --name siddhanta-portfolio-preview
```

Keep `ASSISTANT_PRODUCTION_GATES_CONFIRMED` unset until the Durable Object,
rate limit binding, and secrets are verified on the deployed Worker. Starters
still work while the model path is closed.

## noindex (preview only)

`tools/preview/build.mjs` sets `NEXT_PUBLIC_SITE_ROBOTS=noindex` for preview
builds. `src/app/layout.tsx` and `src/app/robots.ts` read that flag.

A normal `npm run build` / production build leaves the flag unset, so the
eventual production site stays indexable.

## Security

- This portfolio repo: no committed real Cloudflare credentials.
- Unresolved earlier exposure: RecipeNest `backend/.env` in a **separate**
  repository (`docs/phase-4-content-audit.md`). Out of scope here.

## Local verification (done on this machine)

- `npm run preview:build` succeeds with OpenNext 1.20.19 / wrangler 4.168.0.
- `wrangler dev --local`: homepage, six case studies, GLB/textures, robots
  `Disallow: /`, and noindex meta all return 200.
- Starter questions stream deterministic answers with source chips.
- With confirmation unset, free-form AI returns `unavailable` (closed).
- With local probe secrets only, free-form reaches `mode:model` then
  `upstream` (fake token), which proves the Durable Object acquire path.

## Still open before public cutover

Production Worker work moved to Phase 8 (`docs/phase-8-production.md`).
Preview remains the workers.dev test Worker with noindex.
