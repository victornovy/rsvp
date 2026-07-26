export const SITE_URL = process.env.NEXT_PUBLIC_MARKETING_URL ?? "http://localhost:3001";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const SITE_NAME = "rsvp.";
export const SITE_TAGLINE = "Sua lista de convidados, sem penetra.";
export const SITE_DESCRIPTION =
  "Crie um evento, compartilhe um link e acompanhe as confirmações em tempo real. Modo anti-penetra com QR na porta incluso em qualquer plano.";

/** Builds the URL for the shared dynamic OG image generator. */
export function ogImageUrl(title: string, eyebrow?: string) {
  const params = new URLSearchParams({ title });
  if (eyebrow) params.set("eyebrow", eyebrow);
  return `${SITE_URL}/api/og?${params.toString()}`;
}
