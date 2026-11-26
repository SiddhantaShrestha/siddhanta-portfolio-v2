import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Dummy caches are enough for the preview Worker. Production can add R2 later
// without changing the app. See docs/phase-7-preview.md.
export default defineCloudflareConfig();
