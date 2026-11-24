import { profile } from "@/content/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="section-shell flex flex-col gap-3 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          {profile.name}, {profile.location}
        </p>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <a
            href={profile.social.github}
            className="text-foreground underline decoration-line underline-offset-4 hover:decoration-accent"
            target="_blank"
            rel="noreferrer noopener"
          >
            GitHub
          </a>
          <a
            href={profile.social.linkedin}
            className="text-foreground underline decoration-line underline-offset-4 hover:decoration-accent"
            target="_blank"
            rel="noreferrer noopener"
          >
            LinkedIn
          </a>
          <a
            href={profile.social.currentPortfolio}
            className="text-foreground underline decoration-line underline-offset-4 hover:decoration-accent"
            target="_blank"
            rel="noreferrer noopener"
          >
            Current portfolio
          </a>
        </div>
      </div>
    </footer>
  );
}
