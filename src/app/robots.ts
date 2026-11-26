import type { MetadataRoute } from "next";
import { getRobotsMetadata, getSiteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const allowIndexing = getRobotsMetadata().index;
  return {
    rules: {
      userAgent: "*",
      allow: allowIndexing ? "/" : undefined,
      disallow: allowIndexing ? undefined : "/",
    },
    sitemap: allowIndexing ? `${getSiteUrl()}/sitemap.xml` : undefined,
  };
}
