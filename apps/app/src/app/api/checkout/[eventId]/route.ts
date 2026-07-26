import { createSupabaseServiceClient } from "@rsvp/db";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { apiError, apiOk } from "@/lib/api-response";
import { checkoutCreateSchema } from "@/lib/validation";
import { resolveAddonPrice } from "@/lib/pricing";
import { createCheckoutPreference } from "@/lib/mercadopago";

export async function POST(
  request: Request,
  { params }: { params: { eventId: string } },
) {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return apiError("UNAUTHORIZED", "É necessário estar autenticado.", 401);
  }

  const body = await request.json().catch(() => null);
  const parsed = checkoutCreateSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      parsed.error.issues.map((issue) => issue.message).join("; "),
      400,
    );
  }

  const price = resolveAddonPrice(parsed.data.addon, parsed.data.people_limit);
  if (!price) {
    return apiError("VALIDATION_ERROR", "Add-on ou opção inválida.", 400);
  }

  // RLS garante que só o dono do evento chega até aqui.
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id")
    .eq("id", params.eventId)
    .maybeSingle();

  if (eventError) {
    return apiError("INTERNAL_ERROR", eventError.message, 500);
  }
  if (!event) {
    return apiError("NOT_FOUND", "Evento não encontrado.", 404);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  let initPoint: string;
  try {
    const preference = await createCheckoutPreference({
      title: price.title,
      amountCents: price.amountCents,
      eventId: event.id,
      addon: parsed.data.addon,
      peopleLimit: price.peopleLimit,
      returnUrl: `${appUrl}/events/${event.id}`,
      notificationUrl: `${appUrl}/api/webhooks/mercadopago`,
    });
    initPoint = preference.initPoint;
  } catch (err) {
    return apiError(
      "INTERNAL_ERROR",
      err instanceof Error ? err.message : "Não foi possível iniciar o pagamento.",
      500,
    );
  }

  // Escrita em `payments` só via service role — as policies de RLS da
  // tabela só permitem SELECT para o dono, nunca INSERT pelo client.
  // Registro aqui é só de auditoria (a liberação de verdade só acontece
  // no webhook, com o pagamento confirmado na API do Mercado Pago).
  const serviceClient = createSupabaseServiceClient();
  await serviceClient.from("payments").insert({
    event_id: event.id,
    addon: parsed.data.addon,
    provider: "mercadopago",
    amount_cents: price.amountCents,
    status: "pending",
  });

  return apiOk({ init_point: initPoint }, { status: 201 });
}
