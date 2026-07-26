import Link from "next/link";

const LINKS = [
  { href: "/precos", label: "Preços" },
  { href: "/blog", label: "Blog" },
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
];

export function Footer() {
  return (
    <footer className="border-t border-line px-4 py-10 sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
        <p className="font-display italic text-plum">rsvp.</p>
        <nav className="flex flex-wrap justify-center gap-4 text-sm text-ink-muted">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-ink">
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="text-xs text-ink-faint">
          © {new Date().getFullYear()} rsvp. — feito no Brasil.
        </p>
      </div>
    </footer>
  );
}
