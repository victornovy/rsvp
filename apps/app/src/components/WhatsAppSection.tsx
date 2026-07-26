"use client";

import { useEffect, useState } from "react";
import type { GuestRow } from "@/lib/guest-rows";
import { DEFAULT_WHATSAPP_TEMPLATE, renderWhatsAppTemplate, buildWhatsAppUrl } from "@/lib/whatsapp";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface WhatsAppSectionProps {
  eventId: string;
  eventTitle: string;
  eventDateIso: string;
  publicToken: string;
  appUrl: string;
  antiPenetra: boolean;
  initialTemplate: string | null;
  active: boolean;
}

function formatEventDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short" }).format(
    new Date(iso),
  );
}

export function WhatsAppSection({
  eventId,
  eventTitle,
  eventDateIso,
  publicToken,
  appUrl,
  antiPenetra,
  initialTemplate,
  active,
}: WhatsAppSectionProps) {
  const toast = useToast();
  const [template, setTemplate] = useState(initialTemplate ?? DEFAULT_WHATSAPP_TEMPLATE);
  const [saving, setSaving] = useState(false);
  const [guests, setGuests] = useState<GuestRow[] | null>(null);

  useEffect(() => {
    if (!active) return;
    fetch(`/api/events/${eventId}/guests`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => setGuests(json?.guests ?? []))
      .catch(() => setGuests([]));
  }, [eventId, active]);

  async function saveTemplate() {
    setSaving(true);
    const res = await fetch(`/api/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ whatsapp_message_template: template }),
    }).catch(() => null);
    setSaving(false);

    if (res?.ok) {
      toast.success("Mensagem salva.");
    } else {
      toast.error("Não foi possível salvar a mensagem.");
    }
  }

  if (!active) {
    return (
      <div className="rounded-card border border-dashed border-line bg-card p-5 text-center">
        <p className="text-sm text-ink-muted">
          Ative o add-on <strong className="text-ink">Convite por WhatsApp</strong> na seção
          "Plano do evento" acima para reenviar o link (ou o QR individual) de cada convidado
          direto pelo WhatsApp.
        </p>
      </div>
    );
  }

  const guestsWithContact = (guests ?? []).filter((g) => g.contact);

  function linkFor(guest: GuestRow) {
    const individual = antiPenetra && guest.response === "yes";
    return individual
      ? `${appUrl}/e/${publicToken}/credencial/${guest.guest_token}`
      : `${appUrl}/e/${publicToken}`;
  }

  function messageFor(guest: GuestRow) {
    return renderWhatsAppTemplate(template, {
      evento: eventTitle,
      data: formatEventDate(eventDateIso),
      link: linkFor(guest),
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-card border border-line bg-card p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Mensagem do WhatsApp
        </p>
        <textarea
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          rows={3}
          className="mt-2 w-full rounded-2xl border border-line bg-card px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-guava"
        />
        <p className="mt-1.5 text-xs text-ink-faint">
          Placeholders disponíveis: <code>{"{evento}"}</code>, <code>{"{data}"}</code>,{" "}
          <code>{"{link}"}</code>. Se o evento tem anti-penetra, convidados já confirmados
          recebem o link da própria credencial (QR individual) em vez do link geral.
        </p>
        <Button size="sm" variant="secondary" onClick={saveTemplate} disabled={saving} className="mt-3">
          {saving ? "Salvando…" : "Salvar mensagem"}
        </Button>
      </div>

      <div className="rounded-card border border-line bg-card p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Enviar para convidados
        </p>

        {guests === null ? (
          <p className="mt-3 text-sm text-ink-muted">Carregando…</p>
        ) : guestsWithContact.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">
            Nenhum convidado com contato preenchido ainda.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {guestsWithContact.map((guest) => (
              <li key={guest.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{guest.name}</p>
                  <p className="truncate text-xs text-ink-muted">{guest.contact}</p>
                </div>
                <a
                  href={buildWhatsAppUrl(guest.contact, messageFor(guest))}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 rounded-full border border-line bg-card px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-mint hover:text-mint"
                >
                  Abrir WhatsApp
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
