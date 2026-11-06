import "server-only";

import { getClientTaskAccess } from "@/lib/auth/client-access";
import { createAdminClient } from "@/lib/supabase/admin";

export type ClientProject = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
};

export type ClientTask = {
  id: string;
  project_id: string;
  status_code: string;
  title: string;
  description: string | null;
  priority: string;
  deadline: string | null;
  position: number;
  created_at: string;
  updated_at: string;
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

export async function listClientProjectTasks(
  clientId: string,
  projectId: string,
): Promise<ClientTask[]> {
  const project = await getClientProject(clientId, projectId);
  if (!project) return [];

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tasks")
    .select(
      "id, project_id, status_code, title, description, priority, deadline, position, created_at, updated_at",
    )
    .eq("project_id", projectId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getClientTaskDetail(
  clientId: string,
  taskId: string,
): Promise<{ task: ClientTask; projectName: string; clientName: string } | null> {
  const access = await getClientTaskAccess(clientId, taskId);
  if (!access) return null;

  const admin = createAdminClient();
  const { data: task, error } = await admin
    .from("tasks")
    .select(
      "id, project_id, status_code, title, description, priority, deadline, position, created_at, updated_at",
    )
    .eq("id", taskId)
    .maybeSingle();

  if (error || !task) return null;

  return {
    task,
    projectName: access.projectName,
    clientName: access.clientName,
  };
}
