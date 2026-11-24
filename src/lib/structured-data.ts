import { profile } from "@/content/site";

export function personJsonLd(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    jobTitle: profile.jobTitle,
    description: profile.description,
    url: siteUrl,
    email: profile.email,
    telephone: profile.phoneHref.replace("tel:", ""),
    address: {
      "@type": "PostalAddress",
      addressLocality: "Lalitpur",
      addressCountry: "NP",
    },
    sameAs: [
      profile.social.github,
      profile.social.linkedin,
      profile.social.currentPortfolio,
    ],
  };
}
