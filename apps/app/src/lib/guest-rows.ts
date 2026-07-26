import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Credential } from "@rsvp/db";

export interface GuestRow {
  id: string;
  event_id: string;
  main_guest_id: string | null;
  main_guest_name: string | null;
  name: string;
  contact: string | null;
  response: string;
  guest_token: string;
  created_at: string;
  updated_at: string;
  credential: Credential | null;
  checked_in_via: string | null;
}

export interface GuestFilters {
  search?: string;
  response?: "yes" | "no" | "pending";
  credentialStatus?: "active" | "used" | "revoked";
}

/**
 * Shared shaping logic for "guests + their current credential" used by both
 * the panel list (GET /api/events/:id/guests) and the CSV export — keeps
 * the current-credential-picking and checked_in_via lookup in one place.
 */
export async function fetchGuestRows(
  supabase: SupabaseClient<Database>,
  eventId: string,
  filters: GuestFilters = {},
): Promise<GuestRow[]> {
  let query = supabase
    .from("guests")
    .select("*, credentials(id, event_id, guest_id, status, checked_in_at, checked_in_by, qr_token, created_at)")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (filters.search) {
    query = query.ilike("name", `%${filters.search}%`);
  }
  if (filters.response) {
    query = query.eq("response", filters.response);
  }

  const [{ data, error }, { data: allGuestNames }, { data: links }] = await Promise.all([
    query,
    // Mapa id -> nome para resolver "titular_de" sem depender de embed
    // self-referencing (o gerador de tipos trata guests_main_guest_id_fkey
    // como 1:N nos dois sentidos, então tipar o embed como objeto único
    // não é confiável — resolvemos isso à mão em vez de arriscar o tipo).
    supabase.from("guests").select("id, name").eq("event_id", eventId),
    supabase.from("access_links").select("token, label").eq("event_id", eventId).eq("kind", "validator"),
  ]);

  if (error) throw error;

  const namesById = new Map((allGuestNames ?? []).map((g) => [g.id, g.name]));

  const linkLabels = new Map<string, string>();
  for (const link of links ?? []) {
    if (link.label) linkLabels.set(link.token, link.label);
  }

  let rows: GuestRow[] = (data ?? []).map(({ credentials, ...guest }) => {
    const current =
      credentials.find((c) => c.status !== "revoked") ??
      [...credentials].sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ??
      null;

    const checkedInVia = current?.checked_in_by
      ? (linkLabels.get(current.checked_in_by) ?? `link ${current.checked_in_by.slice(0, 6)}…`)
      : null;

    return {
      ...guest,
      main_guest_name: guest.main_guest_id ? (namesById.get(guest.main_guest_id) ?? null) : null,
      credential: current,
      checked_in_via: checkedInVia,
    };
  });

  if (filters.credentialStatus) {
    rows = rows.filter((row) => row.credential?.status === filters.credentialStatus);
  }

  return rows;
}
