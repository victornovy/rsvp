import type { Metadata } from "next";
import { CtaButton } from "@/components/CtaButton";
import { buildMetadata } from "@/lib/seo";
import { APP_URL } from "@/lib/site";
import { SCALE_TIERS, FLAT_ADDON_PRICES, formatBRL } from "@rsvp/pricing";

export const metadata: Metadata = buildMetadata({
  title: "Preços",
  description:
    "Grátis até 25 convidados, com anti-penetra incluso. Add-ons por evento — sem assinatura — para mais gente, sem anúncios, domínio próprio ou convite por WhatsApp.",
  path: "/precos",
  ogEyebrow: "Preços",
});

const ADDONS = [
  {
    key: "remove_ads",
    title: FLAT_ADDON_PRICES.remove_ads.label,
    price: formatBRL(FLAT_ADDON_PRICES.remove_ads.amountCents),
    body: "Tira os anúncios da página pública do evento.",
  },
  {
    key: "custom_domain",
    title: FLAT_ADDON_PRICES.custom_domain.label,
    price: formatBRL(FLAT_ADDON_PRICES.custom_domain.amountCents),
    body: "Compre o registro do add-on — a configuração de DNS é feita com o suporte depois da compra.",
  },
  {
    key: "whatsapp",
    title: FLAT_ADDON_PRICES.whatsapp.label,
    price: formatBRL(FLAT_ADDON_PRICES.whatsapp.amountCents),
    body: "Botão pronto pra reenviar o link (ou o QR individual) de cada convidado pelo WhatsApp.",
  },
];

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16 sm:py-24">
      <div className="text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-guava">Preços</p>
        <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">
          Grátis pra começar. Pago só o que você precisar.
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-sm text-ink-muted">
          Sem assinatura mensal — cada add-on é uma compra única, por evento, e o anti-penetra
          nunca fica atrás de paywall.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        <div className="rounded-card border-2 border-guava bg-card p-6">
          <p className="font-mono text-xs uppercase tracking-widest text-guava">Free</p>
          <p className="mt-2 font-display text-3xl text-ink">R$ 0</p>
          <ul className="mt-5 space-y-2.5 text-sm text-ink-muted">
            <li>✓ Até 25 convidados por evento</li>
            <li>✓ Anti-penetra incluso (QR + validação na porta)</li>
            <li>✓ Painel com busca, filtros e exportação em CSV</li>
            <li>· Exibe anúncios na página pública do evento</li>
          </ul>
          <CtaButton
            href={`${APP_URL}/login`}
            className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-guava px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-guava-dark"
            eventName="cta_pricing_free"
          >
            Criar evento grátis
          </CtaButton>
        </div>

        <div className="rounded-card border border-line bg-card p-6">
          <p className="font-mono text-xs uppercase tracking-widest text-ink-muted">
            Mais convidados
          </p>
          <p className="mt-2 font-display text-lg text-ink">Escale por tier, por evento</p>
          <ul className="mt-5 space-y-2.5 text-sm text-ink-muted">
            {SCALE_TIERS.map((tier) => (
              <li key={tier.peopleLimit} className="flex items-center justify-between">
                <span>até {tier.peopleLimit} pessoas</span>
                <span className="font-mono text-ink">{formatBRL(tier.amountCents)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-ink-faint">
            Compre pelo painel do evento, quando precisar — não precisa escolher na hora de criar.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-3">
        {ADDONS.map((addon) => (
          <div key={addon.key} className="rounded-2xl border border-line bg-card p-5">
            <div className="flex items-baseline justify-between">
              <p className="font-display text-base text-ink">{addon.title}</p>
              <span className="font-mono text-sm text-guava">{addon.price}</span>
            </div>
            <p className="mt-2 text-sm text-ink-muted">{addon.body}</p>
          </div>
        ))}
      </div>

      <p className="mt-10 text-center text-xs text-ink-faint">
        Todos os add-ons são comprados de dentro do painel do evento, depois de criá-lo — o
        checkout é processado pelo Mercado Pago.
      </p>
    </main>
  );
}
