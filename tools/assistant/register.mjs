// Lets `node --test` import the app's TypeScript without a bundler or any
// extra dependency. Node strips the types. This hook only fixes how names are
// resolved: the "@/" alias, extensionless imports, and the "server-only" guard
// package (Next provides it at build time, plain Node does not).
import { existsSync, statSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const EXTENSIONS = [".ts", ".tsx", "/index.ts", "/index.tsx"];

function isFile(file) {
  return existsSync(file) && statSync(file).isFile();
}

function withExtension(base) {
  if (isFile(base)) return base;
  for (const ext of EXTENSIONS) {
    if (isFile(base + ext)) return base + ext;
  }
  return null;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") {
      return { url: "data:text/javascript,export {}", shortCircuit: true };
    }

    let base = null;
    if (specifier.startsWith("@/")) {
      base = path.join(root, "src", specifier.slice(2));
    } else if (
      (specifier.startsWith("./") || specifier.startsWith("../")) &&
      context.parentURL?.startsWith("file:")
    ) {
      base = path.resolve(
        path.dirname(fileURLToPath(context.parentURL)),
        specifier,
      );
    }

    if (base) {
      const file = withExtension(base);
      if (file) {
        return { url: pathToFileURL(file).href, shortCircuit: true };
      }
    }
    return nextResolve(specifier, context);
  },
});
