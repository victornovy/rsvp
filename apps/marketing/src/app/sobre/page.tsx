import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Sobre",
  description:
    "Por que o rsvp. existe: confirmação de presença que já nasce pensando em quem fica na porta, não só em quem confirma.",
  path: "/sobre",
  ogEyebrow: "Sobre",
});

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <p className="font-mono text-xs uppercase tracking-widest text-guava">Sobre</p>
      <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">
        Confirmar presença é fácil. Garantir que só quem confirmou entre, não.
      </h1>

      <div className="mt-8 space-y-5 text-sm leading-relaxed text-ink-muted sm:text-base">
        <p>
          A maioria das ferramentas de RSVP para por aí: um formulário, uma planilha, e o
          resto fica por conta de quem organiza. Na hora da festa, a lista vira papel na mão
          de alguém na porta — fácil de furar, fácil de perder, difícil de conferir rápido.
        </p>
        <p>
          O rsvp. nasceu para resolver a parte que geralmente fica de fora: cada confirmação
          vira um QR individual, e quem está na porta valida com o celular em segundos. Sem
          planilha, sem papel, sem depender de reconhecer rosto.
        </p>
        <p>
          Por isso o controle de acesso não é um recurso premium escondido atrás de um plano
          caro — é o motivo do produto existir, e por isso está incluso em qualquer evento,
          mesmo no plano grátis. O que é pago são extras de conveniência: mais convidados,
          remover anúncios, domínio próprio, convite por WhatsApp. O essencial — confirmar e
          controlar quem entra — não tem cadeado.
        </p>
      </div>
    </main>
  );
}
