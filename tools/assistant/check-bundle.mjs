// Run after `next build`. Fails if anything that must stay on the server
// shows up in files the browser downloads (.next/static).
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");
const staticDir = path.join(root, ".next", "static");

// Names, hosts and strings that only server code should contain.
const FORBIDDEN = [
  "CLOUDFLARE_AI_API_TOKEN",
  "CLOUDFLARE_ACCOUNT_ID",
  "ASSISTANT_PRODUCTION_GATES_CONFIRMED",
  "ASSISTANT_MODEL",
  "api.cloudflare.com",
  "createWorkersAiProvider",
  "MAX_MALFORMED_EVENTS",
  "RULES\\n1. Use only the KNOWLEDGE",
  "Must not claim",
];

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (/\.(js|css|map|html|json)$/.test(entry)) yield full;
  }
}

let files = 0;
const hits = [];
for (const file of walk(staticDir)) {
  files += 1;
  const text = readFileSync(file, "utf8");
  for (const needle of FORBIDDEN) {
    if (text.includes(needle))
      hits.push(`${path.relative(root, file)}: ${needle}`);
  }
}

if (files === 0) {
  console.error("No build output found. Run `npm run build` first.");
  process.exit(2);
}
if (hits.length > 0) {
  console.error(
    `Server-only strings found in the client bundle:\n${hits.join("\n")}`,
  );
  process.exit(1);
}
console.log(
  `Client bundle clean: ${files} files checked, ${FORBIDDEN.length} strings absent.`,
);
