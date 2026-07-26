import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

function getConfig() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado.");
  }
  return new MercadoPagoConfig({ accessToken });
}

export interface CreateCheckoutPreferenceInput {
  title: string;
  amountCents: number;
  eventId: string;
  addon: string;
  peopleLimit: number | null;
  returnUrl: string;
  notificationUrl: string;
}

/** Creates a Checkout Pro preference and returns its hosted payment URL. */
export async function createCheckoutPreference(input: CreateCheckoutPreferenceInput) {
  const preference = new Preference(getConfig());

  const result = await preference.create({
    body: {
      items: [
        {
          id: input.addon,
          title: input.title,
          quantity: 1,
          currency_id: "BRL",
          unit_price: input.amountCents / 100,
        },
      ],
      external_reference: `${input.eventId}:${input.addon}`,
      metadata: { people_limit: input.peopleLimit },
      notification_url: input.notificationUrl,
      back_urls: {
        success: input.returnUrl,
        pending: input.returnUrl,
        failure: input.returnUrl,
      },
      auto_return: "approved",
    },
  });

  if (!result.init_point) {
    throw new Error("Mercado Pago não retornou um link de pagamento.");
  }

  return { initPoint: result.init_point, preferenceId: result.id ?? null };
}

/** Fetches the authoritative payment record from Mercado Pago's API — never trust the webhook payload alone. */
export async function fetchMercadoPagoPayment(paymentId: string) {
  const payment = new Payment(getConfig());
  return payment.get({ id: paymentId });
}
