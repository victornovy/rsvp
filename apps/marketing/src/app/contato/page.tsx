import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Contato",
  description: "Fale com o rsvp. — dúvidas, parcerias ou suporte.",
  path: "/contato",
  ogEyebrow: "Contato",
});

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <p className="font-mono text-xs uppercase tracking-widest text-guava">Contato</p>
      <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">Fale com a gente</h1>
      <p className="mt-4 text-sm leading-relaxed text-ink-muted sm:text-base">
        Dúvida sobre um evento, sugestão de recurso, ou algo não funcionou como esperado —
        manda um e-mail que a gente responde.
      </p>

      <a
        href="mailto:contato@rsvp.app"
        className="mt-6 inline-flex items-center justify-center rounded-full bg-guava px-6 py-3 text-sm font-semibold text-white transition hover:bg-guava-dark"
      >
        contato@rsvp.app
      </a>
    </main>
  );
}
