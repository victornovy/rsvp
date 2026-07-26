import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = buildMetadata({
  title: "Blog",
  description: "Textos sobre confirmação de presença, controle de acesso e organização de eventos.",
  path: "/blog",
  ogEyebrow: "Blog",
});

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(iso));
}

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <main className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <p className="font-mono text-xs uppercase tracking-widest text-guava">Blog</p>
      <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">
        Confirmação de presença e controle de acesso
      </h1>

      <ul className="mt-10 divide-y divide-line">
        {posts.map((post) => (
          <li key={post.slug} className="py-6 first:pt-0">
            <Link href={`/blog/${post.slug}`} className="group block">
              <p className="text-xs text-ink-faint">{formatDate(post.date)}</p>
              <h2 className="mt-1 font-display text-xl text-ink transition group-hover:text-guava">
                {post.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{post.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
