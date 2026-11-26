const LOCAL_SITE_URL = "http://localhost:3000";

/**
 * Public site origin. Missing or invalid values fall back to localhost
 * so local builds do not depend on a deployed URL.
 */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;

  if (!configured) {
    return LOCAL_SITE_URL;
  }

  try {
    return new URL(configured).origin;
  } catch {
    return LOCAL_SITE_URL;
  }
}

/**
 * Indexing policy for metadata. Preview builds set
 * NEXT_PUBLIC_SITE_ROBOTS=noindex at build time. Production leaves it unset,
 * so the live site stays indexable.
 */
export function getRobotsMetadata(): {
  index: boolean;
  follow: boolean;
} {
  if (process.env.NEXT_PUBLIC_SITE_ROBOTS === "noindex") {
    return { index: false, follow: false };
  }
  return { index: true, follow: true };
}
