/**
 * OpenNext's generated worker must stay the Wrangler entry. Importing it from
 * a separate TypeScript file makes Wrangler re-bundle it and page requests hang.
 *
 * After the OpenNext build, append the AssistantGate export onto the generated
 * worker so the Durable Object binding can resolve the class.
 */
import { access, copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const openNextDir = path.join(root, ".open-next");
const workerPath = path.join(openNextDir, "worker.js");
const gateDir = path.join(openNextDir, "assistant-gate");
const marker = "AssistantGate";

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

if (!(await exists(workerPath))) {
  console.error("Missing .open-next/worker.js. Run the OpenNext build first.");
  process.exit(1);
}

await mkdir(gateDir, { recursive: true });
await copyFile(
  path.join(root, "cloudflare", "gate-core.ts"),
  path.join(gateDir, "gate-core.ts"),
);
await copyFile(
  path.join(root, "cloudflare", "assistant-gate.ts"),
  path.join(gateDir, "assistant-gate.ts"),
);

let source = await readFile(workerPath, "utf8");
if (source.includes(marker)) {
  console.log("AssistantGate export already present in .open-next/worker.js");
  process.exit(0);
}

source += `

// Phase 7: SQLite usage gate for the assistant. Copied next to the generated
// worker so Wrangler resolves it without re-bundling OpenNext's entry.
export { AssistantGate } from "./assistant-gate/assistant-gate.ts";
`;

await writeFile(workerPath, source);
console.log("Patched .open-next/worker.js to export AssistantGate");
