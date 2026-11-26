# Phase 8: production Worker

Production Worker name: `siddhanta-portfolio`  
Config: `wrangler.production.jsonc`  
Preview Worker (`siddhanta-portfolio-preview`) stays separate.

## Gate 1 (config only)

- Separate DO migration and rate-limit namespace (`2001`)
- Native `AI` binding; REST API secrets are not required when the binding is present
- Default production build is **noindex** for workers.dev testing
- Apex cutover uses an indexable rebuild (see below)
- Public AI stays off until `ASSISTANT_PRODUCTION_GATES_CONFIRMED=true` is set on purpose

## Deploy to workers.dev (Gate 2)

```powershell
$env:NEXT_PUBLIC_SITE_URL="https://siddhantashrestha.com.np"
npm run production:deploy
```

Expected URL:
`https://siddhanta-portfolio.siddhanta-shrestha2004.workers.dev`

No REST AI secrets are required for the native binding path. Do not set
`ASSISTANT_PRODUCTION_GATES_CONFIRMED` yet.

## Indexable cutover rebuild (with domain cutover approval)

```powershell
$env:NEXT_PUBLIC_SITE_URL="https://siddhantashrestha.com.np"
$env:PRODUCTION_ALLOW_INDEXING="true"
# Also remove NEXT_PUBLIC_SITE_ROBOTS from wrangler.production.jsonc vars, then:
npm run production:deploy
```

## Domain cutover and rollback

See the Phase 8 plan: remove the custom domain from Pages project
`siddhantaportfolio`, attach it to Worker `siddhanta-portfolio`, keep Pages
for rollback. Do not delete Pages in this phase.
