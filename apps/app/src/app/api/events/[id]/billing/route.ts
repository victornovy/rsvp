import { getSupabaseServerClient } from "@/lib/supabase/server";
import { apiError, apiOk } from "@/lib/api-response";
import { getEffectiveMaxPeople } from "@/lib/addons";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return apiError("UNAUTHORIZED", "É necessário estar autenticado.", 401);
  }

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, max_people, is_paid")
    .eq("id", params.id)
    .maybeSingle();

  if (eventError) {
    return apiError("INTERNAL_ERROR", eventError.message, 500);
  }
  if (!event) {
    return apiError("NOT_FOUND", "Evento não encontrado.", 404);
  }

  // RLS ("owner reads addons"/"owner reads payments") já garante que só o
  // dono do evento lê essas duas listas.
  const [{ data: addons, error: addonsError }, { data: payments, error: paymentsError }] =
    await Promise.all([
      supabase
        .from("event_addons")
        .select("*")
        .eq("event_id", event.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("payments")
        .select("*")
        .eq("event_id", event.id)
        .order("created_at", { ascending: false }),
    ]);

  if (addonsError) {
    return apiError("INTERNAL_ERROR", addonsError.message, 500);
  }
  if (paymentsError) {
    return apiError("INTERNAL_ERROR", paymentsError.message, 500);
  }

  const activeAddons = (addons ?? []).filter((a) => a.status === "active");
  const effectiveMaxPeople = await getEffectiveMaxPeople(supabase, event.id, event.max_people);

  return apiOk({
    baseMaxPeople: event.max_people,
    effectiveMaxPeople,
    isPaid: event.is_paid,
    adsRemoved: activeAddons.some((a) => a.addon === "remove_ads"),
    customDomain: activeAddons.some((a) => a.addon === "custom_domain"),
    whatsappActive: activeAddons.some((a) => a.addon === "whatsapp"),
    addons: addons ?? [],
    payments: payments ?? [],
  });
}
