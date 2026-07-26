import { createSupabaseServiceClient } from "@rsvp/db";
import { apiError, apiOk } from "@/lib/api-response";
import { checkinSchema } from "@/lib/validation";

export async function POST(
  request: Request,
  { params }: { params: { linkToken: string } },
) {
  const body = await request.json().catch(() => null);
  const parsed = checkinSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      parsed.error.issues.map((issue) => issue.message).join("; "),
      400,
    );
  }

  const supabase = createSupabaseServiceClient();

  // A RPC é a única via de check-in: ela faz o `update ... where status =
  // 'active'` de forma atômica, então duas leituras simultâneas do mesmo QR
  // nunca resultam em dois "valid".
  const { data, error } = await supabase.rpc("checkin_credential", {
    p_qr_token: parsed.data.qr_token,
    p_link_token: params.linkToken,
  });

  if (error) {
    return apiError("INTERNAL_ERROR", error.message, 500);
  }

  return apiOk(data);
}
