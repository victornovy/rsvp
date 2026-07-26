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

  // RLS (access_links_all_owner) só deixa isso afetar links de eventos do
  // próprio usuário.
  const { data, error } = await supabase
    .from("access_links")
    .update({ revoked: true })
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return apiError("NOT_FOUND", "Link não encontrado.", 404);
    }
    return apiError("INTERNAL_ERROR", error.message, 500);
  }

  return apiOk({ link: data });
}
