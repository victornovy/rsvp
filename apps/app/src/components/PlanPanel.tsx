"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { StatusBadge, type BadgeTone } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { SCALE_TIERS, FLAT_ADDON_PRICES, formatBRL, type AddonId } from "@/lib/pricing";
import type { EventAddon, Payment } from "@rsvp/db";

interface Billing {
  baseMaxPeople: number;
  effectiveMaxPeople: number;
  isPaid: boolean;
  adsRemoved: boolean;
  customDomain: boolean;
  addons: EventAddon[];
  payments: Payment[];
}

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
  refunded: "Reembolsado",
};

function paymentStatusTone(status: string): BadgeTone {
  if (status === "approved") return "mint";
  if (status === "pending") return "amber";
  return "clay";
}

const ADDON_TITLE: Record<AddonId, string> = {
  scale: "Mais convidados",
  remove_ads: FLAT_ADDON_PRICES.remove_ads.label,
  custom_domain: FLAT_ADDON_PRICES.custom_domain.label,
};

export function PlanPanel({ eventId }: { eventId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const toast = useToast();

  const [billing, setBilling] = useState<Billing | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [showTiers, setShowTiers] = useState(false);

  async function loadBilling() {
    setLoading(true);
    const res = await fetch(`/api/events/${eventId}/billing`).catch(() => null);
    if (res?.ok) {
      setBilling(await res.json());
    }
    setLoading(false);
  }

  useEffect(() => {
    loadBilling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  useEffect(() => {
    const status = searchParams.get("status") ?? searchParams.get("collection_status");
    if (!status) return;

    if (status === "approved") {
      toast.success("Pagamento aprovado! Liberando o add-on — pode levar alguns segundos.");
      setTimeout(loadBilling, 2500);
    } else if (status === "pending" || status === "in_process") {
      toast.info("Pagamento em análise. Assim que for aprovado, o add-on é liberado.");
    } else {
      toast.error("Pagamento não foi concluído.");
    }

    router.replace(pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function checkout(addon: AddonId, peopleLimit?: number) {
    setCheckingOut(addon + (peopleLimit ?? ""));
    try {
      const res = await fetch(`/api/checkout/${eventId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addon, people_limit: peopleLimit }),
      }).catch(() => null);

      if (!res?.ok) {
        const json = await res?.json().catch(() => null);
        toast.error(json?.error?.message ?? "Não foi possível iniciar o pagamento.");
        return;
      }

      const json = await res.json();
      window.location.href = json.init_point;
    } finally {
      setCheckingOut(null);
    }
  }

  if (loading || !billing) {
    return (
      <div className="rounded-card border border-line bg-card p-5 text-sm text-ink-muted">
        Carregando plano…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-card border border-line bg-card p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Plano do evento
          </p>
          <StatusBadge
            label={billing.isPaid ? "Pago" : "Grátis"}
            tone={billing.isPaid ? "mint" : "neutral"}
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-paper p-3.5 text-center">
            <p className="font-mono text-lg font-semibold text-ink">{billing.effectiveMaxPeople}</p>
            <p className="text-[11px] text-ink-muted">Máximo de pessoas</p>
          </div>
          <div className="rounded-2xl bg-paper p-3.5 text-center">
            <p className="font-mono text-lg font-semibold text-ink">
              {billing.adsRemoved ? "Não" : "Sim"}
            </p>
            <p className="text-[11px] text-ink-muted">Mostra anúncios</p>
          </div>
          <div className="rounded-2xl bg-paper p-3.5 text-center">
            <p className="font-mono text-lg font-semibold text-ink">
              {billing.customDomain ? "Próprio" : "Padrão"}
            </p>
            <p className="text-[11px] text-ink-muted">Domínio</p>
          </div>
        </div>

        <p className="mt-3 text-xs text-ink-faint">
          O modo anti-penetra (QR + validação na porta) é grátis em qualquer plano.
        </p>

        <div className="mt-5 space-y-3">
          <div>
            <button
              type="button"
              onClick={() => setShowTiers((v) => !v)}
              className="text-sm font-semibold text-guava"
            >
              {showTiers ? "Esconder opções" : "Liberar mais convidados →"}
            </button>
            {showTiers && (
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {SCALE_TIERS.map((tier) => (
                  <button
                    key={tier.peopleLimit}
                    type="button"
                    onClick={() => checkout("scale", tier.peopleLimit)}
                    disabled={
                      checkingOut !== null || billing.effectiveMaxPeople >= tier.peopleLimit
                    }
                    className="rounded-2xl border border-line bg-card p-3 text-center transition hover:border-guava disabled:opacity-40"
                  >
                    <p className="font-mono text-sm font-semibold text-ink">
                      {tier.peopleLimit} pessoas
                    </p>
                    <p className="text-xs text-ink-muted">{formatBRL(tier.amountCents)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => checkout("remove_ads")}
              disabled={billing.adsRemoved || checkingOut !== null}
            >
              {billing.adsRemoved
                ? "Anúncios já removidos"
                : `Remover anúncios · ${formatBRL(FLAT_ADDON_PRICES.remove_ads.amountCents)}`}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => checkout("custom_domain")}
              disabled={billing.customDomain || checkingOut !== null}
            >
              {billing.customDomain
                ? "Domínio próprio ativo"
                : `Domínio próprio · ${formatBRL(FLAT_ADDON_PRICES.custom_domain.amountCents)}`}
            </Button>
          </div>
        </div>
      </div>

      {billing.payments.length > 0 && (
        <div className="rounded-card border border-line bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Histórico de pagamentos
          </p>
          <ul className="mt-3 divide-y divide-line">
            {billing.payments.map((payment) => (
              <li key={payment.id} className="flex items-center justify-between gap-3 py-2.5">
                <div>
                  <p className="text-sm text-ink">
                    {ADDON_TITLE[payment.addon as AddonId] ?? payment.addon}
                  </p>
                  <p className="text-xs text-ink-faint">
                    {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
                      new Date(payment.created_at),
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-ink-muted">
                    {formatBRL(payment.amount_cents)}
                  </span>
                  <StatusBadge
                    label={PAYMENT_STATUS_LABEL[payment.status] ?? payment.status}
                    tone={paymentStatusTone(payment.status)}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
