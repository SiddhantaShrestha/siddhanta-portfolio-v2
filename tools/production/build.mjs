/**
 * Builds the OpenNext Worker bundle for production Worker siddhanta-portfolio.
 *
 * Default (workers.dev testing): forces noindex so the temporary hostname is
 * not indexed. Canonical site URL is still the real apex.
 *
 * Cutover indexing build:
 *   PRODUCTION_ALLOW_INDEXING=true npm run production:build
 *
 * Does not deploy. Does not print secrets.
 */
import { spawnSync } from "node:child_process";
import process from "node:process";

const PRODUCTION_ORIGIN = "https://siddhantashrestha.com.np";
const allowIndexing = process.env.PRODUCTION_ALLOW_INDEXING === "true";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || PRODUCTION_ORIGIN;

const env = {
  ...process.env,
  NEXT_PUBLIC_SITE_URL: siteUrl,
};

if (allowIndexing) {
  delete env.NEXT_PUBLIC_SITE_ROBOTS;
} else {
  env.NEXT_PUBLIC_SITE_ROBOTS = "noindex";
}

function run(command, args) {
  const result = spawnSync(command, args, {
    env,
    stdio: "inherit",
    shell: false,
    windowsHide: true,
  });
  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log(
  `Building production Worker (${allowIndexing ? "indexable" : "noindex"}). NEXT_PUBLIC_SITE_URL=${siteUrl}`,
);

run(process.execPath, [
  "node_modules/@opennextjs/cloudflare/dist/cli/index.js",
  "build",
]);
run(process.execPath, ["tools/preview/patch-worker.mjs"]);
