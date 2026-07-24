import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types.generated";

/**
 * Service-role client. Bypasses RLS entirely.
 *
 * SERVER-ONLY: never import this module from client components or expose
 * SUPABASE_SERVICE_ROLE_KEY to the browser. Reserved for the public RSVP
 * flow (anonymous guests confirming attendance via public_token/guest_token),
 * where application code — not RLS — enforces which rows may be touched.
 */
export function createSupabaseServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
