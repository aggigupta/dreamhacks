import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const key =
  process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/**
 * Server-side Supabase client. Null when env vars are absent — callers fall back
 * to the in-process store so the app still runs offline / in CI.
 */
function makeClient(): SupabaseClient | null {
  if (!url || !key) return null;
  try {
    return createClient(url, key, { auth: { persistSession: false } });
  } catch {
    // Malformed URL/key: fall back to the in-process store rather than crash.
    return null;
  }
}

export const supabase: SupabaseClient | null = makeClient();

export const supabaseReady = supabase !== null;
