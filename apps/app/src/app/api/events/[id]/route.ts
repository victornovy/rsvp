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

  let overCapacityBy: number | null = null;
  if (parsed.data.max_people !== undefined) {
    const { count: confirmedCount } = await supabase
      .from("guests")
      .select("id", { count: "exact", head: true })
      .eq("event_id", params.id)
      .eq("response", "yes");

    if ((confirmedCount ?? 0) > parsed.data.max_people) {
      overCapacityBy = (confirmedCount ?? 0) - parsed.data.max_people;
    }
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

  // O limite menor não apaga ninguém — só passa a bloquear novas
  // confirmações até a lista caber de novo (já garantido pelo LIMIT_REACHED
  // do fluxo de RSVP). Aqui só avisamos o organizador.
  if (overCapacityBy !== null) {
    return apiOk({
      event: data,
      warning: {
        code: "OVER_CAPACITY",
        message: `O evento já tem ${overCapacityBy} confirmado(s) a mais que o novo limite. Ninguém foi removido, mas novas confirmações ficam bloqueadas até a lista caber.`,
      },
    });
  }

  return apiOk({ event: data });
}
