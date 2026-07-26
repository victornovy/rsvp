import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { GuestList } from "@/components/GuestList";
import { CancelEventButton } from "@/components/CancelEventButton";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { Button } from "@/components/ui/Button";
import { TicketDivider } from "@/components/ui/TicketCard";
import { StatusBadge, eventStatusTone } from "@/components/ui/StatusBadge";
import { CalendarIcon, LinkIcon, PinIcon } from "@/components/icons";
import { ValidatorLinkPanel, type ValidatorLink } from "@/components/ValidatorLinkPanel";
import { LiveCheckinStats } from "@/components/LiveCheckinStats";
import { EventSummaryCards } from "@/components/EventSummaryCards";
import { ExportCsvButton } from "@/components/ExportCsvButton";

const STATUS_LABEL: Record<string, string> = {
  active: "Ativo",
  cancelled: "Cancelado",
  archived: "Arquivado",
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(iso));
}

export default async function EventDetailPage({
  params,
}: {
  params: { id: string };
}) {
  await requireUser();
  const supabase = getSupabaseServerClient();

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!event) {
    notFound();
  }

  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/e/${event.public_token}`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  let validatorLinks: ValidatorLink[] = [];
  let checkedInCount = 0;

  const [{ count: totalGuestsCount }, { count: yesCount }] = await Promise.all([
    supabase
      .from("guests")
      .select("id", { count: "exact", head: true })
      .eq("event_id", event.id),
    supabase
      .from("guests")
      .select("id", { count: "exact", head: true })
      .eq("event_id", event.id)
      .eq("response", "yes"),
  ]);
  const confirmedCount = yesCount ?? 0;

  if (event.anti_penetra) {
    const nowIso = new Date().toISOString();
    const [{ data: activeLinks }, { count: usedCount }] = await Promise.all([
      supabase
        .from("access_links")
        .select("id, token, label, expires_at")
        .eq("event_id", event.id)
        .eq("kind", "validator")
        .eq("revoked", false)
        .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
        .order("created_at", { ascending: false }),
      supabase
        .from("credentials")
        .select("id", { count: "exact", head: true })
        .eq("event_id", event.id)
        .eq("status", "used"),
    ]);

    validatorLinks = (activeLinks ?? []).map((link) => ({
      id: link.id,
      token: link.token,
      label: link.label,
      url: `${appUrl}/v/${link.token}`,
      expires_at: link.expires_at,
    }));
    checkedInCount = usedCount ?? 0;
  }

  return (
    <>
      <AppHeader title={event.title} backHref="/dashboard" backLabel="Meus eventos" />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <div className="overflow-hidden rounded-card bg-card shadow-card">
          {event.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.image_url} alt={event.title} className="h-40 w-full object-cover sm:h-52" />
          )}

          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <h1 className="font-display text-2xl text-ink">{event.title}</h1>
              <StatusBadge
                label={STATUS_LABEL[event.status] ?? event.status}
                tone={eventStatusTone(event.status)}
                className="mt-1.5 shrink-0"
              />
            </div>

            <div className="mt-3 space-y-1.5 text-sm text-ink-muted">
              <div className="flex items-center gap-2">
                <CalendarIcon width={16} height={16} className="shrink-0 text-ink-faint" />
                {formatDate(event.event_date)}
              </div>
              {event.location && (
                <div className="flex items-center gap-2">
                  <PinIcon width={16} height={16} className="shrink-0 text-ink-faint" />
                  {event.location}
                </div>
              )}
            </div>

            {event.description && (
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ink">
                {event.description}
              </p>
            )}

            <TicketDivider className="my-5" />

            <div className="flex items-center gap-2 rounded-2xl bg-paper px-3.5 py-2.5 text-xs text-ink-muted">
              <LinkIcon width={14} height={14} className="shrink-0 text-ink-faint" />
              <span className="min-w-0 flex-1 truncate">{publicUrl}</span>
              <CopyLinkButton url={publicUrl} />
            </div>

            <div className="mt-5 flex gap-3">
              <Button href={`/events/${event.id}/edit`} variant="secondary">
                Editar
              </Button>
              <CancelEventButton eventId={event.id} disabled={event.status === "cancelled"} />
            </div>
          </div>
        </div>

        <section className="mt-6">
          <EventSummaryCards
            total={totalGuestsCount ?? 0}
            confirmed={confirmedCount}
            checkedIn={checkedInCount}
            antiPenetra={event.anti_penetra}
          />
        </section>

        {event.anti_penetra && (
          <section className="mt-8">
            <h2 className="mb-3 font-display text-lg text-ink">Controle de acesso</h2>
            <div className="space-y-4">
              <LiveCheckinStats
                eventId={event.id}
                initialConfirmed={confirmedCount}
                initialCheckedIn={checkedInCount}
              />
              <ValidatorLinkPanel eventId={event.id} initialLinks={validatorLinks} />
            </div>
          </section>
        )}

        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-display text-lg text-ink">Convidados</h2>
            <ExportCsvButton eventId={event.id} />
          </div>
          <GuestList eventId={event.id} antiPenetra={event.anti_penetra} />
        </section>
      </main>
    </>
  );
}
