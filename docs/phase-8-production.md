# Phase 8: production Worker

Production Worker: `siddhanta-portfolio`  
Config: `wrangler.production.jsonc`  
Preview Worker: `siddhanta-portfolio-preview` (unchanged)

## Domain facts (Gate 3)

- Pages project `siddhantaportfolio` custom domains: apex
  `siddhantashrestha.com.np` and `siddhantaportfolio.pages.dev` only.
- **www is not configured** (DNS NXDOMAIN).
- Zone nameservers are on Cloudflare. Apex resolves through Cloudflare proxy.
- No Page Rules found. Pages Git auto-deploy is still **enabled**.

## Indexable production build

```powershell
$env:NEXT_PUBLIC_SITE_URL="https://siddhantashrestha.com.np"
$env:PRODUCTION_ALLOW_INDEXING="true"
npm run production:deploy
```

Public AI stays off (`ASSISTANT_PRODUCTION_GATES_CONFIRMED` unset).

## Exact cutover steps (needs separate approval)

1. In Cloudflare Dashboard → Pages → `siddhantaportfolio` → disable
   production deployments (or disconnect Git temporarily) so Pages cannot
   republish during the switch.
2. Pages → Custom domains → remove `siddhantashrestha.com.np`.
3. Immediately Workers → `siddhanta-portfolio` → Domains & Routes → Add
   Custom Domain → `siddhantashrestha.com.np`
   (or add a `routes` custom_domain entry and redeploy).
4. Wait until the hostname shows Active / SSL ready.
5. Check apex homepage, one case study, robots allow, sitemap, assistant
   starter. Freeform AI should still be unavailable.
6. Keep the Pages project. Do not delete it.

## Rollback

1. Remove the custom domain from Worker `siddhanta-portfolio`.
2. Re-add `siddhantashrestha.com.np` to Pages `siddhantaportfolio`.
3. Confirm apex serves the old site.

## Risks that need approval

- Brief downtime or certificate churn while the domain moves.
- Pages auto-deploy must be paused or it can fight the cutover.
- Indexable workers.dev URL exists until the apex cutover completes.
- Do not attach www (it does not exist today).
