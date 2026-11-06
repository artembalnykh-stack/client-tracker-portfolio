import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { writeAudit } from "@/lib/audit";
import { getCurrentAdmin } from "@/lib/auth/require-admin";
import { validateUpload } from "@/lib/files";
import { rateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/env.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BODY_BYTES = 5 * 1024 * 1024;
const MAX_ATTACHMENTS = 4;

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

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return jsonError("Неверный origin запроса", 403);
  }

  const user = await getCurrentAdmin();
  if (!user) {
    return jsonError("Нужен вход админа", 401);
  }

  if (!rateLimit(`upload:${user.id}`, 20, 60_000)) {
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
  const taskId =
    typeof taskIdRaw === "string" ? taskIdRaw : "";

  if (!(file instanceof File)) {
    return jsonError("Файл не передан", 400);
  }
  if (!z.string().uuid().safeParse(taskId).success) {
    return jsonError("Некорректная задача", 400);
  }

  const admin = createAdminClient();

  const { data: task } = await admin
    .from("tasks")
    .select("id, project_id, title")
    .eq("id", taskId)
    .maybeSingle();

  if (!task) {
    return jsonError("Задача не найдена", 404);
  }

  const { data: project } = await admin
    .from("projects")
    .select("id, client_id, is_demo")
    .eq("id", task.project_id)
    .maybeSingle();

  if (!project || project.is_demo) {
    return jsonError("В демо-задачу нельзя загружать файлы", 400);
  }

  const { count } = await admin
    .from("attachments")
    .select("id", { count: "exact", head: true })
    .eq("task_id", taskId);

  if ((count ?? 0) >= MAX_ATTACHMENTS) {
    return jsonError("К задаче уже прикреплено 4 файла", 400);
  }

  const validated = await validateUpload(file);
  if ("error" in validated) {
    return jsonError(validated.error, 400);
  }

  const storagePath = `${taskId}/${randomUUID()}.${validated.extension}`;
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
      task_id: taskId,
      comment_id: null,
      uploaded_by_type: "admin",
      uploaded_by_name: user.email ?? "Админ",
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

  if (project.client_id) {
    await admin.from("notifications").insert({
      recipient_type: "client",
      recipient_id: project.client_id,
      type: "file",
      title: "Новый файл",
      body: validated.displayName,
      task_id: taskId,
      project_id: project.id,
    });
  }

  await writeAudit({
    actorType: "admin",
    actorName: user.email ?? "Админ",
    action: "file.upload",
    entityType: "attachment",
    entityId: attachment.id,
    payload: {
      taskId,
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

  const user = await getCurrentAdmin();
  if (!user) {
    return jsonError("Нужен вход админа", 401);
  }

  if (!rateLimit(`delete-file:${user.id}`, 30, 60_000)) {
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
    .select("id, storage_path, file_name, task_id, comment_id")
    .eq("id", parsed.data)
    .maybeSingle();

  if (!attachment) {
    return jsonError("Вложение не найдено", 404);
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
    actorType: "admin",
    actorName: user.email ?? "Админ",
    action: "file.delete",
    entityType: "attachment",
    entityId: attachment.id,
    payload: {
      taskId: attachment.task_id,
      commentId: attachment.comment_id,
      fileName: attachment.file_name,
    },
  });

  return NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
