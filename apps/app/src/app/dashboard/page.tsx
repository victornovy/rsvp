import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/Button";
import { TicketCard, TicketDivider } from "@/components/ui/TicketCard";
import { StatusBadge, eventStatusTone } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PlusIcon, TicketIcon } from "@/components/icons";

const STATUS_LABEL: Record<string, string> = {
  active: "Ativo",
  cancelled: "Cancelado",
  archived: "Arquivado",
};

function dateParts(iso: string) {
  const date = new Date(iso);
  return {
    day: new Intl.DateTimeFormat("pt-BR", { day: "2-digit" }).format(date),
    month: new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(date).replace(".", ""),
    time: new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(date),
  };
}

export default async function DashboardPage() {
  await requireUser();
  const supabase = getSupabaseServerClient();

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .order("event_date", { ascending: true });

  const eventIds = (events ?? []).map((event) => event.id);
  const countsByEvent = new Map<string, { yes: number; pending: number }>();

  if (eventIds.length > 0) {
    const { data: guestRows } = await supabase
      .from("guests")
      .select("event_id, response")
      .in("event_id", eventIds);

    for (const row of guestRows ?? []) {
      const current = countsByEvent.get(row.event_id) ?? { yes: 0, pending: 0 };
      if (row.response === "yes") current.yes += 1;
      if (row.response === "pending") current.pending += 1;
      countsByEvent.set(row.event_id, current);
    }
  }

  const activeCount = (events ?? []).filter((e) => e.status === "active").length;

  return (
    <>
      <AppHeader title="Meus eventos" />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl text-ink">Meus eventos</h1>
            <p className="mt-1 text-sm text-ink-muted">
              {activeCount} {activeCount === 1 ? "evento ativo" : "eventos ativos"}
            </p>
          </div>
          <Button href="/events/new">
            <PlusIcon width={16} height={16} />
            Novo evento
          </Button>
        </div>

        {!events || events.length === 0 ? (
          <EmptyState
            icon={<TicketIcon width={28} height={28} />}
            title="Nenhum evento ainda"
            description="Crie seu primeiro evento para gerar o link de confirmação e começar a receber respostas."
            action={
              <Button href="/events/new" size="sm">
                <PlusIcon width={16} height={16} />
                Criar evento
              </Button>
            }
          />
        ) : (
          <ul className="space-y-4">
            {events.map((event) => {
              const counts = countsByEvent.get(event.id) ?? { yes: 0, pending: 0 };
              const { day, month, time } = dateParts(event.event_date);
              return (
                <li key={event.id}>
                  <Link href={`/events/${event.id}`} className="block">
                    <TicketCard
                      notchTop={72}
                      className="p-4 transition hover:-translate-y-0.5 hover:shadow-lg sm:p-5"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-plum/[0.06] py-2 text-plum">
                          <span className="font-mono text-xl font-semibold leading-none">{day}</span>
                          <span className="mt-1 font-mono text-[10px] uppercase leading-none tracking-wide">
                            {month}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate font-display text-base text-ink">
                              {event.title}
                            </p>
                            <StatusBadge
                              label={STATUS_LABEL[event.status] ?? event.status}
                              tone={eventStatusTone(event.status)}
                            />
                          </div>
                          <p className="mt-1 truncate text-xs text-ink-muted">
                            {time}
                            {event.location ? ` · ${event.location}` : ""}
                          </p>
                        </div>
                      </div>

                      <TicketDivider className="my-4" />

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px]">
                        <span className="text-mint">{counts.yes} confirmados</span>
                        <span className="text-amber">{counts.pending} pendentes</span>
                        <span className="text-ink-muted">limite {event.max_people}</span>
                      </div>
                    </TicketCard>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
