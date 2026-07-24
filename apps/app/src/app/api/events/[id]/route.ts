import { getSupabaseServerClient } from "@/lib/supabase/server";
import { apiError, apiOk } from "@/lib/api-response";
import { eventUpdateSchema } from "@/lib/validation";

export async function PATCH(
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

  const body = await request.json().catch(() => null);
  const parsed = eventUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      parsed.error.issues.map((issue) => issue.message).join("; "),
      400,
    );
  }

  // RLS ensures only the owner can update; a mismatched id resolves to 0 rows.
  const { data, error } = await supabase
    .from("events")
    .update(parsed.data)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return apiError("NOT_FOUND", "Evento não encontrado.", 404);
    }
    return apiError("INTERNAL_ERROR", error.message, 500);
  }

  return apiOk({ event: data });
}
