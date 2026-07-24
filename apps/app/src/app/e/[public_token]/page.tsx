import { notFound } from "next/navigation";
import { createSupabaseServiceClient } from "@rsvp/db";
import { RsvpForm } from "@/components/RsvpForm";

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
    .select("id, title, description, event_date, location, image_url, max_people, status")
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

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 px-4 py-10">
      {event.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={event.image_url}
          alt={event.title}
          className="h-48 w-full rounded-xl object-cover"
        />
      )}

      <div>
        <h1 className="text-2xl font-bold">{event.title}</h1>
        <p className="mt-1 text-sm text-gray-600">{formatDate(event.event_date)}</p>
        {event.location && <p className="text-sm text-gray-600">{event.location}</p>}
        {event.description && (
          <p className="mt-3 whitespace-pre-line text-sm text-gray-700">
            {event.description}
          </p>
        )}
      </div>

      {event.status === "cancelled" ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Este evento foi cancelado pelo organizador.
        </div>
      ) : (
        <RsvpForm publicToken={params.public_token} spotsRemaining={spotsRemaining} />
      )}
    </main>
  );
}
