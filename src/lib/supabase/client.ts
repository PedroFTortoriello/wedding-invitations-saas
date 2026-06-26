import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

/**
 * Browser Supabase client for Client Components (e.g. login/signup forms).
 * Uses only the public anon key; all data access is still constrained by RLS.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env."
    );
  }

  return createBrowserClient<Database>(url, anonKey);
}
