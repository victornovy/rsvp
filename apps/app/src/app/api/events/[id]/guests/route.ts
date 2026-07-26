import { getSupabaseServerClient } from "@/lib/supabase/server";
import { apiError, apiOk } from "@/lib/api-response";
import { fetchGuestRows, type GuestFilters } from "@/lib/guest-rows";

const RESPONSE_VALUES = ["yes", "no", "pending"] as const;
const CREDENTIAL_VALUES = ["active", "used", "revoked"] as const;

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return apiError("UNAUTHORIZED", "É necessário estar autenticado.", 401);
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("q")?.trim();
  const responseParam = searchParams.get("response");
  const credentialParam = searchParams.get("credential");

  const filters: GuestFilters = { search: search || undefined };
  if (RESPONSE_VALUES.includes(responseParam as (typeof RESPONSE_VALUES)[number])) {
    filters.response = responseParam as GuestFilters["response"];
  }
  if (CREDENTIAL_VALUES.includes(credentialParam as (typeof CREDENTIAL_VALUES)[number])) {
    filters.credentialStatus = credentialParam as GuestFilters["credentialStatus"];
  }

  let guests;
  try {
    guests = await fetchGuestRows(supabase, params.id, filters);
  } catch (err) {
    return apiError("INTERNAL_ERROR", err instanceof Error ? err.message : "Erro inesperado.", 500);
  }

  const { data: allGuests, error: countsError } = await supabase
    .from("guests")
    .select("response")
    .eq("event_id", params.id);

  if (countsError) {
    return apiError("INTERNAL_ERROR", countsError.message, 500);
  }

  const counts = {
    yes: allGuests.filter((g) => g.response === "yes").length,
    no: allGuests.filter((g) => g.response === "no").length,
    pending: allGuests.filter((g) => g.response === "pending").length,
    total: allGuests.length,
  };

  return apiOk({ guests, counts });
}
