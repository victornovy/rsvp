import { createServerClient } from "@supabase/ssr";
import type { Database } from "./types.generated";

export interface CookieToSet {
  name: string;
  value: string;
  options?: Record<string, unknown>;
}

export interface CookieAdapter {
  getAll(): { name: string; value: string }[];
  setAll(cookies: CookieToSet[]): void;
}

/**
 * Server-side client bound to the caller's session cookies.
 * Subject to RLS — use this for any request performed on behalf of a logged-in user.
 */
export function createSupabaseServerClient(cookieAdapter: CookieAdapter) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieAdapter.getAll(),
        setAll: (cookies: CookieToSet[]) => cookieAdapter.setAll(cookies),
      },
    },
  );
}
