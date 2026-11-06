import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  History,
  MessageSquare,
  Paperclip,
} from "lucide-react";
import { ClientStatusActions } from "@/app/client/tasks/[id]/client-status-actions";
import { TaskAttachments } from "@/app/admin/tasks/[id]/task-attachments";
import { TaskComments } from "@/components/task-comments";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getClientSession } from "@/lib/auth/client-session";
import { formatDate, formatDateTime, isOverdue } from "@/lib/format";
import { priorityColor, priorityLabel } from "@/lib/priority";
import { statusColor, statusLabel } from "@/lib/status";
import {
  listTaskAttachments,
  signedAttachmentUrls,
} from "@/lib/repositories/attachments";
import {
  listCommentAttachments,
  listTaskComments,
} from "@/lib/repositories/comments";
import { getClientTaskDetail } from "@/lib/repositories/client-portal";
import { listTaskHistory } from "@/lib/repositories/tasks";

export const metadata: Metadata = {
  title: "Задача — Neyroflow",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ClientTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const client = await getClientSession();
  if (!client) return null;

  const { id } = await params;
  const detail = await getClientTaskDetail(client.id, id);
  if (!detail) notFound();

  const [attachmentRows, comments, history] = await Promise.all([
    listTaskAttachments(detail.task.id),
    listTaskComments(detail.task.id),
    listTaskHistory(detail.task.id),
  ]);

  const attachments = await Promise.all(
    attachmentRows.map(async (row) => {
      const urls = await signedAttachmentUrls(
        row.storage_path,
        row.file_name,
      );
      return {
        id: row.id,
        fileName: row.file_name,
        mimeType: row.mime_type,
        sizeBytes: row.size_bytes,
        width: row.width,
        height: row.height,
        url: urls.url,
        downloadUrl: urls.downloadUrl,
        uploadedByName: row.uploaded_by_name,
        uploadedByType: row.uploaded_by_type,
        createdAt: row.created_at,
      };
    }),
  );

  const commentFiles = await listCommentAttachments(
    comments.map((comment) => comment.id),
  );
  const commentAttachments = await Promise.all(
    commentFiles.map(async (row) => {
      const urls = await signedAttachmentUrls(
        row.storage_path,
        row.file_name,
      );
      return {
        id: row.id,
        commentId: row.comment_id,
        fileName: row.file_name,
        mimeType: row.mime_type,
        sizeBytes: row.size_bytes,
        width: row.width,
        height: row.height,
        url: urls.url,
        downloadUrl: urls.downloadUrl,
        createdAt: row.created_at,
      };
    }),
  );

  const filesByComment = new Map<string, typeof commentAttachments>();
  for (const file of commentAttachments) {
    if (!file.commentId) continue;
    const list = filesByComment.get(file.commentId) ?? [];
    list.push(file);
    filesByComment.set(file.commentId, list);
  }

  const commentsForUi = comments.map((comment) => ({
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

  const pinImages = attachments
    .filter(
      (attachment) =>
        attachment.mimeType.startsWith("image/") && attachment.url,
    )
    .map((attachment) => ({
      id: attachment.id,
      fileName: attachment.fileName,
      url: attachment.url as string,
      width: attachment.width,
      height: attachment.height,
    }));

  const overdue = isOverdue(detail.task.deadline) && detail.task.status_code !== "done";

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/client/projects/${detail.task.project_id}`}
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "mb-3 -ml-2 gap-1",
          })}
        >
          <ArrowLeft className="size-3.5" /> К проекту
        </Link>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          Задача
        </p>
        <h1 className="mt-2 font-heading text-3xl font-extrabold tracking-tight">
          {detail.task.title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {detail.projectName} · {detail.clientName}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card className="border-border/70 bg-card/70">
            <CardHeader>
              <h2 className="font-heading text-lg font-bold">Описание</h2>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {detail.task.description || "Описание пока не добавлено."}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/70">
            <CardHeader>
              <h2 className="inline-flex items-center gap-2 font-heading text-lg font-bold">
                <Paperclip className="size-4" /> Файлы
              </h2>
            </CardHeader>
            <CardContent>
              <TaskAttachments
                taskId={detail.task.id}
                items={attachments}
                deleteMode="client"
              />
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/70">
            <CardHeader>
              <h2 className="inline-flex items-center gap-2 font-heading text-lg font-bold">
                <MessageSquare className="size-4" /> Комментарии и пины
              </h2>
            </CardHeader>
            <CardContent>
              <TaskComments
                taskId={detail.task.id}
                images={pinImages}
                comments={commentsForUi}
                actor={{
                  type: "client",
                  id: client.id,
                  name: client.name,
                }}
              />
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/70">
            <CardHeader>
              <h2 className="inline-flex items-center gap-2 font-heading text-lg font-bold">
                <History className="size-4" /> История
              </h2>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  История пока пуста.
                </p>
              ) : (
                <ol className="space-y-3">
                  {history.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex flex-wrap items-center gap-2 text-sm"
                    >
                      <span className="text-muted-foreground">
                        {entry.from_status
                          ? statusLabel(entry.from_status)
                          : "Создана"}
                      </span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium">
                        {statusLabel(entry.to_status)}
                      </span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {formatDateTime(entry.created_at)}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-primary/25 bg-primary/5">
            <CardHeader className="pb-2">
              <h2 className="font-heading text-base font-bold">Действия</h2>
            </CardHeader>
            <CardContent>
              <ClientStatusActions
                taskId={detail.task.id}
                statusCode={detail.task.status_code}
              />
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/70">
            <CardHeader className="pb-2">
              <h2 className="font-heading text-base font-bold">Детали</h2>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Статус</span>
                <Badge variant="outline" className="gap-1.5 border-border/70">
                  <span
                    className="size-1.5 rounded-full"
                    style={{
                      backgroundColor: statusColor(detail.task.status_code),
                    }}
                  />
                  {statusLabel(detail.task.status_code)}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Приоритет</span>
                <Badge variant="outline" className="gap-1.5 border-border/70">
                  <span
                    className="size-1.5 rounded-full"
                    style={{ backgroundColor: priorityColor(detail.task.priority) }}
                  />
                  {priorityLabel(detail.task.priority)}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Дедлайн</span>
                <span
                  className={
                    overdue ? "inline-flex items-center gap-1 text-destructive" : ""
                  }
                >
                  <CalendarDays className="size-3.5" />
                  {detail.task.deadline
                    ? formatDate(detail.task.deadline)
                    : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Проект</span>
                <span className="max-w-[170px] truncate text-right">
                  {detail.projectName}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
