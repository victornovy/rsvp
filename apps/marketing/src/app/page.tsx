import { CtaButton } from "@/components/CtaButton";
import { JsonLd } from "@/components/JsonLd";
import { APP_URL } from "@/lib/site";

const STEPS = [
  {
    number: "01",
    title: "Crie o evento",
    body: "Título, data, local e o máximo de pessoas. Ative o modo anti-penetra se quiser controle na porta — é grátis.",
  },
  {
    number: "02",
    title: "Convidados confirmam",
    body: "Um link só, sem cadastro. Cada pessoa confirmada recebe na hora um QR individual de entrada.",
  },
  {
    number: "03",
    title: "Valide na porta",
    body: "Gere um link de validação pra portaria, aponte a câmera do celular pro QR, e pronto: liberado ou barrado na hora.",
  },
];

const USE_CASES = [
  { title: "Casamento", body: "Lista de convidados sem planilha, com confirmação e acompanhantes." },
  { title: "Aniversário", body: "Lotação sob controle e ninguém entra sem estar na lista." },
  { title: "Formatura", body: "Um QR por formando e família — sem crachá improvisado na entrada." },
  { title: "Evento corporativo", body: "Link de validação para a equipe da portaria, sem app pra instalar." },
];

const FAQ = [
  {
    question: "O anti-penetra é pago?",
    answer:
      "Não. QR de entrada e validação na porta vêm inclusos em qualquer evento, mesmo no plano grátis — é o diferencial do produto, não um upsell.",
  },
  {
    question: "Quantos convidados posso confirmar de graça?",
    answer:
      "Até 25 pessoas por evento, sem custo. Pra mais gente, é só liberar o add-on de escala — o evento não para de aceitar confirmações, só fica bloqueado até você ampliar.",
  },
  {
    question: "Preciso instalar algum aplicativo?",
    answer:
      "Não. O convidado confirma presença pelo navegador, e quem valida na entrada usa a câmera do próprio celular direto pelo link — sem app pra baixar de nenhum dos lados.",
  },
  {
    question: "O que acontece se eu não ativar o anti-penetra?",
    answer:
      "O evento funciona como uma lista de confirmação simples: link público, confirmações e lista de convidados — só sem QR e sem tela de validação na porta.",
  },
  {
    question: "Como funciona o pagamento dos add-ons?",
    answer:
      "Cada add-on (mais convidados, remover anúncios, domínio próprio, convite por WhatsApp) é uma compra única por evento, processada pelo Mercado Pago — sem assinatura mensal.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
};

export default function LandingPage() {
  return (
    <main>
      <JsonLd data={faqJsonLd} />

      <section className="relative overflow-hidden bg-plum px-4 py-24 sm:py-32">
        <div
          className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-plum-soft opacity-60 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-guava opacity-20 blur-3xl"
          aria-hidden
        />

        <div className="relative mx-auto max-w-2xl text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-guava">
            Confirmação de presença + controle de acesso
          </p>
          <h1 className="mt-4 font-display text-4xl leading-tight text-white sm:text-5xl">
            Confirme presença e barre penetra na porta.
          </h1>
          <p className="mx-auto mt-5 max-w-md text-white/70">
            Crie o evento, mande um link e veja quem confirmou em tempo real. Cada convidado
            confirmado recebe um QR — e só quem tem QR válido entra.
          </p>
          <CtaButton
            href={`${APP_URL}/login`}
            className="mt-8 inline-flex items-center justify-center rounded-full bg-guava px-7 py-3 text-sm font-semibold text-white transition hover:bg-guava-dark"
          >
            Criar evento grátis
          </CtaButton>
          <p className="mt-3 text-xs text-white/50">
            Grátis até 25 convidados. Anti-penetra incluso, sempre.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 sm:py-24">
        <p className="text-center font-mono text-xs uppercase tracking-widest text-guava">
          Como funciona
        </p>
        <h2 className="mt-2 text-center font-display text-2xl text-ink sm:text-3xl">
          Três passos, do link ao portão
        </h2>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.number} className="rounded-card border border-line bg-card p-6">
              <p className="font-mono text-3xl font-semibold text-guava">{step.number}</p>
              <p className="mt-3 font-display text-lg text-ink">{step.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-card px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <p className="text-center font-mono text-xs uppercase tracking-widest text-guava">
            Feito para
          </p>
          <h2 className="mt-2 text-center font-display text-2xl text-ink sm:text-3xl">
            Qualquer evento com lista de convidados
          </h2>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {USE_CASES.map((useCase) => (
              <div key={useCase.title} className="rounded-2xl border border-line bg-paper p-5">
                <p className="font-display text-lg text-ink">{useCase.title}</p>
                <p className="mt-1.5 text-sm text-ink-muted">{useCase.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
        <p className="text-center font-mono text-xs uppercase tracking-widest text-guava">
          Perguntas frequentes
        </p>
        <h2 className="mt-2 text-center font-display text-2xl text-ink sm:text-3xl">
          Antes de criar seu evento
        </h2>

        <dl className="mt-10 space-y-6">
          {FAQ.map((item) => (
            <div key={item.question} className="border-b border-line pb-6">
              <dt className="font-display text-base text-ink">{item.question}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-ink-muted">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="bg-plum px-4 py-16 text-center sm:py-20">
        <h2 className="font-display text-2xl text-white sm:text-3xl">
          Sua lista, seu portão, sem penetra.
        </h2>
        <CtaButton
          href={`${APP_URL}/login`}
          className="mt-6 inline-flex items-center justify-center rounded-full bg-guava px-7 py-3 text-sm font-semibold text-white transition hover:bg-guava-dark"
        >
          Criar evento grátis
        </CtaButton>
      </section>
    </main>
  );
}
