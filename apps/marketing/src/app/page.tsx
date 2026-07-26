const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const features = [
  {
    title: "Link público",
    body: "Compartilhe um único link. Sem app, sem cadastro — o convidado confirma em segundos.",
  },
  {
    title: "Lista em tempo real",
    body: "Acompanhe confirmados, pendentes e recusas com busca por nome, do celular.",
  },
  {
    title: "Anti-penetra (em breve)",
    body: "Credencial única por QR na entrada — quem não está na lista, não entra.",
  },
];

export default function LandingPage() {
  return (
    <main>
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
          <p className="font-display text-lg italic text-white/80">rsvp.</p>
          <h1 className="mt-4 font-display text-4xl leading-tight text-white sm:text-5xl">
            Sua lista de convidados,
            <br />
            sem penetra.
          </h1>
          <p className="mx-auto mt-5 max-w-md text-white/70">
            Crie o evento, mande um link e veja quem confirmou em tempo real — direto do
            celular.
          </p>
          <a
            href={`${APP_URL}/login`}
            className="mt-8 inline-flex items-center justify-center rounded-full bg-guava px-7 py-3 text-sm font-semibold text-white transition hover:bg-guava-dark"
          >
            Criar meu evento
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 sm:py-20">
        <div className="grid gap-5 sm:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-line bg-card p-6 shadow-sm"
            >
              <p className="font-display text-lg text-ink">{feature.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="px-4 pb-12 text-center text-xs text-ink-faint">rsvp.</footer>
    </main>
  );
}
