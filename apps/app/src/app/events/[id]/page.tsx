import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { GuestList } from "@/components/GuestList";
import { CancelEventButton } from "@/components/CancelEventButton";
import { CopyLinkButton } from "@/components/CopyLinkButton";

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

  return (
    <>
      <AppHeader title={event.title} />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">{formatDate(event.event_date)}</p>
              {event.location && <p className="text-sm text-gray-500">{event.location}</p>}
            </div>
            <span className="whitespace-nowrap rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
              {STATUS_LABEL[event.status] ?? event.status}
            </span>
          </div>

          {event.description && (
            <p className="mt-3 whitespace-pre-line text-sm text-gray-700">
              {event.description}
            </p>
          )}

          <div className="mt-4 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
            <span className="truncate">{publicUrl}</span>
            <CopyLinkButton url={publicUrl} />
          </div>

          <div className="mt-5 flex gap-3">
            <Link
              href={`/events/${event.id}/edit`}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
            >
              Editar
            </Link>
            <CancelEventButton eventId={event.id} disabled={event.status === "cancelled"} />
          </div>
        </div>

        <section className="mt-8">
          <h2 className="mb-3 text-base font-semibold">Convidados</h2>
          <GuestList eventId={event.id} />
        </section>
      </main>
    </>
  );
}
