import { createSupabaseServiceClient } from "@rsvp/db";

export interface ValidatorContext {
  valid: boolean;
  reason?: "not_found" | "revoked" | "expired";
  event?: { id: string; title: string };
}

/** Shared by the GET /api/validate/:linkToken route and the /v/:linkToken page. */
export async function getValidatorLinkContext(linkToken: string): Promise<ValidatorContext> {
  const supabase = createSupabaseServiceClient();

  const { data: link } = await supabase
    .from("access_links")
    .select("event_id, revoked, expires_at")
    .eq("token", linkToken)
    .eq("kind", "validator")
    .maybeSingle();

  if (!link) return { valid: false, reason: "not_found" };
  if (link.revoked) return { valid: false, reason: "revoked" };
  if (link.expires_at && new Date(link.expires_at) <= new Date()) {
    return { valid: false, reason: "expired" };
  }

  const { data: event } = await supabase
    .from("events")
    .select("id, title")
    .eq("id", link.event_id)
    .maybeSingle();

  if (!event) return { valid: false, reason: "not_found" };

  return { valid: true, event };
}
