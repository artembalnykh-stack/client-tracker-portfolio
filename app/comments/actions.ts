"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAudit } from "@/lib/audit";
import { getActor, type Actor } from "@/lib/auth/actor";
import { getClientTaskAccess } from "@/lib/auth/client-access";
import { canClientTransition, STATUS_CODES } from "@/lib/status";
import { createAdminClient } from "@/lib/supabase/admin";

type TaskContext = {
  taskId: string;
  title: string;
  statusCode: string;
  projectId: string;
  clientId: string;
};

async function resolveTask(
  actor: Actor,
  taskId: string,
): Promise<TaskContext | null> {
  if (actor.type === "client") {
    const access = await getClientTaskAccess(actor.id, taskId);
    if (!access) return null;
    return {
      taskId: access.taskId,
      title: access.title,
      statusCode: access.statusCode,
      projectId: access.projectId,
      clientId: access.clientId,
    };
  }

  const admin = createAdminClient();
  const { data: task } = await admin
    .from("tasks")
    .select("id, title, status_code, project_id")
    .eq("id", taskId)
    .maybeSingle();
  if (!task) return null;

  const { data: project } = await admin
    .from("projects")
    .select("id, client_id, is_demo")
    .eq("id", task.project_id)
    .maybeSingle();
  if (!project || project.is_demo) return null;

  return {
    taskId: task.id,
    title: task.title,
    statusCode: task.status_code,
    projectId: project.id,
    clientId: project.client_id,
  };
}

async function notifyOpposite(
  actor: Actor,
  context: TaskContext,
  title: string,
  body: string,
) {
  const admin = createAdminClient();

  if (actor.type === "admin") {
    await admin.from("notifications").insert({
      recipient_type: "client",
      recipient_id: context.clientId,
      type: "comment",
      title,
      body,
      task_id: context.taskId,
      project_id: context.projectId,
    });
    return;
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (profile) {
    await admin.from("notifications").insert({
      recipient_type: "admin",
      recipient_id: profile.id,
      type: "comment",
      title,
      body,
      task_id: context.taskId,
      project_id: context.projectId,
    });
  }
}

const createSchema = z.object({
  taskId: z.string().uuid(),
  body: z.string().trim().min(1, "Введите комментарий").max(5000),
  pinnedAttachmentId: z.string().uuid().nullable().optional(),
  pinX: z.number().min(0).max(100).nullable().optional(),
  pinY: z.number().min(0).max(100).nullable().optional(),
});

export async function createCommentAction(input: {
  taskId: string;
  body: string;
  pinnedAttachmentId?: string | null;
  pinX?: number | null;
  pinY?: number | null;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Проверьте комментарий",
    };
  }

  const actor = await getActor();
  if (!actor) return { ok: false, error: "Нужен вход" };

  const context = await resolveTask(actor, parsed.data.taskId);
  if (!context) return { ok: false, error: "Нет доступа к задаче" };

  const hasPin = Boolean(parsed.data.pinnedAttachmentId);
  if (hasPin) {
    if (
      parsed.data.pinX === null ||
      parsed.data.pinX === undefined ||
      parsed.data.pinY === null ||
      parsed.data.pinY === undefined
    ) {
      return { ok: false, error: "Не заданы координаты пина" };
    }

    const admin = createAdminClient();
    const { data: attachment } = await admin
      .from("attachments")
      .select("id, task_id, mime_type")
      .eq("id", parsed.data.pinnedAttachmentId as string)
      .maybeSingle();

    if (!attachment || attachment.task_id !== context.taskId) {
      return { ok: false, error: "Вложение не относится к задаче" };
    }
    if (!attachment.mime_type.startsWith("image/")) {
      return { ok: false, error: "Пин можно поставить только на изображение" };
    }
  }

  const admin = createAdminClient();
  const { data: comment, error } = await admin
    .from("comments")
    .insert({
      task_id: context.taskId,
      author_type: actor.type,
      author_id: actor.id,
      author_name: actor.name,
      body: parsed.data.body,
      pinned_attachment_id: hasPin
        ? (parsed.data.pinnedAttachmentId as string)
        : null,
      pin_x: hasPin ? parsed.data.pinX : null,
      pin_y: hasPin ? parsed.data.pinY : null,
    })
    .select("id")
    .single();

  if (error || !comment) {
    return { ok: false, error: "Не удалось сохранить комментарий" };
  }

  await notifyOpposite(
    actor,
    context,
    actor.type === "admin" ? "Новый комментарий" : "Комментарий клиента",
    parsed.data.body.slice(0, 120),
  );

  await writeAudit({
    actorType: actor.type,
    actorName: actor.name,
    action: "comment.create",
    entityType: "comment",
    entityId: comment.id,
    payload: {
      taskId: context.taskId,
      pinned: hasPin,
    },
  });

  revalidatePath(`/admin/tasks/${context.taskId}`);
  revalidatePath(`/client/tasks/${context.taskId}`);
  revalidatePath(`/demo/tasks/${context.taskId}`);
  return { ok: true, id: comment.id };
}

