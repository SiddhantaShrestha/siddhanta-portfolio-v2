/**
 * Reference Worker entry showing how AssistantGate is exported alongside the
 * OpenNext fetch handler.
 *
 * Do not point wrangler "main" at this file. Importing `.open-next/worker.js`
 * from a separate entry makes Wrangler re-bundle OpenNext and page requests
 * hang. Phase 7 keeps `"main": ".open-next/worker.js"` and
 * `tools/preview/patch-worker.mjs` appends the AssistantGate export after
 * each OpenNext build. See docs/phase-7-preview.md.
 */
export { default } from "../.open-next/worker.js";
export {
  BucketCachePurge,
  DOQueueHandler,
  DOShardedTagCache,
} from "../.open-next/worker.js";
export { AssistantGate } from "./assistant-gate";
