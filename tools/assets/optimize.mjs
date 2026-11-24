// Optimizes raw GLB files into public/models with Meshopt and WebP textures.
// Usage: node tools/assets/optimize.mjs [desk monitor ...]
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const ALL = ["desk", "monitor", "peripherals", "rack", "panel"];
const CLI = "@gltf-transform/cli@4.5.1";
const names = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const targets = names.length > 0 ? names : ALL;

mkdirSync("public/models", { recursive: true });

// Largest texture edge per model. AO on big flat shapes needs little detail.
const TEXTURE_SIZE = {
  desk: 512,
  monitor: 512,
  peripherals: 512,
  rack: 1024,
  panel: 1024,
};

const kb = (file) => `${(statSync(file).size / 1024).toFixed(1)} KB`;

for (const name of targets) {
  const input = `assets-src/raw/${name}.glb`;
  const output = `public/models/${name}.glb`;
  if (!existsSync(input))
    throw new Error(`Missing ${input}. Run assets:build.`);
  const result = spawnSync(
    "npx",
    [
      "--yes",
      CLI,
      "optimize",
      input,
      output,
      "--simplify",
      "false",
      "--palette",
      "false",
      "--compress",
      "meshopt",
      "--texture-compress",
      "webp",
      "--texture-size",
      String(TEXTURE_SIZE[name] ?? 1024),
    ],
    { stdio: "inherit", shell: true },
  );
  if (result.status !== 0) throw new Error(`optimize failed for ${name}`);
  console.log(
    `${path.basename(input)} ${kb(input)} -> ${output} ${kb(output)}`,
  );
}
