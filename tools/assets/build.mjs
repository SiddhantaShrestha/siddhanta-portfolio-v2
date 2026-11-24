// Builds raw GLB files from the Blender scripts.
// Usage: node tools/assets/build.mjs [desk monitor ...] [--preview]
import path from "node:path";
import process from "node:process";
import { runBlender } from "./run-blender.mjs";

const ALL = ["desk", "monitor", "peripherals", "rack", "panel"];
const args = process.argv.slice(2);
const preview = args.includes("--preview");
const names = args.filter((a) => !a.startsWith("--"));
const targets = names.length > 0 ? names : ALL;

for (const name of targets) {
  if (!ALL.includes(name)) throw new Error(`Unknown model: ${name}`);
  const extra = ["--out", path.resolve(`assets-src/raw/${name}.glb`)];
  if (preview) {
    extra.push("--preview", path.resolve(`assets-src/previews/${name}`));
  }
  console.log(`\n=== Building ${name} ===`);
  runBlender(path.resolve(`tools/blender/build_${name}.py`), extra);
}
