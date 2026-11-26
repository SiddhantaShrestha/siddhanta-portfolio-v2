import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  // OpenNext on Workers does not fully support Cache Components yet. Pages
  // hang/500 with these on. This app does not use "use cache" directives, so
  // turning them off is an adapter fix, not a feature loss.
  cacheComponents: false,
  partialPrefetching: false,
  // Three.js addons ship modern syntax that Next should compile with the scene.
  transpilePackages: ["three"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

// Bindings in `next dev` only. Skip during `next build` / OpenNext build so
// Wrangler is not asked to validate the Worker entry before it exists.
if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}
