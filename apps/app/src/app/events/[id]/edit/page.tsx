import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { EventForm } from "@/components/EventForm";

export default async function EditEventPage({
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

  return (
    <>
      <AppHeader
        title="Editar evento"
        backHref={`/events/${event.id}`}
        backLabel="Voltar ao evento"
      />
      <main className="mx-auto max-w-xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 font-display text-2xl text-ink">Editar evento</h1>
        <EventForm mode="edit" event={event} />
      </main>
    </>
  );
}
