import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@rsvp/db";
import type { AddonId } from "@/lib/pricing";

/**
 * Effective guest cap for an event: the event's own `max_people` (free
 * default: 25) unless an active `scale` add-on raised it. We take the max
 * of both rather than trusting `events.max_people` alone — the webhook
 * bumps that column too, but this is the belt-and-suspenders source of
 * truth the spec calls for.
 */
export async function getEffectiveMaxPeople(
  supabase: SupabaseClient<Database>,
  eventId: string,
  baseMaxPeople: number,
): Promise<number> {
  const { data } = await supabase
    .from("event_addons")
    .select("people_limit")
    .eq("event_id", eventId)
    .eq("addon", "scale")
    .eq("status", "active")
    .order("people_limit", { ascending: false })
    .limit(1)
    .maybeSingle();

  return Math.max(baseMaxPeople, data?.people_limit ?? 0);
}

export async function hasActiveAddon(
  supabase: SupabaseClient<Database>,
  eventId: string,
  addon: AddonId,
): Promise<boolean> {
  const { count } = await supabase
    .from("event_addons")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("addon", addon)
    .eq("status", "active");

  return (count ?? 0) > 0;
}
