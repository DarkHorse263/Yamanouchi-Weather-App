import { createClient } from "@supabase/supabase-js";

// Published anon key — safe to embed (same key already in the iOS app)
const SUPABASE_URL =
  process.env.SUPABASE_URL ?? "https://rbeyhfotgpsigjpptcnl.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJiZXloZm90Z3BzaWdqcHB0Y25sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MTY4ODUsImV4cCI6MjA4ODA5Mjg4NX0.N3T4KQ49tMWWw1_rakgpBPwUOX84KQwXMWxC6bsrSZg";

let supabaseClient: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseClient;
}

export function isSupabaseConfigured(): boolean {
  return true;
}
