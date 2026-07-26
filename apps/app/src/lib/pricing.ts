export type AddonId = "scale" | "remove_ads" | "custom_domain";

export interface ScaleTier {
  peopleLimit: number;
  amountCents: number;
}

/**
 * Catalog of paid add-ons. Everything here is a one-off purchase per event —
 * there is no subscription/recurring billing in this phase. Prices in BRL
 * cents. The anti-penetra feature is deliberately absent from this list: it
 * is included free on every event, scale add-on or not.
 */
export const SCALE_TIERS: ScaleTier[] = [
  { peopleLimit: 50, amountCents: 2990 },
  { peopleLimit: 100, amountCents: 4990 },
  { peopleLimit: 200, amountCents: 8990 },
  { peopleLimit: 500, amountCents: 14990 },
];

export const FLAT_ADDON_PRICES: Record<Exclude<AddonId, "scale">, { label: string; amountCents: number }> = {
  remove_ads: { label: "Remover anúncios", amountCents: 1990 },
  custom_domain: { label: "Domínio próprio", amountCents: 3990 },
};

export function formatBRL(amountCents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    amountCents / 100,
  );
}

export interface ResolvedAddonPrice {
  title: string;
  amountCents: number;
  peopleLimit: number | null;
}

/** Validates the requested add-on/tier and resolves its price. Returns null if invalid. */
export function resolveAddonPrice(addon: AddonId, peopleLimit?: number | null): ResolvedAddonPrice | null {
  if (addon === "scale") {
    const tier = SCALE_TIERS.find((t) => t.peopleLimit === peopleLimit);
    if (!tier) return null;
    return {
      title: `Mais convidados — até ${tier.peopleLimit} pessoas`,
      amountCents: tier.amountCents,
      peopleLimit: tier.peopleLimit,
    };
  }

  const flat = FLAT_ADDON_PRICES[addon];
  if (!flat) return null;
  return { title: flat.label, amountCents: flat.amountCents, peopleLimit: null };
}
