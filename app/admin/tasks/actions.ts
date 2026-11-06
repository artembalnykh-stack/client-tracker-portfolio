"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentAdmin } from "@/lib/auth/require-admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  relationSchema,
  taskCreateSchema,
  taskMoveSchema,
  taskUpdateSchema,
} from "@/lib/validation/task";
import { STATUS_CODES } from "@/lib/status";

export type TaskFormState = {
  error?: string;
};

export type RelationState = {
  error?: string;
  ok?: boolean;
};

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function saveTaskAction(
  _prev: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  const user = await getCurrentAdmin();
  if (!user) return { error: "Нужен вход админа" };

  const taskId = readString(formData, "taskId");
  const raw = {
    project_id: readString(formData, "project_id"),
    title: readString(formData, "title"),
    description: readString(formData, "description"),
    priority: readString(formData, "priority") || "normal",
    deadline: readString(formData, "deadline"),
    status_code: readString(formData, "status_code") || "new",
  };

  const parsed = taskId
    ? taskUpdateSchema.safeParse(raw)
    : taskCreateSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Проверьте поля формы",
    };
  }

  const data = parsed.data;
  const supabase = await createServerSupabaseClient();

  if (taskId) {
    const { data: updated, error } = await supabase
      .from("tasks")
      .update({
        project_id: data.project_id,
        title: data.title,
        description: data.description || null,
        priority: data.priority,
        deadline: data.deadline || null,
      })
      .eq("id", taskId)
      .select("id")
      .single();

    if (error || !updated) {
      return { error: "Не удалось сохранить задачу" };
    }

    revalidatePath("/admin");
    revalidatePath(`/admin/tasks/${taskId}`);
    redirect(`/admin/tasks/${taskId}`);
  }

  const createData = parsed.data as z.infer<typeof taskCreateSchema>;

  const { data: lastTask } = await supabase
    .from("tasks")
    .select("position")
    .eq("project_id", createData.project_id)
    .eq("status_code", createData.status_code)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const position = (lastTask?.position ?? 0) + 1;

  const { data: created, error } = await supabase
    .from("tasks")
    .insert({
      project_id: createData.project_id,
      status_code: createData.status_code,
      title: createData.title,
      description: createData.description || null,
      priority: createData.priority,
      deadline: createData.deadline || null,
      position,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !created) {
    return { error: "Не удалось создать задачу" };
  }

  revalidatePath("/admin");
  redirect(`/admin/tasks/${created.id}`);
}

export async function moveTaskAction(input: {
  taskId: string;
  toStatus: string;
  position: number;
}): Promise<{ ok: boolean; error?: string }> {
  const parsed = taskMoveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Некорректный перенос" };

  const user = await getCurrentAdmin();
  if (!user) return { ok: false, error: "Нужен вход админа" };

  const supabase = await createServerSupabaseClient();
  const { data: task, error: readError } = await supabase
    .from("tasks")
    .select("id, status_code")
    .eq("id", parsed.data.taskId)
    .maybeSingle();

  if (readError || !task) {
    return { ok: false, error: "Задача не найдена" };
  }

  if (task.status_code !== parsed.data.toStatus) {
    const { error } = await supabase.rpc("change_task_status", {
      p_task_id: parsed.data.taskId,
      p_to_status: parsed.data.toStatus,
      p_actor_type: "admin",
      p_actor_name: user.email ?? "Админ",
    });

    if (error) {
      return { ok: false, error: "Не удалось сменить статус" };
    }
  }

  const { error: positionError } = await supabase
    .from("tasks")
    .update({ position: parsed.data.position })
    .eq("id", parsed.data.taskId);

  if (positionError) {
    return { ok: false, error: "Не удалось сохранить позицию" };
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/tasks/${parsed.data.taskId}`);
  return { ok: true };
}

export async function setTaskStatusAction(
  taskId: string,
  status: string,
): Promise<{ ok: boolean; error?: string }> {
  const parsedStatus = z.enum(STATUS_CODES).safeParse(status);
  const parsedId = z.string().uuid().safeParse(taskId);
  if (!parsedStatus.success || !parsedId.success) {
    return { ok: false, error: "Некорректный статус" };
  }

  const user = await getCurrentAdmin();
  if (!user) return { ok: false, error: "Нужен вход админа" };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("change_task_status", {
    p_task_id: parsedId.data,
    p_to_status: parsedStatus.data,
    p_actor_type: "admin",
    p_actor_name: user.email ?? "Админ",
  });

  if (error) {
    return { ok: false, error: "Не удалось сменить статус" };
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/tasks/${taskId}`);
  return { ok: true };
}

export async function deleteTaskAction(
  taskId: string,
): Promise<{ ok: boolean; error?: string }> {
  const parsedId = z.string().uuid().safeParse(taskId);
  if (!parsedId.success) return { ok: false, error: "Некорректная задача" };

  const user = await getCurrentAdmin();
  if (!user) return { ok: false, error: "Нужен вход админа" };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", parsedId.data);

  if (error) {
    return { ok: false, error: "Не удалось удалить задачу" };
  }

  revalidatePath("/admin");
  return { ok: true };
}

export async function addRelationAction(
  _prev: RelationState,
  formData: FormData,
): Promise<RelationState> {
  const parsed = relationSchema.safeParse({
    parentTaskId: readString(formData, "parentTaskId"),
    childTaskId: readString(formData, "childTaskId"),
  });

  if (!parsed.success) {
    return { error: "Выберите задачу" };
  }

  if (parsed.data.parentTaskId === parsed.data.childTaskId) {
    return { error: "Задача не может быть родителем самой себе" };
  }

  const user = await getCurrentAdmin();
  if (!user) return { error: "Нужен вход админа" };

  const supabase = await createServerSupabaseClient();

  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select("id, project_id")
    .in("id", [parsed.data.parentTaskId, parsed.data.childTaskId]);

  if (
    tasksError ||
    !tasks ||
    tasks.length !== 2 ||
    new Set(tasks.map((task) => task.project_id)).size !== 1
  ) {
    return { error: "Связать можно только задачи одного проекта" };
  }

  const { data: existingParent } = await supabase
    .from("task_relations")
    .select("id")
    .eq("child_task_id", parsed.data.childTaskId)
    .maybeSingle();

  if (existingParent) {
    return { error: "У задачи уже есть родитель" };
  }

  const { error } = await supabase.from("task_relations").insert({
    parent_task_id: parsed.data.parentTaskId,
    child_task_id: parsed.data.childTaskId,
  });

  if (error) {
    return { error: "Не удалось связать задачи: проверьте циклы" };
  }

  revalidatePath(`/admin/tasks/${parsed.data.parentTaskId}`);
  revalidatePath(`/admin/tasks/${parsed.data.childTaskId}`);
  return { ok: true };
}

export async function removeRelationAction(
  relationId: string,
  taskId: string,
): Promise<{ ok: boolean; error?: string }> {
  const parsed = z.string().uuid().safeParse(relationId);
  const parsedTask = z.string().uuid().safeParse(taskId);
  if (!parsed.success || !parsedTask.success) {
    return { ok: false, error: "Некорректная связь" };
  }

  const user = await getCurrentAdmin();
  if (!user) return { ok: false, error: "Нужен вход админа" };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("task_relations")
    .delete()
    .eq("id", parsed.data);

  if (error) {
    return { ok: false, error: "Не удалось удалить связь" };
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/tasks/${parsedTask.data}`);
  return { ok: true };
}
