import { getSupabaseServerClient } from "@/lib/supabase/server";
import { apiError, apiOk } from "@/lib/api-response";

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

  let query = supabase
    .from("guests")
    .select("*")
    .eq("event_id", params.id)
    .order("created_at", { ascending: true });

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data: guests, error } = await query;

  if (error) {
    return apiError("INTERNAL_ERROR", error.message, 500);
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
