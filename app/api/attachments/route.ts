import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { writeAudit } from "@/lib/audit";
import { getActor, type Actor } from "@/lib/auth/actor";
import { getClientTaskAccess } from "@/lib/auth/client-access";
import { siteUrl } from "@/lib/env.server";
import { validateUpload } from "@/lib/files";
import { rateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BODY_BYTES = 5 * 1024 * 1024;
const MAX_ATTACHMENTS = 4;

type AttachmentContext = {
  taskId: string;
  taskTitle: string;
  projectId: string;
  clientId: string;
  commentId: string | null;
};

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(siteUrl()).origin;
  } catch {
    return false;
  }
}

async function resolveContext(
  actor: Actor,
  taskId: string | null,
  commentId: string | null,
): Promise<AttachmentContext | null> {
  const admin = createAdminClient();
  let resolvedTaskId = taskId;
  let resolvedCommentId: string | null = null;

  if (commentId) {
    const { data: comment } = await admin
      .from("comments")
      .select("id, task_id")
      .eq("id", commentId)
      .maybeSingle();
    if (!comment) return null;
    resolvedTaskId = comment.task_id;
    resolvedCommentId = comment.id;
  }

  if (!resolvedTaskId) return null;

  const { data: task } = await admin
    .from("tasks")
    .select("id, title, project_id")
    .eq("id", resolvedTaskId)
    .maybeSingle();
  if (!task) return null;

  const { data: project } = await admin
    .from("projects")
    .select("id, client_id, is_demo")
    .eq("id", task.project_id)
    .maybeSingle();
  if (!project || project.is_demo) return null;

  if (actor.type === "client") {
    const access = await getClientTaskAccess(actor.id, task.id);
    if (!access) return null;
  }

  return {
    taskId: task.id,
    taskTitle: task.title,
    projectId: project.id,
    clientId: project.client_id,
    commentId: resolvedCommentId,
  };
}

async function notifyOpposite(
  actor: Actor,
  context: AttachmentContext,
  fileName: string,
) {
  const admin = createAdminClient();

  if (actor.type === "admin") {
    await admin.from("notifications").insert({
      recipient_type: "client",
      recipient_id: context.clientId,
      type: "file",
      title: "Новый файл",
      body: fileName,
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
      type: "file",
      title: "Клиент загрузил файл",
      body: fileName,
      task_id: context.taskId,
      project_id: context.projectId,
    });
  }
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return jsonError("Неверный origin запроса", 403);
  }

  const actor = await getActor();
  if (!actor) {
    return jsonError("Нужен вход", 401);
  }

  if (!rateLimit(`upload:${actor.type}:${actor.id}`, 20, 60_000)) {
    return jsonError("Слишком много загрузок. Попробуйте позже.", 429);
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return jsonError("Файл слишком большой", 413);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError("Не удалось прочитать форму", 400);
  }

  const file = formData.get("file");
  const taskIdRaw = formData.get("taskId");
  const commentIdRaw = formData.get("commentId");
  const taskId = typeof taskIdRaw === "string" ? taskIdRaw : "";
  const commentId = typeof commentIdRaw === "string" ? commentIdRaw : "";

  if (!(file instanceof File)) {
    return jsonError("Файл не передан", 400);
  }
  if (Boolean(taskId) === Boolean(commentId)) {
    return jsonError("Нужно указать задачу или комментарий", 400);
  }
  if (taskId && !z.string().uuid().safeParse(taskId).success) {
    return jsonError("Некорректная задача", 400);
  }
  if (commentId && !z.string().uuid().safeParse(commentId).success) {
    return jsonError("Некорректный комментарий", 400);
  }

  const context = await resolveContext(
    actor,
    taskId || null,
    commentId || null,
  );
  if (!context) {
    return jsonError("Нет доступа к задаче или комментарию", 404);
  }

  const admin = createAdminClient();
  const countQuery = context.commentId
    ? admin
        .from("attachments")
        .select("id", { count: "exact", head: true })
        .eq("comment_id", context.commentId)
    : admin
        .from("attachments")
        .select("id", { count: "exact", head: true })
        .eq("task_id", context.taskId);

  const { count } = await countQuery;
  if ((count ?? 0) >= MAX_ATTACHMENTS) {
    return jsonError(
      context.commentId
        ? "К комментарию уже прикреплено 4 файла"
        : "К задаче уже прикреплено 4 файла",
      400,
    );
  }

  const validated = await validateUpload(file);
  if ("error" in validated) {
    return jsonError(validated.error, 400);
  }

  const base = context.commentId ?? context.taskId;
  const storagePath = `${base}/${randomUUID()}.${validated.extension}`;
  const bucket = admin.storage.from("attachments");

  const { error: uploadError } = await bucket.upload(
    storagePath,
    new Uint8Array(validated.buffer),
    {
      contentType: validated.mimeType,
      upsert: false,
    },
  );

  if (uploadError) {
    return jsonError("Не удалось загрузить файл в Storage", 500);
  }

  const { data: attachment, error: insertError } = await admin
    .from("attachments")
    .insert({
      task_id: context.commentId ? null : context.taskId,
      comment_id: context.commentId,
      uploaded_by_type: actor.type,
      uploaded_by_name: actor.name,
      file_name: validated.displayName,
      mime_type: validated.mimeType,
      size_bytes: validated.sizeBytes,
      storage_path: storagePath,
      width: validated.width,
      height: validated.height,
    })
    .select(
      "id, task_id, comment_id, uploaded_by_type, uploaded_by_name, file_name, mime_type, size_bytes, width, height, created_at",
    )
    .single();

  if (insertError || !attachment) {
    await bucket.remove([storagePath]);
    return jsonError("Не удалось сохранить вложение", 500);
  }

  const [preview, download] = await Promise.all([
    bucket.createSignedUrl(storagePath, 3600),
    bucket.createSignedUrl(storagePath, 3600, {
      download: validated.displayName,
    }),
  ]);

  await notifyOpposite(actor, context, validated.displayName);

  await writeAudit({
    actorType: actor.type,
    actorName: actor.name,
    action: "file.upload",
    entityType: "attachment",
    entityId: attachment.id,
    payload: {
      taskId: context.taskId,
      commentId: context.commentId,
      fileName: validated.displayName,
      mimeType: validated.mimeType,
      sizeBytes: validated.sizeBytes,
    },
  });

  return NextResponse.json(
    {
      attachment,
      url: preview.error ? null : (preview.data?.signedUrl ?? null),
      downloadUrl: download.error
        ? null
        : (download.data?.signedUrl ?? null),
    },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}

