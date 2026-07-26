import { createSupabaseServiceClient, generateToken } from "@rsvp/db";
import { apiError, apiOk } from "@/lib/api-response";
import { rsvpConfirmSchema } from "@/lib/validation";
import { ensureCredential } from "@/lib/credentials";
import { getEffectiveMaxPeople } from "@/lib/addons";

export async function POST(
  request: Request,
  { params }: { params: { public_token: string } },
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
  if (event.status !== "active") {
    return apiError("EVENT_CANCELLED", "Este evento não está mais aceitando confirmações.", 409);
  }

  const body = await request.json().catch(() => null);
  const parsed = rsvpConfirmSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      parsed.error.issues.map((issue) => issue.message).join("; "),
      400,
    );
  }

  const { count: confirmedCount, error: countError } = await supabase
    .from("guests")
    .select("id", { count: "exact", head: true })
    .eq("event_id", event.id)
    .eq("response", "yes");

  if (countError) {
    return apiError("INTERNAL_ERROR", countError.message, 500);
  }

  const partySize = 1 + parsed.data.companions.length;
  const effectiveMaxPeople = await getEffectiveMaxPeople(supabase, event.id, event.max_people);

  if ((confirmedCount ?? 0) + partySize > effectiveMaxPeople) {
    return apiError(
      "LIMIT_REACHED",
      "Lotação máxima do evento atingida. Não há vagas suficientes para o grupo informado.",
      409,
    );
  }

  const mainGuestToken = generateToken();
  const { data: mainGuest, error: mainGuestError } = await supabase
    .from("guests")
    .insert({
      event_id: event.id,
      name: parsed.data.name,
      contact: parsed.data.contact ?? null,
      response: "yes",
      guest_token: mainGuestToken,
    })
    .select()
    .single();

  if (mainGuestError) {
    return apiError("INTERNAL_ERROR", mainGuestError.message, 500);
  }

  let companions: unknown[] = [];
  if (parsed.data.companions.length > 0) {
    const { data: companionRows, error: companionsError } = await supabase
      .from("guests")
      .insert(
        parsed.data.companions.map((companion) => ({
          event_id: event.id,
          main_guest_id: mainGuest.id,
          name: companion.name,
          response: "yes" as const,
          guest_token: generateToken(),
        })),
      )
      .select();

    if (companionsError) {
      return apiError("INTERNAL_ERROR", companionsError.message, 500);
    }
    companions = companionRows;
  }

  if (event.anti_penetra) {
    const partyGuestIds = [mainGuest.id, ...companions.map((c) => (c as { id: string }).id)];

    // A credencial é um bônus sobre a confirmação já registrada — se a
    // emissão falhar, não desfazemos o RSVP. A credencial pode ser gerada
    // sob demanda depois (ver página de credencial pública).
    await Promise.all(
      partyGuestIds.map((guestId) =>
        ensureCredential(supabase, event.id, guestId).catch((err) => {
          console.error("Falha ao emitir credencial:", err instanceof Error ? err.message : err);
        }),
      ),
    );
  }

  return apiOk(
    {
      guest: mainGuest,
      companions,
    },
    { status: 201 },
  );
}
