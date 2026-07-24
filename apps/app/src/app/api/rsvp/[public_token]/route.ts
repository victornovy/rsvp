import { createSupabaseServiceClient } from "@rsvp/db";
import { apiError, apiOk } from "@/lib/api-response";

export async function GET(
  _request: Request,
  { params }: { params: { public_token: string } },
) {
  const supabase = createSupabaseServiceClient();

  const { data: event, error } = await supabase
    .from("events")
    .select(
      "id, title, description, event_date, location, image_url, max_people, status",
    )
    .eq("public_token", params.public_token)
    .maybeSingle();

  if (error) {
    return apiError("INTERNAL_ERROR", error.message, 500);
  }

  if (!event) {
    return apiError("NOT_FOUND", "Evento não encontrado.", 404);
  }

  const { count: confirmedCount } = await supabase
    .from("guests")
    .select("id", { count: "exact", head: true })
    .eq("event_id", event.id)
    .eq("response", "yes");

  return apiOk({
    event,
    confirmed_count: confirmedCount ?? 0,
    spots_remaining: Math.max(event.max_people - (confirmedCount ?? 0), 0),
  });
}
