import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AdminClientRow = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  invite_token_hash: string | null;
  invite_expires_at: string | null;
  invite_revoked_at: string | null;
  created_at: string;
};

export type AdminProjectRow = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
};

export async function listClients(): Promise<AdminClientRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("clients")
    .select(
      "id, name, company, email, invite_token_hash, invite_expires_at, invite_revoked_at, created_at",
    )
    .eq("is_demo", false)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getClientById(
  id: string,
): Promise<AdminClientRow | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("clients")
    .select(
      "id, name, company, email, invite_token_hash, invite_expires_at, invite_revoked_at, created_at",
    )
    .eq("id", id)
    .eq("is_demo", false)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ?? null;
}

export async function listProjectsForClient(
  clientId: string,
): Promise<AdminProjectRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, description, created_at")
    .eq("client_id", clientId)
    .eq("is_demo", false)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function countProjectsByClient(): Promise<Map<string, number>> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .select("client_id")
    .eq("is_demo", false);

  if (error) throw new Error(error.message);

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    counts.set(row.client_id, (counts.get(row.client_id) ?? 0) + 1);
  }
  return counts;
}
