import { createSupabaseServiceClient } from "@rsvp/db";
import { apiError, apiOk } from "@/lib/api-response";
import { rsvpResponseSchema } from "@/lib/validation";
import { ensureCredential } from "@/lib/credentials";
import { getEffectiveMaxPeople } from "@/lib/addons";

export async function PATCH(
  request: Request,
  { params }: { params: { public_token: string; guestToken: string } },
) {
  const supabase = createSupabaseServiceClient();

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, max_people, status, anti_penetra")
    .eq("public_token", params.public_token)
    .maybeSingle();

  if (eventError) {
    return apiError("INTERNAL_ERROR", eventError.message, 500);
  }
  if (!event) {
    return apiError("NOT_FOUND", "Evento não encontrado.", 404);
  }

  const { data: guest, error: guestError } = await supabase
    .from("guests")
    .select("*")
    .eq("guest_token", params.guestToken)
    .eq("event_id", event.id)
    .maybeSingle();

  if (guestError) {
    return apiError("INTERNAL_ERROR", guestError.message, 500);
  }
  if (!guest) {
    return apiError("NOT_FOUND", "Convidado não encontrado.", 404);
  }

  const body = await request.json().catch(() => null);
  const parsed = rsvpResponseSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      parsed.error.issues.map((issue) => issue.message).join("; "),
      400,
    );
  }

  if (parsed.data.response === "yes" && guest.response !== "yes") {
    if (event.status !== "active") {
      return apiError("EVENT_CANCELLED", "Este evento não está mais aceitando confirmações.", 409);
    }

    const { count: confirmedCount, error: countError } = await supabase
      .from("guests")
      .select("id", { count: "exact", head: true })
      .eq("event_id", event.id)
      .eq("response", "yes");

    if (countError) {
      return apiError("INTERNAL_ERROR", countError.message, 500);
    }

    const effectiveMaxPeople = await getEffectiveMaxPeople(supabase, event.id, event.max_people);

    if ((confirmedCount ?? 0) + 1 > effectiveMaxPeople) {
      return apiError(
        "LIMIT_REACHED",
        "Lotação máxima do evento atingida.",
        409,
      );
    }
  }

  const { data: updated, error: updateError } = await supabase
    .from("guests")
    .update({
      response: parsed.data.response,
      ...(parsed.data.name ? { name: parsed.data.name } : {}),
      ...(parsed.data.contact !== undefined ? { contact: parsed.data.contact } : {}),
    })
    .eq("id", guest.id)
    .select()
    .single();

  if (updateError) {
    return apiError("INTERNAL_ERROR", updateError.message, 500);
  }

  if (event.anti_penetra && updated.response === "yes") {
    await ensureCredential(supabase, event.id, updated.id).catch((err) => {
      console.error("Falha ao emitir credencial:", err instanceof Error ? err.message : err);
    });
  }

  return apiOk({ guest: updated });
}
