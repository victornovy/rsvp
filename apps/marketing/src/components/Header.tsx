import Link from "next/link";
import { CtaButton } from "./CtaButton";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const NAV = [
  { href: "/precos", label: "Preços" },
  { href: "/blog", label: "Blog" },
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
];

export function Header() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="font-display text-lg italic text-plum">
          rsvp.
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-ink-muted sm:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>

        <CtaButton
          href={`${APP_URL}/login`}
          className="rounded-full bg-guava px-4 py-2 text-sm font-semibold text-white transition hover:bg-guava-dark"
        >
          Criar evento grátis
        </CtaButton>
      </div>
    </header>
  );
}
