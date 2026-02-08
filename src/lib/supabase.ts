import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("Missing env var: SUPABASE_URL");
  if (!key) throw new Error("Missing env var: SUPABASE_SERVICE_ROLE_KEY");

  _client = createClient(url, key, {
    auth: { persistSession: false },
  });

  return _client;
}
