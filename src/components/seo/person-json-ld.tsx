import { personJsonLd } from "@/lib/structured-data";

type PersonJsonLdProps = {
  siteUrl: string;
};

export function PersonJsonLd({ siteUrl }: PersonJsonLdProps) {
  const json = JSON.stringify(personJsonLd(siteUrl)).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
