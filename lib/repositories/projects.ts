import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ProjectOption } from "@/lib/types";

export type AdminProjectRow = {
  id: string;
  client_id: string;
  name: string;
  description: string | null;
  is_archived: boolean;
  created_at: string;
};

export async function listAdminProjects(): Promise<ProjectOption[]> {
  const supabase = await createServerSupabaseClient();

  const [projectsResult, clientsResult] = await Promise.all([
    supabase
      .from("projects")
      .select("id, client_id, name, description, is_archived, created_at")
      .eq("is_demo", false)
      .order("name", { ascending: true }),
    supabase.from("clients").select("id, name").eq("is_demo", false),
  ]);

  if (projectsResult.error) throw new Error(projectsResult.error.message);
  if (clientsResult.error) throw new Error(clientsResult.error.message);

  const clientNames = new Map(
    (clientsResult.data ?? []).map((client) => [client.id, client.name]),
  );

  return (projectsResult.data ?? []).map((project) => ({
    id: project.id,
    name: project.name,
    client_id: project.client_id,
    client_name: clientNames.get(project.client_id) ?? "Без клиента",
    is_archived: project.is_archived,
  }));
}

export async function getProjectById(
  id: string,
): Promise<AdminProjectRow | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, client_id, name, description, is_archived, created_at")
    .eq("id", id)
    .eq("is_demo", false)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ?? null;
}
