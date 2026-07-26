import type { SupabaseClient } from "@supabase/supabase-js";
import { generateToken, type Database, type Credential } from "@rsvp/db";

/**
 * Returns the guest's current non-revoked credential, creating one if
 * missing. Used both eagerly (right after RSVP confirm, when the event
 * already has anti_penetra on) and lazily (from the credential page, for
 * guests who confirmed before anti_penetra was turned on for the event).
 */
export async function ensureCredential(
  supabase: SupabaseClient<Database>,
  eventId: string,
  guestId: string,
): Promise<Credential> {
  const { data: existing } = await supabase
    .from("credentials")
    .select("*")
    .eq("guest_id", guestId)
    .neq("status", "revoked")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) return existing;

  const { data: created, error } = await supabase
    .from("credentials")
    .insert({ event_id: eventId, guest_id: guestId, qr_token: generateToken() })
    .select()
    .single();

  if (error) throw error;
  return created;
}
