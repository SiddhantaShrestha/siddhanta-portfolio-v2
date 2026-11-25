import { ImageResponse } from "next/og";
import { getProjectBySlug, projects } from "@/content/projects";
import { profile } from "@/content/site";

export const alt = "Engineering case study by Siddhanta Shrestha";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

type ImageProps = {
  params: Promise<{ slug: string }>;
};

/**
 * Text-only share card. It uses public project fields and the site colors,
 * and does not depict any product screen.
 */
export default async function Image({ params }: ImageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  const title = project?.name ?? profile.name;
  const category = project?.category ?? profile.jobTitle;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        background: "#05070d",
        color: "#e8eef7",
        borderTop: "6px solid #3ee0f0",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 26,
          letterSpacing: 4,
          textTransform: "uppercase",
          color: "#9b8cff",
        }}
      >
        Case study
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            fontSize: 30,
            color: "#9aa8bd",
            marginBottom: 24,
          }}
        >
          {category}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 112,
            lineHeight: 1.02,
            letterSpacing: -2,
          }}
        >
          {title}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 28,
          color: "#9aa8bd",
        }}
      >
        <div style={{ display: "flex" }}>{profile.name}</div>
        <div style={{ display: "flex" }}>{profile.jobTitle}</div>
      </div>
    </div>,
    { ...size },
  );
}
