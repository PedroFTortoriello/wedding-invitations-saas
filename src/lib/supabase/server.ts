import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "./types";

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env."
    );
  }

  return { url, anonKey };
}

/**
 * Server-side Supabase client bound to the request cookies. Use in Server
 * Components, Route Handlers and Server Actions. The session lives in an
 * httpOnly cookie (never localStorage); RLS enforces per-owner access.
 */
export async function createClient() {
  const { url, anonKey } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component (cookies are read-only there).
          // The session is refreshed in middleware, so this can be ignored.
        }
      }
    }
  });
}
