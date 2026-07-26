import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { createSupabaseServiceClient } from "@rsvp/db";
import type { Guest } from "@rsvp/db";
import { ensureCredential } from "@/lib/credentials";
import { StatusBadge, credentialTone, CREDENTIAL_STATUS_LABEL } from "@/components/ui/StatusBadge";
import { TicketCard } from "@/components/ui/TicketCard";

async function loadParty(titular: Guest, allGuests: Guest[]) {
  return [titular, ...allGuests.filter((g) => g.main_guest_id === titular.id)];
}

export default async function CredentialPage({
  params,
}: {
  params: { public_token: string; guestToken: string };
}) {
  const supabase = createSupabaseServiceClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, title, anti_penetra")
    .eq("public_token", params.public_token)
    .maybeSingle();

  if (!event) {
    notFound();
  }

  const { data: guest } = await supabase
    .from("guests")
    .select("*")
    .eq("guest_token", params.guestToken)
    .eq("event_id", event.id)
    .maybeSingle();

  if (!guest) {
    notFound();
  }

  let titular = guest;
  if (guest.main_guest_id) {
    const { data: mainGuest } = await supabase
      .from("guests")
      .select("*")
      .eq("id", guest.main_guest_id)
      .maybeSingle();
    if (mainGuest) titular = mainGuest;
  }

  const { data: eventGuests } = await supabase
    .from("guests")
    .select("*")
    .eq("event_id", event.id);

  const party = await loadParty(titular, eventGuests ?? []);

  if (!event.anti_penetra) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-2 px-4 text-center">
        <p className="font-display text-xl text-ink">Sem credencial para este evento</p>
        <p className="text-sm text-ink-muted">
          {event.title} não usa controle de acesso por QR — sua presença já está confirmada.
        </p>
      </main>
    );
  }

  const people = await Promise.all(
    party.map(async (person) => {
      const credential = await ensureCredential(supabase, event.id, person.id);
      const qrDataUrl = await QRCode.toDataURL(credential.qr_token, {
        margin: 1,
        width: 260,
        color: { dark: "#17191B", light: "#FFFFFF" },
      });
      return { person, credential, qrDataUrl };
    }),
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 px-4 py-10">
      <div className="text-center">
        <p className="font-mono text-[11px] uppercase tracking-widest text-guava">Sua credencial</p>
        <h1 className="mt-1 font-display text-2xl text-ink">{event.title}</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Mostre o QR na entrada. {people.length > 1 ? "Cada pessoa tem o seu." : ""}
        </p>
      </div>

      {people.map(({ person, credential, qrDataUrl }, index) => (
        <TicketCard key={person.id} notchTop={40} className="p-6 text-center">
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink-faint">
            {index === 0 ? "Titular" : "Acompanhante"}
          </p>
          <p className="mt-1 font-display text-lg text-ink">{person.name}</p>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrDataUrl}
            alt={`QR de entrada de ${person.name}`}
            className="mx-auto mt-4 h-56 w-56 rounded-2xl border border-line"
          />

          <div className="mt-4 flex items-center justify-center gap-2">
            <StatusBadge
              label={CREDENTIAL_STATUS_LABEL[credential.status] ?? credential.status}
              tone={credentialTone(credential.status)}
            />
          </div>

          <a
            href={qrDataUrl}
            download={`credencial-${person.name.replace(/\s+/g, "-").toLowerCase()}.png`}
            className="mt-5 inline-flex items-center justify-center rounded-full border border-line bg-card px-5 py-2 text-sm font-semibold text-ink transition hover:border-ink/30"
          >
            Baixar QR
          </a>
        </TicketCard>
      ))}
    </main>
  );
}
