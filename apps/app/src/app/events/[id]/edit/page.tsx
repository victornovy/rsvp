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
      <AppHeader title="Editar evento" />
      <main className="mx-auto max-w-xl px-4 py-8">
        <EventForm mode="edit" event={event} />
      </main>
    </>
  );
}
