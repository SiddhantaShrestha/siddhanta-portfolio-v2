// Shared helper: find Blender and run one of the model scripts headless.
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import process from "node:process";

export function findBlender() {
  if (process.env.BLENDER_PATH && existsSync(process.env.BLENDER_PATH)) {
    return process.env.BLENDER_PATH;
  }
  const root = "C:/Program Files/Blender Foundation";
  if (existsSync(root)) {
    const versions = readdirSync(root).sort().reverse();
    for (const version of versions) {
      const candidate = path.join(root, version, "blender.exe");
      if (existsSync(candidate)) return candidate;
    }
  }
  throw new Error(
    "Blender not found. Install it or set BLENDER_PATH to blender.exe.",
  );
}

export function runBlender(script, extraArgs = []) {
  const blender = findBlender();
  const result = spawnSync(
    blender,
    ["-b", "--factory-startup", "-P", script, "--", ...extraArgs],
    { stdio: "inherit" },
  );
  if (result.status !== 0) {
    throw new Error(`Blender failed for ${script} (exit ${result.status})`);
  }
}
