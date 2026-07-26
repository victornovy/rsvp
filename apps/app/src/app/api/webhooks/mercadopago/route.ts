import { NextResponse } from "next/server";
import { WebhookSignatureValidator } from "mercadopago";
import { createSupabaseServiceClient } from "@rsvp/db";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@rsvp/db";
import { fetchMercadoPagoPayment } from "@/lib/mercadopago";
import type { AddonId } from "@/lib/pricing";

const KNOWN_ADDONS: AddonId[] = ["scale", "remove_ads", "custom_domain", "whatsapp"];

function mapPaymentStatus(mpStatus: string | undefined): "pending" | "approved" | "rejected" | "refunded" {
  if (mpStatus === "approved") return "approved";
  if (mpStatus === "rejected" || mpStatus === "cancelled") return "rejected";
  if (mpStatus === "refunded" || mpStatus === "charged_back") return "refunded";
  return "pending";
}

async function activateAddon(
  supabase: SupabaseClient<Database>,
  eventId: string,
  addon: AddonId,
  peopleLimit: number | null,
) {
  await supabase.from("event_addons").insert({
    event_id: eventId,
    addon,
    people_limit: addon === "scale" ? peopleLimit : null,
    status: "active",
  });

  if (addon === "scale" && peopleLimit) {
    const { data: event } = await supabase
      .from("events")
      .select("max_people")
      .eq("id", eventId)
      .maybeSingle();

    await supabase
      .from("events")
      .update({
        is_paid: true,
        max_people: Math.max(event?.max_people ?? 0, peopleLimit),
      })
      .eq("id", eventId);
    return;
  }

  await supabase.from("events").update({ is_paid: true }).eq("id", eventId);
}

/**
 * Notifications from Mercado Pago (Checkout Pro). We always answer 200 fast
 * to acknowledge receipt (MP retries aggressively on non-2xx) — anything
 * that isn't a recognizable/valid `payment` notification is just ignored.
 *
 * Authenticity: 1) optional HMAC signature check against `x-signature` when
 * MERCADOPAGO_WEBHOOK_SECRET is set, and 2) always, regardless of the
 * signature check, we re-fetch the payment from the Mercado Pago API using
 * our own access token and act only on that response — the webhook
 * body/query string is never trusted for the actual status or amount.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const body = await request.json().catch(() => null);

  const topic = body?.type ?? body?.topic ?? url.searchParams.get("type") ?? url.searchParams.get("topic");
  const dataId =
    body?.data?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id");

  if (topic !== "payment" || !dataId) {
    return NextResponse.json({ received: true });
  }

  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (secret) {
    try {
      WebhookSignatureValidator.validate({
        xSignature: request.headers.get("x-signature"),
        xRequestId: request.headers.get("x-request-id"),
        dataId: String(dataId),
        secret,
      });
    } catch (err) {
      console.error("Assinatura do webhook do Mercado Pago inválida:", err);
      return NextResponse.json({ error: "invalid signature" }, { status: 401 });
    }
  }

  const payment = await fetchMercadoPagoPayment(String(dataId)).catch((err) => {
    console.error("Falha ao consultar pagamento no Mercado Pago:", err);
    return null;
  });

  if (!payment || payment.id === undefined) {
    return NextResponse.json({ received: true });
  }

  const [eventId, addonRaw] = String(payment.external_reference ?? "").split(":");
  const addon = KNOWN_ADDONS.find((a) => a === addonRaw);

  if (!eventId || !addon) {
    return NextResponse.json({ received: true });
  }

  const providerPaymentId = String(payment.id);
  const status = mapPaymentStatus(payment.status);
  const amountCents = Math.round((payment.transaction_amount ?? 0) * 100);
  const peopleLimit =
    addon === "scale" ? Number((payment.metadata as { people_limit?: number })?.people_limit) || null : null;

  const supabase = createSupabaseServiceClient();

  const { data: existing } = await supabase
    .from("payments")
    .select("id, status")
    .eq("provider_payment_id", providerPaymentId)
    .maybeSingle();

  if (existing) {
    // Idempotência: já vimos esse pagamento. Só reage se o status mudou
    // (ex: pending -> approved numa notificação posterior).
    if (existing.status === status) {
      return NextResponse.json({ received: true });
    }

    await supabase.from("payments").update({ status }).eq("id", existing.id);

    if (status === "approved" && existing.status !== "approved") {
      await activateAddon(supabase, eventId, addon, peopleLimit);
    }

    return NextResponse.json({ received: true });
  }

  await supabase.from("payments").insert({
    event_id: eventId,
    addon,
    provider: "mercadopago",
    provider_payment_id: providerPaymentId,
    amount_cents: amountCents,
    status,
  });

  if (status === "approved") {
    await activateAddon(supabase, eventId, addon, peopleLimit);
  }

  return NextResponse.json({ received: true });
}
