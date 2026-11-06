import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type DemoProject = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  client_name: string;
  task_count: number;
};

export type DemoTask = {
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

export type DemoAttachment = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  url: string;
  downloadUrl: string;
  uploadedByName: string | null;
  uploadedByType: string;
  createdAt: string;
};

export type DemoComment = {
  id: string;
  authorType: string;
  authorId: string | null;
  authorName: string;
  body: string;
  pinnedAttachmentId: string | null;
  pinX: number | null;
  pinY: number | null;
  createdAt: string;
  attachments: DemoAttachment[];
};

export type DemoHistory = {
  id: string;
  from_status: string | null;
  to_status: string;
  changed_by_name: string | null;
  created_at: string;
};

export function demoAssetUrl(storagePath: string): string {
  if (storagePath.startsWith("demo/")) {
    return `/${storagePath.replace(/^demo\//, "demo-assets/")}`;
  }
  return `/${storagePath}`;
}

export async function listDemoProjects(): Promise<DemoProject[]> {
  const admin = createAdminClient();
  const { data: projects, error } = await admin
    .from("projects")
    .select("id, name, description, created_at, client_id")
    .eq("is_demo", true)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  if (!projects || projects.length === 0) return [];

  const projectIds = projects.map((project) => project.id);
  const [clientsResult, tasksResult] = await Promise.all([
    admin.from("clients").select("id, name").eq("is_demo", true),
    admin.from("tasks").select("project_id").in("project_id", projectIds),
  ]);

  const clientNames = new Map(
    (clientsResult.data ?? []).map((client) => [client.id, client.name]),
  );
  const counts = new Map<string, number>();
  for (const task of tasksResult.data ?? []) {
    counts.set(task.project_id, (counts.get(task.project_id) ?? 0) + 1);
  }

  return projects.map((project) => ({
    id: project.id,
    name: project.name,
    description: project.description,
    created_at: project.created_at,
    client_name: clientNames.get(project.client_id) ?? "Демо-клиент",
    task_count: counts.get(project.id) ?? 0,
  }));
}

export async function getDemoProject(projectId: string) {
  const admin = createAdminClient();
  const { data: project } = await admin
    .from("projects")
    .select("id, name, description, created_at, client_id, is_demo")
    .eq("id", projectId)
    .eq("is_demo", true)
    .maybeSingle();

  if (!project) return null;

  const { data: client } = await admin
    .from("clients")
    .select("name")
    .eq("id", project.client_id)
    .maybeSingle();

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    created_at: project.created_at,
    clientName: client?.name ?? "Демо-клиент",
  };
}

export async function listDemoProjectTasks(
  projectId: string,
): Promise<DemoTask[]> {
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

export async function getDemoTaskContext(taskId: string) {
  const admin = createAdminClient();
  const { data: task } = await admin
    .from("tasks")
    .select(
      "id, project_id, status_code, title, description, priority, deadline, position, created_at, updated_at",
    )
    .eq("id", taskId)
    .maybeSingle();

  if (!task) return null;

  const { data: project } = await admin
    .from("projects")
    .select("id, name, client_id, is_demo")
    .eq("id", task.project_id)
    .maybeSingle();

  if (!project || !project.is_demo) return null;

  const { data: client } = await admin
    .from("clients")
    .select("name")
    .eq("id", project.client_id)
    .maybeSingle();

  return {
    task,
    projectName: project.name,
    clientName: client?.name ?? "Демо-клиент",
    projectId: project.id,
  };
}

export async function listDemoAttachments(
  taskId: string,
): Promise<DemoAttachment[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("attachments")
    .select(
      "id, task_id, comment_id, uploaded_by_type, uploaded_by_name, file_name, mime_type, size_bytes, storage_path, width, height, created_at",
    )
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const url = demoAssetUrl(row.storage_path);
    return {
      id: row.id,
      fileName: row.file_name,
      mimeType: row.mime_type,
      sizeBytes: row.size_bytes,
      width: row.width,
      height: row.height,
      url,
      downloadUrl: url,
      uploadedByName: row.uploaded_by_name,
      uploadedByType: row.uploaded_by_type,
      createdAt: row.created_at,
    };
  });
}

export async function listDemoComments(
  taskId: string,
): Promise<DemoComment[]> {
  const admin = createAdminClient();
  const { data: comments, error } = await admin
    .from("comments")
    .select(
      "id, author_type, author_id, author_name, body, pinned_attachment_id, pin_x, pin_y, created_at",
    )
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  if (!comments || comments.length === 0) return [];

  const { data: files } = await admin
    .from("attachments")
    .select(
      "id, comment_id, file_name, mime_type, size_bytes, storage_path, width, height, created_at",
    )
    .in(
      "comment_id",
      comments.map((comment) => comment.id),
    );

  const filesByComment = new Map<string, DemoAttachment[]>();
  for (const row of files ?? []) {
    if (!row.comment_id) continue;
    const url = demoAssetUrl(row.storage_path);
    const list = filesByComment.get(row.comment_id) ?? [];
    list.push({
      id: row.id,
      fileName: row.file_name,
      mimeType: row.mime_type,
      sizeBytes: row.size_bytes,
      width: row.width,
      height: row.height,
      url,
      downloadUrl: url,
      uploadedByName: null,
      uploadedByType: "demo",
      createdAt: row.created_at,
    });
    filesByComment.set(row.comment_id, list);
  }

  return comments.map((comment) => ({
    id: comment.id,
    authorType: comment.author_type,
    authorId: comment.author_id,
    authorName: comment.author_name,
    body: comment.body,
    pinnedAttachmentId: comment.pinned_attachment_id,
    pinX: comment.pin_x === null ? null : Number(comment.pin_x),
    pinY: comment.pin_y === null ? null : Number(comment.pin_y),
    createdAt: comment.created_at,
    attachments: filesByComment.get(comment.id) ?? [],
  }));
}

export async function listDemoHistory(taskId: string): Promise<DemoHistory[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("task_status_history")
    .select("id, from_status, to_status, changed_by_name, created_at")
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}
