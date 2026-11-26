import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { AssistantLauncher } from "@/components/assistant/assistant-launcher";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SkipLink } from "@/components/layout/skip-link";
import { PersonJsonLd } from "@/components/seo/person-json-ld";
import { profile } from "@/content/site";
import { getRobotsMetadata, getSiteUrl } from "@/lib/env";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${profile.name} — ${profile.jobTitle}`,
    template: `%s — ${profile.name}`,
  },
  description: profile.description,
  authors: [{ name: profile.name, url: profile.social.github }],
  alternates: {
    canonical: "/",
  },
  robots: getRobotsMetadata(),
  openGraph: {
    title: `${profile.name} — ${profile.jobTitle}`,
    description: profile.description,
    url: siteUrl,
    siteName: profile.name,
    locale: "en_US",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#05070d",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable} ${instrument.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        <PersonJsonLd siteUrl={siteUrl} />
        <SkipLink />
        <SiteHeader />
        {children}
        <SiteFooter />
        <AssistantLauncher />
      </body>
    </html>
  );
}
