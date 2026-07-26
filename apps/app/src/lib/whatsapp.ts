export const DEFAULT_WHATSAPP_TEMPLATE =
  "Oi! Você foi convidado(a) para {evento}, dia {data}. Confirme sua presença aqui: {link}";

export interface WhatsAppTemplateVars {
  evento: string;
  data: string;
  link: string;
}

export function renderWhatsAppTemplate(template: string, vars: WhatsAppTemplateVars): string {
  return template
    .replaceAll("{evento}", vars.evento)
    .replaceAll("{data}", vars.data)
    .replaceAll("{link}", vars.link);
}

/**
 * Builds a wa.me link. With no usable phone number it falls back to the
 * numberless form (`https://wa.me/?text=...`), which still opens WhatsApp
 * with the message ready — the sender just picks a contact by hand.
 */
export function buildWhatsAppUrl(phone: string | null | undefined, message: string): string {
  const digits = (phone ?? "").replace(/\D/g, "");
  const base = digits.length >= 8 ? `https://wa.me/${digits}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(message)}`;
}
