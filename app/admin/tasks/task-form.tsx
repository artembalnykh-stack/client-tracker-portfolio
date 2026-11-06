"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  saveTaskAction,
  type TaskFormState,
} from "@/app/admin/tasks/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PRIORITIES, PRIORITY_META } from "@/lib/priority";
import { STATUS_CODES, STATUS_META } from "@/lib/status";
import type { AdminTaskRow, ProjectOption } from "@/lib/types";

const initialState: TaskFormState = {};

export function TaskForm({
  projects,
  task,
}: {
  projects: ProjectOption[];
  task?: AdminTaskRow | null;
}) {
  const [state, formAction, pending] = useActionState(
    saveTaskAction,
    initialState,
  );

  if (projects.length === 0) {
    return (
      <div className="rounded-xl border border-border/70 bg-card/50 p-6 text-sm text-muted-foreground">
        Сначала создайте проект у клиента.{" "}
        <Link href="/admin/clients" className="text-primary hover:underline">
          Перейти к клиентам
        </Link>
        .
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="taskId" value={task?.id ?? ""} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="task-project">Проект</Label>
          <select
            id="task-project"
            name="project_id"
            defaultValue={task?.project_id ?? projects[0]?.id}
            required
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.client_name} · {project.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="task-priority">Приоритет</Label>
          <select
            id="task-priority"
            name="priority"
            defaultValue={task?.priority ?? "normal"}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {PRIORITY_META[priority].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="task-title">Название</Label>
        <Input
          id="task-title"
          name="title"
          defaultValue={task?.title ?? ""}
          placeholder="Например: сверстать hero-секцию"
          maxLength={200}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="task-description">Описание</Label>
        <textarea
          id="task-description"
          name="description"
          defaultValue={task?.description ?? ""}
          rows={6}
          maxLength={5000}
          placeholder="Что нужно сделать, детали, ссылки"
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="task-deadline">Дедлайн</Label>
          <Input
            id="task-deadline"
            name="deadline"
            type="date"
            defaultValue={task?.deadline ?? ""}
          />
        </div>

        {!task ? (
          <div className="space-y-2">
            <Label htmlFor="task-status">Статус</Label>
            <select
              id="task-status"
              name="status_code"
              defaultValue="new"
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {STATUS_CODES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_META[status].label}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      {state.error ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Сохраняем…"
            : task
              ? "Сохранить изменения"
              : "Создать задачу"}
        </Button>
        <Link
          href={task ? `/admin/tasks/${task.id}` : "/admin"}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Отмена
        </Link>
      </div>
    </form>
  );
}
