import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type ClientTaskAccess = {
  taskId: string;
  title: string;
  statusCode: string;
  projectId: string;
  projectName: string;
  clientId: string;
  clientName: string;
};

export type ClientProjectAccess = {
  projectId: string;
  projectName: string;
  clientId: string;
  clientName: string;
};

export async function getClientTaskAccess(
  clientId: string,
  taskId: string,
): Promise<ClientTaskAccess | null> {
  const admin = createAdminClient();

  const { data: task } = await admin
    .from("tasks")
    .select("id, title, status_code, project_id")
    .eq("id", taskId)
    .maybeSingle();
  if (!task) return null;

  const { data: project } = await admin
    .from("projects")
    .select("id, name, client_id, is_demo")
    .eq("id", task.project_id)
    .maybeSingle();
  if (!project || project.is_demo || project.client_id !== clientId) {
    return null;
  }

  const { data: client } = await admin
    .from("clients")
    .select("name")
    .eq("id", clientId)
    .maybeSingle();

  return {
    taskId: task.id,
    title: task.title,
    statusCode: task.status_code,
    projectId: project.id,
    projectName: project.name,
    clientId,
    clientName: client?.name ?? "Клиент",
  };
}

export async function getClientProjectAccess(
  clientId: string,
  projectId: string,
): Promise<ClientProjectAccess | null> {
  const admin = createAdminClient();
  const { data: project } = await admin
    .from("projects")
    .select("id, name, client_id, is_demo")
    .eq("id", projectId)
    .maybeSingle();

  if (!project || project.is_demo || project.client_id !== clientId) {
    return null;
  }

  const { data: client } = await admin
    .from("clients")
    .select("name")
    .eq("id", clientId)
    .maybeSingle();

  return {
    projectId: project.id,
    projectName: project.name,
    clientId,
    clientName: client?.name ?? "Клиент",
  };
}
