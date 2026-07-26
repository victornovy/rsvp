import { generateToken } from "@rsvp/db";
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

  // RLS escopa a leitura à credencial de um evento do próprio usuário.
  const { data: old, error: oldError } = await supabase
    .from("credentials")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (oldError) {
    return apiError("INTERNAL_ERROR", oldError.message, 500);
  }
  if (!old) {
    return apiError("NOT_FOUND", "Credencial não encontrada.", 404);
  }

  const { error: revokeError } = await supabase
    .from("credentials")
    .update({ status: "revoked" })
    .eq("id", old.id);

  if (revokeError) {
    return apiError("INTERNAL_ERROR", revokeError.message, 500);
  }

  const { data: created, error: createError } = await supabase
    .from("credentials")
    .insert({
      event_id: old.event_id,
      guest_id: old.guest_id,
      qr_token: generateToken(),
    })
    .select()
    .single();

  if (createError) {
    return apiError("INTERNAL_ERROR", createError.message, 500);
  }

  return apiOk({ credential: created }, { status: 201 });
}
