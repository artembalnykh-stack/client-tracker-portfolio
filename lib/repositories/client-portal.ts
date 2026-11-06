import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type ClientProject = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
};

export async function listClientProjects(
  clientId: string,
): Promise<ClientProject[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("projects")
    .select("id, name, description, created_at")
    .eq("client_id", clientId)
    .eq("is_demo", false)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getClientProject(
  clientId: string,
  projectId: string,
): Promise<ClientProject | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("projects")
    .select("id, name, description, created_at")
    .eq("id", projectId)
    .eq("client_id", clientId)
    .eq("is_demo", false)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ?? null;
}
