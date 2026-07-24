import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@rsvp/db";

/**
 * Server client bound to the current request's session cookies (RLS applies).
 * Safe to call from Server Components, Server Actions, and Route Handlers.
 */
export function getSupabaseServerClient() {
  const cookieStore = cookies();

  return createSupabaseServerClient({
    getAll: () => cookieStore.getAll(),
    setAll: (cookiesToSet) => {
      try {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      } catch {
        // Called from a Server Component render — session refresh is
        // handled by middleware instead, so this is safe to ignore.
      }
    },
  });
}
