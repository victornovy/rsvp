import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllPosts, getPostBySlug } from "@/lib/blog";
import { buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL } from "@/lib/site";

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = getPostBySlug(params.slug);
  if (!post) return {};

  return buildMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${post.slug}`,
    ogEyebrow: "Blog",
    type: "article",
    publishedTime: post.date,
  });
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(iso));
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    url: `${SITE_URL}/blog/${post.slug}`,
    author: { "@type": "Organization", name: "rsvp." },
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <JsonLd data={articleJsonLd} />

      <Link href="/blog" className="text-sm font-medium text-ink-muted hover:text-ink">
        ← Blog
      </Link>

      <article className="mt-6">
        <p className="text-xs text-ink-faint">{formatDate(post.date)}</p>
        <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">{post.title}</h1>
        <div className="prose mt-8" dangerouslySetInnerHTML={{ __html: post.html }} />
      </article>
    </main>
  );
}
