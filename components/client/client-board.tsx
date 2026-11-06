import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate, isOverdue } from "@/lib/format";
import { priorityColor, priorityLabel } from "@/lib/priority";
import { STATUS_CODES, STATUS_META } from "@/lib/status";
import type { ClientTask } from "@/lib/repositories/client-portal";
import { cn } from "@/lib/utils";

export function ClientBoard({
  tasks,
  taskBasePath = "/client/tasks",
}: {
  tasks: ClientTask[];
  taskBasePath?: string;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {STATUS_CODES.map((status) => {
        const columnTasks = tasks
          .filter((task) => task.status_code === status)
          .sort(
            (a, b) =>
              a.position - b.position ||
              a.created_at.localeCompare(b.created_at),
          );

        return (
          <section
            key={status}
            className="flex w-[270px] shrink-0 flex-col rounded-2xl border border-border/70 bg-card/40 p-2"
          >
            <header className="flex items-center justify-between px-1 py-2 text-sm">
              <span className="inline-flex items-center gap-2 font-medium">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: STATUS_META[status].color }}
                />
                {STATUS_META[status].label}
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {columnTasks.length}
              </span>
            </header>

            <div className="flex min-h-24 flex-col gap-2">
              {columnTasks.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border/70 px-3 py-6 text-center text-xs text-muted-foreground">
                  Пусто
                </p>
              ) : (
                columnTasks.map((task) => (
                  <Link
                    key={task.id}
                    href={`${taskBasePath}/${task.id}`}
                    aria-label={`${task.title} — открыть задачу`}
                    className="rounded-xl border border-border/70 border-l-2 bg-card/80 p-3 shadow-sm transition-colors hover:border-primary/40"
                    style={{ borderLeftColor: priorityColor(task.priority) }}
                  >
                    <p className="line-clamp-2 text-sm font-medium leading-snug">
                      {task.title}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className="gap-1 border-border/70 text-[10px]"
                      >
                        <span
                          className="size-1.5 rounded-full"
                          style={{ backgroundColor: priorityColor(task.priority) }}
                        />
                        {priorityLabel(task.priority)}
                      </Badge>
                      {task.deadline ? (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-[11px]",
                            isOverdue(task.deadline) &&
                              task.status_code !== "done"
                              ? "text-destructive"
                              : "text-muted-foreground",
                          )}
                        >
                          <CalendarDays className="size-3" />
                          {formatDate(task.deadline)}
                        </span>
                      ) : null}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
