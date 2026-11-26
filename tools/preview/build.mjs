/**
 * Builds the OpenNext Worker bundle for the Cloudflare preview.
 *
 * Sets preview-only public metadata at build time:
 * - NEXT_PUBLIC_SITE_ROBOTS=noindex (never set this for a production build)
 * - NEXT_PUBLIC_SITE_URL from the environment, or a local placeholder
 *
 * Then patches the generated worker so AssistantGate is exported without a
 * separate custom entry (a separate entry re-bundles OpenNext and hangs).
 *
 * Does not deploy. Does not print secret values.
 */
import { spawnSync } from "node:child_process";
import process from "node:process";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:8787";

const env = {
  ...process.env,
  NEXT_PUBLIC_SITE_URL: siteUrl,
  NEXT_PUBLIC_SITE_ROBOTS: "noindex",
};

function run(command, args) {
  const result = spawnSync(command, args, {
    env,
    stdio: "inherit",
    // Avoid shell:true on Windows so paths with spaces (e.g. Program Files) work.
    shell: false,
    windowsHide: true,
  });
  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log(
  `Building preview Worker (noindex). NEXT_PUBLIC_SITE_URL=${siteUrl}`,
);

run(process.execPath, [
  "node_modules/@opennextjs/cloudflare/dist/cli/index.js",
  "build",
]);
run(process.execPath, ["tools/preview/patch-worker.mjs"]);
