import "server-only";

import { createClient } from "@supabase/supabase-js";
import { supabaseServiceRoleKey, supabaseUrl } from "@/lib/env.server";

/**
 * Server-only Supabase client with the service role. Used by the client portal,
 * the public demo, Storage operations and cron. Never import from a client
 * component: `server-only` makes such an import fail at build time.
 */
export function createAdminClient() {
  return createClient(supabaseUrl(), supabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
