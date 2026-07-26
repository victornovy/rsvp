import { notFound } from "next/navigation";
import { createSupabaseServiceClient } from "@rsvp/db";
import { RsvpForm } from "@/components/RsvpForm";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CalendarIcon, PinIcon } from "@/components/icons";
import { AdSlot } from "@/components/AdSlot";
import { hasActiveAddon } from "@/lib/addons";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(iso));
}

export default async function PublicEventPage({
  params,
}: {
  params: { public_token: string };
}) {
  const supabase = createSupabaseServiceClient();

  const { data: event } = await supabase
    .from("events")
    .select(
      "id, title, description, event_date, location, image_url, max_people, status, anti_penetra",
    )
    .eq("public_token", params.public_token)
    .maybeSingle();

  if (!event) {
    notFound();
  }

  const { count: confirmedCount } = await supabase
    .from("guests")
    .select("id", { count: "exact", head: true })
    .eq("event_id", event.id)
    .eq("response", "yes");

  const spotsRemaining = Math.max(event.max_people - (confirmedCount ?? 0), 0);
  const marketingUrl = process.env.NEXT_PUBLIC_MARKETING_URL ?? "#";
  const adsRemoved = await hasActiveAddon(supabase, event.id, "remove_ads");

  return (
    <main className="min-h-screen bg-paper">
      <div className="relative h-56 w-full sm:h-72">
        {event.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.image_url} alt={event.title} className="h-full w-full object-cover" />
        ) : (
          <div
            className="h-full w-full bg-plum"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.10) 1.5px, transparent 1.5px)",
              backgroundSize: "18px 18px",
            }}
          />
        )}
      </div>

      <div className="relative -mt-8 rounded-t-[28px] bg-paper px-5 pb-16 pt-7 sm:px-8">
        <div className="mx-auto max-w-lg">
          <p className="font-mono text-[11px] uppercase tracking-widest text-guava">
            Você foi convidado(a) para
          </p>
          <div className="mt-1 flex items-start justify-between gap-3">
            <h1 className="font-display text-3xl leading-tight text-ink">{event.title}</h1>
            {event.status === "cancelled" && (
              <StatusBadge label="Cancelado" tone="clay" className="mt-2 shrink-0" />
            )}
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

          <div className="mt-8">
            {event.status === "cancelled" ? (
              <div className="rounded-card border border-clay/30 bg-clay-light px-5 py-4 text-sm text-clay">
                Este evento foi cancelado pelo organizador. Confirmações não estão mais sendo
                aceitas.
              </div>
            ) : (
              <RsvpForm
                publicToken={params.public_token}
                spotsRemaining={spotsRemaining}
                antiPenetra={event.anti_penetra}
              />
            )}
          </div>

          <AdSlot hideAds={adsRemoved} />

          <p className="mt-10 text-center text-xs text-ink-faint">
            Convite criado com{" "}
            <a href={marketingUrl} className="font-medium text-ink-muted hover:text-guava">
              rsvp.
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
