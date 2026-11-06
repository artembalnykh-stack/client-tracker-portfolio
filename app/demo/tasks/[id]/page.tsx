import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  History,
  MessageSquare,
  Paperclip,
} from "lucide-react";
import { TaskAttachments } from "@/app/admin/tasks/[id]/task-attachments";
import { TaskComments } from "@/components/task-comments";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatDate, formatDateTime, isOverdue } from "@/lib/format";
import { priorityColor, priorityLabel } from "@/lib/priority";
import { statusColor, statusLabel } from "@/lib/status";
import {
  getDemoTaskContext,
  listDemoAttachments,
  listDemoComments,
  listDemoHistory,
} from "@/lib/repositories/demo";

export const dynamic = "force-dynamic";

export default async function DemoTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await getDemoTaskContext(id);
  if (!context) notFound();

  const [attachments, comments, history] = await Promise.all([
    listDemoAttachments(context.task.id),
    listDemoComments(context.task.id),
    listDemoHistory(context.task.id),
  ]);

  const pinImages = attachments
    .filter((attachment) => attachment.mimeType.startsWith("image/"))
    .map((attachment) => ({
      id: attachment.id,
      fileName: attachment.fileName,
      url: attachment.url,
      width: attachment.width,
      height: attachment.height,
    }));

  const overdue =
    isOverdue(context.task.deadline) && context.task.status_code !== "done";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-14">
      <div>
        <Link
          href={`/demo/projects/${context.projectId}`}
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "mb-3 -ml-2 gap-1",
          })}
        >
          <ArrowLeft className="size-3.5" /> К проекту
        </Link>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          Демо-задача
        </p>
        <h1 className="mt-2 font-heading text-3xl font-extrabold tracking-tight">
          {context.task.title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {context.projectName} · {context.clientName}
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <Card className="border-border/70 bg-card/70">
            <CardHeader>
              <h2 className="font-heading text-lg font-bold">Описание</h2>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {context.task.description || "Описание пока не добавлено."}
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
                taskId={context.task.id}
                items={attachments}
                readOnly
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
                taskId={context.task.id}
                images={pinImages}
                comments={comments}
                actor={null}
                readOnly
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
                        {entry.changed_by_name || "Демо"} ·{" "}
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
                      backgroundColor: statusColor(context.task.status_code),
                    }}
                  />
                  {statusLabel(context.task.status_code)}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Приоритет</span>
                <Badge variant="outline" className="gap-1.5 border-border/70">
                  <span
                    className="size-1.5 rounded-full"
                    style={{
                      backgroundColor: priorityColor(context.task.priority),
                    }}
                  />
                  {priorityLabel(context.task.priority)}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Дедлайн</span>
                <span
                  className={
                    overdue
                      ? "inline-flex items-center gap-1 text-destructive"
                      : "inline-flex items-center gap-1"
                  }
                >
                  <CalendarDays className="size-3.5" />
                  {context.task.deadline
                    ? formatDate(context.task.deadline)
                    : "—"}
                </span>
              </div>
              <div className="border-t border-border/60 pt-2 text-xs text-muted-foreground">
                Демо-режим: только чтение.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
