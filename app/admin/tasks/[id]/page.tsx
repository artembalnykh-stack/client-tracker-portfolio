import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  GitBranch,
  History,
  Paperclip,
  Pencil,
} from "lucide-react";
import { AddRelationForm } from "@/app/admin/tasks/[id]/add-relation-form";
import { DeleteTaskButton } from "@/app/admin/tasks/[id]/delete-task-button";
import { RemoveRelationButton } from "@/app/admin/tasks/[id]/remove-relation-button";
import { TaskAttachments } from "@/app/admin/tasks/[id]/task-attachments";
import { TaskStatusSelect } from "@/app/admin/tasks/[id]/task-status-select";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getClientById } from "@/lib/repositories/clients";
import {
  getProjectById,
} from "@/lib/repositories/projects";
import {
  getTaskById,
  getTaskRelations,
  listProjectTasks,
  listTaskHistory,
} from "@/lib/repositories/tasks";
import {
  listTaskAttachments,
  signedAttachmentUrls,
} from "@/lib/repositories/attachments";
import { formatDate, formatDateTime, isOverdue } from "@/lib/format";
import { priorityColor, priorityLabel } from "@/lib/priority";
import { statusColor, statusLabel } from "@/lib/status";

export const metadata: Metadata = {
  title: "Задача — Neyroflow",
};

export const dynamic = "force-dynamic";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const task = await getTaskById(id);
  if (!task) notFound();

  const [project, relations, history, projectTasks, attachmentRows] =
    await Promise.all([
      getProjectById(task.project_id),
      getTaskRelations(task.id),
      listTaskHistory(task.id),
      listProjectTasks(task.project_id),
      listTaskAttachments(task.id),
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
        createdAt: row.created_at,
      };
    }),
  );

  const client = project ? await getClientById(project.client_id) : null;
  const linkedIds = new Set([
    task.id,
    ...relations.children.map((child) => child.task.id),
  ]);
  const relationOptions = projectTasks.filter(
    (option) => !linkedIds.has(option.id),
  );

  const overdue = isOverdue(task.deadline) && task.status_code !== "done";

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin"
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "mb-3 -ml-2 gap-1",
          })}
        >
          <ArrowLeft className="size-3.5" /> К доске
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              Задача
            </p>
            <h1 className="mt-2 font-heading text-3xl font-extrabold tracking-tight">
              {task.title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {project?.name ?? "Без проекта"}
              {client ? ` · ${client.name}` : ""}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Link
              href={`/admin/tasks/${task.id}/edit`}
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "gap-1",
              })}
            >
              <Pencil className="size-3.5" /> Редактировать
            </Link>
            <DeleteTaskButton taskId={task.id} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card className="border-border/70 bg-card/70">
            <CardHeader>
              <h2 className="font-heading text-lg font-bold">Описание</h2>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {task.description || "Описание пока не добавлено."}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/70">
            <CardHeader>
              <h2 className="inline-flex items-center gap-2 font-heading text-lg font-bold">
                <GitBranch className="size-4" /> Связи
              </h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Родительская задача
                </p>
                {relations.parent ? (
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2">
                    <Link
                      href={`/admin/tasks/${relations.parent.task.id}`}
                      className="min-w-0 truncate text-sm hover:text-primary"
                    >
                      {relations.parent.task.title}
                    </Link>
                    <RemoveRelationButton
                      relationId={relations.parent.relationId}
                      taskId={task.id}
                    />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Нет. Родителя можно назначить со стороны родительской задачи.
                  </p>
                )}
              </div>

              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Дочерние задачи
                </p>
                {relations.children.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Пока нет дочерних задач.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {relations.children.map((child) => (
                      <li
                        key={child.relationId}
                        className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2"
                      >
                        <Link
                          href={`/admin/tasks/${child.task.id}`}
                          className="min-w-0 truncate text-sm hover:text-primary"
                        >
                          {child.task.title}
                        </Link>
                        <RemoveRelationButton
                          relationId={child.relationId}
                          taskId={task.id}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="border-t border-border/60 pt-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Добавить дочернюю
                </p>
                <AddRelationForm
                  parentTaskId={task.id}
                  options={relationOptions}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/70">
            <CardHeader>
              <h2 className="inline-flex items-center gap-2 font-heading text-lg font-bold">
                <History className="size-4" /> История статусов
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
                        {entry.changed_by_name || entry.changed_by_type} ·{" "}
                        {formatDateTime(entry.created_at)}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/70">
            <CardHeader>
              <h2 className="inline-flex items-center gap-2 font-heading text-lg font-bold">
                <Paperclip className="size-4" /> Файлы
              </h2>
            </CardHeader>
            <CardContent>
              <TaskAttachments taskId={task.id} items={attachments} />
            </CardContent>
          </Card>

          <Card className="border-dashed border-border/70 bg-card/40">
            <CardContent className="py-6 text-sm text-muted-foreground">
              Комментарии и пины на изображениях появятся на Stage 4.
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-border/70 bg-card/70">
            <CardHeader className="pb-2">
              <h2 className="font-heading text-base font-bold">Статус</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <TaskStatusSelect taskId={task.id} value={task.status_code} />
              <div className="flex items-center gap-2">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: statusColor(task.status_code) }}
                />
                <span className="text-sm text-muted-foreground">
                  {statusLabel(task.status_code)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/70">
            <CardHeader className="pb-2">
              <h2 className="font-heading text-base font-bold">Детали</h2>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Приоритет</span>
                <Badge variant="outline" className="gap-1.5 border-border/70">
                  <span
                    className="size-1.5 rounded-full"
                    style={{ backgroundColor: priorityColor(task.priority) }}
                  />
                  {priorityLabel(task.priority)}
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
                  {task.deadline ? formatDate(task.deadline) : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Проект</span>
                <span className="max-w-[180px] truncate text-right">
                  {project?.name ?? "—"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Клиент</span>
                <span className="max-w-[180px] truncate text-right">
                  {client?.name ?? "—"}
                </span>
              </div>
              <div className="border-t border-border/60 pt-2 text-xs text-muted-foreground">
                Создана {formatDateTime(task.created_at)}
                <br />
                Обновлена {formatDateTime(task.updated_at)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
