import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";

const STATUS_LABEL: Record<string, string> = {
  active: "Ativo",
  cancelled: "Cancelado",
  archived: "Arquivado",
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
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

  return (
    <>
      <AppHeader title="Meus eventos" />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {events?.length ?? 0} evento(s)
          </p>
          <Link
            href="/events/new"
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white"
          >
            Novo evento
          </Link>
        </div>

        {!events || events.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500">
            Você ainda não criou nenhum evento.
          </div>
        ) : (
          <ul className="space-y-3">
            {events.map((event) => {
              const counts = countsByEvent.get(event.id) ?? { yes: 0, pending: 0 };
              return (
                <li key={event.id}>
                  <Link
                    href={`/events/${event.id}`}
                    className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-gray-300"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-gray-500">
                          {formatDate(event.event_date)}
                        </p>
                      </div>
                      <span className="whitespace-nowrap rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                        {STATUS_LABEL[event.status] ?? event.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      {counts.yes} confirmado(s) · {counts.pending} pendente(s) · limite{" "}
                      {event.max_people}
                    </p>
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
