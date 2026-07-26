import { getSupabaseServerClient } from "@/lib/supabase/server";
import { apiError, apiOk } from "@/lib/api-response";

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

  const [{ count: confirmed, error: confirmedError }, { count: checkedIn, error: checkedInError }] =
    await Promise.all([
      supabase
        .from("guests")
        .select("id", { count: "exact", head: true })
        .eq("event_id", params.id)
        .eq("response", "yes"),
      supabase
        .from("credentials")
        .select("id", { count: "exact", head: true })
        .eq("event_id", params.id)
        .eq("status", "used"),
    ]);

  if (confirmedError) {
    return apiError("INTERNAL_ERROR", confirmedError.message, 500);
  }
  if (checkedInError) {
    return apiError("INTERNAL_ERROR", checkedInError.message, 500);
  }

  return apiOk({ confirmed: confirmed ?? 0, checkedIn: checkedIn ?? 0 });
}
