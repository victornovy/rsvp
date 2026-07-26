import type { Metadata } from "next";
import { SITE_NAME, SITE_URL, ogImageUrl } from "./site";

interface PageSeoInput {
  title: string;
  description: string;
  path: string;
  ogEyebrow?: string;
  type?: "website" | "article";
  publishedTime?: string;
}

/** Builds page-level Metadata (canonical, OpenGraph, Twitter) from a small, consistent input shape. */
export function buildMetadata({
  title,
  description,
  path,
  ogEyebrow,
  type = "website",
  publishedTime,
}: PageSeoInput): Metadata {
  const url = `${SITE_URL}${path}`;
  const image = ogImageUrl(title, ogEyebrow);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: "pt_BR",
      type,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      ...(type === "article" && publishedTime ? { publishedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