export async function deleteCommentAction(
  commentId: string,
): Promise<{ ok: boolean; error?: string }> {
  const parsed = z.string().uuid().safeParse(commentId);
  if (!parsed.success) return { ok: false, error: "Некорректный комментарий" };

  const actor = await getActor();
  if (!actor) return { ok: false, error: "Нужен вход" };

  const admin = createAdminClient();
  const { data: comment } = await admin
    .from("comments")
    .select("id, task_id, author_type, author_id")
    .eq("id", parsed.data)
    .maybeSingle();

  if (!comment) return { ok: false, error: "Комментарий не найден" };

  const context = await resolveTask(actor, comment.task_id);
  if (!context) return { ok: false, error: "Нет доступа к задаче" };

  if (
    actor.type === "client" &&
    !(comment.author_type === "client" && comment.author_id === actor.id)
  ) {
    return { ok: false, error: "Можно удалять только свои комментарии" };
  }

  const { data: files } = await admin
    .from("attachments")
    .select("storage_path")
    .eq("comment_id", comment.id);

  if (files && files.length > 0) {
    await admin.storage
      .from("attachments")
      .remove(files.map((file) => file.storage_path));
  }

  const { error } = await admin
    .from("comments")
    .delete()
    .eq("id", comment.id);

  if (error) return { ok: false, error: "Не удалось удалить комментарий" };

  await writeAudit({
    actorType: actor.type,
    actorName: actor.name,
    action: "comment.delete",
    entityType: "comment",
    entityId: comment.id,
    payload: { taskId: context.taskId },
  });

  revalidatePath(`/admin/tasks/${context.taskId}`);
  revalidatePath(`/client/tasks/${context.taskId}`);
  revalidatePath(`/demo/tasks/${context.taskId}`);
  return { ok: true };
}

export async function clientSetTaskStatusAction(
  taskId: string,
  status: string,
): Promise<{ ok: boolean; error?: string }> {
  const parsedTask = z.string().uuid().safeParse(taskId);
  const parsedStatus = z.enum(STATUS_CODES).safeParse(status);
  if (!parsedTask.success || !parsedStatus.success) {
    return { ok: false, error: "Некорректный статус" };
  }

  const actor = await getActor();
  if (!actor || actor.type !== "client") {
    return { ok: false, error: "Нужен вход клиента" };
  }

  const access = await getClientTaskAccess(actor.id, parsedTask.data);
  if (!access) return { ok: false, error: "Нет доступа к задаче" };

  if (!canClientTransition(access.statusCode, parsedStatus.data)) {
    return { ok: false, error: "Этот переход недоступен клиенту" };
  }

  const admin = createAdminClient();
  const { error } = await admin.rpc("change_task_status", {
    p_task_id: parsedTask.data,
    p_to_status: parsedStatus.data,
    p_actor_type: "client",
    p_actor_name: actor.name,
  });

  if (error) {
    return { ok: false, error: "Не удалось сменить статус" };
  }

  revalidatePath(`/client/projects/${access.projectId}`);
  revalidatePath(`/client/tasks/${access.taskId}`);
  revalidatePath(`/admin/tasks/${access.taskId}`);
  revalidatePath("/admin");
  return { ok: true };
}
