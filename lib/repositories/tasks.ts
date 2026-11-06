import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  AdminTaskRow,
  HistoryRow,
  RelationRow,
  TaskOption,
} from "@/lib/types";

const taskColumns =
  "id, project_id, status_code, title, description, priority, deadline, position, created_at, updated_at";

export async function listTasksForProjects(
  projectIds: string[],
): Promise<AdminTaskRow[]> {
  if (projectIds.length === 0) return [];

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(taskColumns)
    .in("project_id", projectIds)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getTaskById(id: string): Promise<AdminTaskRow | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(taskColumns)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ?? null;
}

export async function listProjectTasks(
  projectId: string,
): Promise<TaskOption[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, status_code")
    .eq("project_id", projectId)
    .order("title", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listTaskHistory(taskId: string): Promise<HistoryRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("task_status_history")
    .select("id, from_status, to_status, changed_by_type, changed_by_name, created_at")
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getTaskRelations(taskId: string): Promise<{
  parent: { relationId: string; task: TaskOption } | null;
  children: { relationId: string; task: TaskOption }[];
}> {
  const supabase = await createServerSupabaseClient();

  const [parentResult, childrenResult] = await Promise.all([
    supabase
      .from("task_relations")
      .select("id, parent_task_id, child_task_id")
      .eq("child_task_id", taskId)
      .maybeSingle(),
    supabase
      .from("task_relations")
      .select("id, parent_task_id, child_task_id")
      .eq("parent_task_id", taskId),
  ]);

  if (parentResult.error) throw new Error(parentResult.error.message);
  if (childrenResult.error) throw new Error(childrenResult.error.message);

  const parentRelation = parentResult.data as RelationRow | null;
  const childRelations = (childrenResult.data ?? []) as RelationRow[];

  const ids = [
    ...(parentRelation ? [parentRelation.parent_task_id] : []),
    ...childRelations.map((relation) => relation.child_task_id),
  ];

  let tasks: TaskOption[] = [];
  if (ids.length > 0) {
    const { data, error } = await supabase
      .from("tasks")
      .select("id, title, status_code")
      .in("id", ids);
    if (error) throw new Error(error.message);
    tasks = data ?? [];
  }

  const taskById = new Map(tasks.map((task) => [task.id, task]));

  return {
    parent:
      parentRelation && taskById.get(parentRelation.parent_task_id)
        ? {
            relationId: parentRelation.id,
            task: taskById.get(parentRelation.parent_task_id) as TaskOption,
          }
        : null,
    children: childRelations
      .map((relation) => {
        const task = taskById.get(relation.child_task_id);
        return task ? { relationId: relation.id, task } : null;
      })
      .filter(
        (value): value is { relationId: string; task: TaskOption } =>
          value !== null,
      ),
  };
}
