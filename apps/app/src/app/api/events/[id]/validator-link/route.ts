import { generateToken } from "@rsvp/db";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { apiError, apiOk } from "@/lib/api-response";
import { validatorLinkCreateSchema } from "@/lib/validation";

export async function POST(
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

  const body = await request.json().catch(() => ({}));
  const parsed = validatorLinkCreateSchema.safeParse(body ?? {});

  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      parsed.error.issues.map((issue) => issue.message).join("; "),
      400,
    );
  }

  // RLS garante que só o dono do evento chega até aqui (join em events).
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id")
    .eq("id", params.id)
    .maybeSingle();

  if (eventError) {
    return apiError("INTERNAL_ERROR", eventError.message, 500);
  }
  if (!event) {
    return apiError("NOT_FOUND", "Evento não encontrado.", 404);
  }

  // Vários links de validador podem ficar ativos ao mesmo tempo (ex: um por
  // portão) — criar um novo não mexe nos existentes.
  const { data: link, error: linkError } = await supabase
    .from("access_links")
    .insert({
      event_id: event.id,
      kind: "validator",
      token: generateToken(),
      label: parsed.data.label || null,
      expires_at: parsed.data.expires_at ?? null,
    })
    .select()
    .single();

  if (linkError) {
    return apiError("INTERNAL_ERROR", linkError.message, 500);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  return apiOk(
    {
      id: link.id,
      token: link.token,
      label: link.label,
      url: `${appUrl}/v/${link.token}`,
      expires_at: link.expires_at,
    },
    { status: 201 },
  );
}
