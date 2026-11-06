"use client";

import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient> | undefined;

/**
 * Browser client for Supabase Auth only. Data access goes through the server.
 * NEXT_PUBLIC_* values are public by design; never put service keys here.
 */
export function createBrowserSupabaseClient() {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      throw new Error("Supabase public environment is not configured");
    }

    client = createBrowserClient(url, anonKey);
  }

  return client;
}
