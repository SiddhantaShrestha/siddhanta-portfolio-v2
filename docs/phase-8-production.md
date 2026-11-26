# Phase 8: production Worker

Production Worker: `siddhanta-portfolio`  
Config: `wrangler.production.jsonc`  
Preview Worker: `siddhanta-portfolio-preview` (unchanged)

## Live domain

- Apex `https://siddhantashrestha.com.np` is served by the production Worker.
- Attachment method: **Workers route** `siddhantashrestha.com.np/*`
  (zone `siddhantashrestha.com.np`), not a Workers Custom Domain.
- `workers_dev` is `false` so the `*.workers.dev` URL stays off.
- www is not configured.
- Public AI is on when Worker secret `ASSISTANT_PRODUCTION_GATES_CONFIRMED=true`.

## Why a route (not Custom Domain)

Workers Custom Domain attach failed after Pages removed the hostname because
leftover proxied DNS records remained, and the Wrangler OAuth token cannot
edit DNS. The zone route reuses those DNS records and sends apex traffic to
`siddhanta-portfolio`.

## Production config rules

`wrangler.production.jsonc` is the source of truth for triggers:

- Keep the single `routes` entry for `siddhantashrestha.com.np/*`.
- Keep `workers_dev: false`.
- Keep the `AI` binding, `ASSISTANT_GATE` Durable Object, migration tag `v1`,
  and rate-limit namespace `2001`.
- Do not add a second route for the same pattern. Future
  `wrangler deploy --config wrangler.production.jsonc` upserts this route
  list; it will not remove the apex route while that entry remains, and it
  will not create a duplicate of the same pattern.

## CI/CD (GitHub Actions)

Workflow: `.github/workflows/deploy-production.yml`

- Runs on every push to `master`, and on manual `workflow_dispatch`
- Builds with `NEXT_PUBLIC_SITE_URL=https://siddhantashrestha.com.np` and
  `PRODUCTION_ALLOW_INDEXING=true`
- Deploys Worker `siddhanta-portfolio` with `wrangler.production.jsonc`

Required GitHub Actions secrets:

- `CLOUDFLARE_ACCOUNT_ID` — `c78699d8a1d9165992bc89f6f106b34e`
- `CLOUDFLARE_API_TOKEN` — Cloudflare API token from
  [API tokens](https://dash.cloudflare.com/profile/api-tokens) using the
  **Edit Cloudflare Workers** template (Workers Scripts Edit + Workers Routes)

Worker secret `ASSISTANT_PRODUCTION_GATES_CONFIRMED` stays on Cloudflare only.
Do not put it in GitHub.

## Manual production deploy

```powershell
$env:NEXT_PUBLIC_SITE_URL="https://siddhantashrestha.com.np"
$env:PRODUCTION_ALLOW_INDEXING="true"
npm run production:deploy
```

Without `PRODUCTION_ALLOW_INDEXING=true`, the build defaults to noindex.

## Pages rollback

Pages project `siddhantaportfolio` is kept on purpose:

- Domain left: `siddhantaportfolio.pages.dev` only
- GitHub connection preserved
- Production auto-deploys paused

Rollback:

1. Remove the Worker route for `siddhantashrestha.com.np/*`
   (or remove `routes` from `wrangler.production.jsonc` and redeploy).
2. Re-add `siddhantashrestha.com.np` to Pages `siddhantaportfolio`.
3. Confirm apex serves the old Pages site.
4. Optionally re-enable Pages production deployments.