export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request)) {
    return jsonError("Неверный origin запроса", 403);
  }

  const actor = await getActor();
  if (!actor) {
    return jsonError("Нужен вход", 401);
  }

  if (!rateLimit(`delete-file:${actor.type}:${actor.id}`, 30, 60_000)) {
    return jsonError("Слишком много запросов. Попробуйте позже.", 429);
  }

  let body: { id?: unknown };
  try {
    body = (await request.json()) as { id?: unknown };
  } catch {
    return jsonError("Некорректный запрос", 400);
  }

  const parsed = z.string().uuid().safeParse(body.id);
  if (!parsed.success) {
    return jsonError("Некорректное вложение", 400);
  }

  const admin = createAdminClient();
  const { data: attachment } = await admin
    .from("attachments")
    .select(
      "id, task_id, comment_id, storage_path, file_name, uploaded_by_type",
    )
    .eq("id", parsed.data)
    .maybeSingle();

  if (!attachment) {
    return jsonError("Вложение не найдено", 404);
  }

  const context = await resolveContext(
    actor,
    attachment.task_id,
    attachment.comment_id,
  );

  if (!context) {
    return jsonError("Нет доступа к вложению", 404);
  }

  if (
    actor.type === "client" &&
    attachment.uploaded_by_type !== "client"
  ) {
    return jsonError("Клиент может удалять только свои файлы", 403);
  }

  const bucket = admin.storage.from("attachments");
  const { error: removeError } = await bucket.remove([attachment.storage_path]);
  if (removeError) {
    return jsonError("Не удалось удалить файл из Storage", 500);
  }

  const { error: deleteError } = await admin
    .from("attachments")
    .delete()
    .eq("id", attachment.id);

  if (deleteError) {
    return jsonError("Не удалось удалить вложение", 500);
  }

  await writeAudit({
    actorType: actor.type,
    actorName: actor.name,
    action: "file.delete",
    entityType: "attachment",
    entityId: attachment.id,
    payload: {
      taskId: context.taskId,
      commentId: context.commentId,
      fileName: attachment.file_name,
    },
  });

  return NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
