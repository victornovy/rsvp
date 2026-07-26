import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
}

export interface BlogPost extends BlogPostMeta {
  html: string;
}

function readSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((file) => file.endsWith(".md"))
    .map((file) => file.replace(/\.md$/, ""));
}

function readFrontmatter(slug: string): { data: Record<string, unknown>; content: string } {
  const raw = fs.readFileSync(path.join(BLOG_DIR, `${slug}.md`), "utf8");
  const { data, content } = matter(raw);
  return { data, content };
}

export function getAllPosts(): BlogPostMeta[] {
  return readSlugs()
    .map((slug) => {
      const { data } = readFrontmatter(slug);
      return {
        slug,
        title: String(data.title ?? slug),
        description: String(data.description ?? ""),
        date: String(data.date ?? new Date().toISOString()),
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPostBySlug(slug: string): BlogPost | null {
  if (!readSlugs().includes(slug)) return null;

  const { data, content } = readFrontmatter(slug);

  return {
    slug,
    title: String(data.title ?? slug),
    description: String(data.description ?? ""),
    date: String(data.date ?? new Date().toISOString()),
    html: marked.parse(content, { async: false }) as string,
  };
}
