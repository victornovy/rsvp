import { getSupabaseServerClient } from "@/lib/supabase/server";
import { apiError, apiOk } from "@/lib/api-response";

export async function POST(
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

  const { error } = await supabase
    .from("access_links")
    .update({ revoked: true })
    .eq("event_id", params.id)
    .eq("kind", "validator")
    .eq("revoked", false);

  if (error) {
    return apiError("INTERNAL_ERROR", error.message, 500);
  }

  return apiOk({ revoked: true });
}
