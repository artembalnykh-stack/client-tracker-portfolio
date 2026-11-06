"use client";

import { useActionState } from "react";
import {
  addRelationAction,
  type RelationState,
} from "@/app/admin/tasks/actions";
import { Button } from "@/components/ui/button";
import type { TaskOption } from "@/lib/types";

const initialState: RelationState = {};

export function AddRelationForm({
  parentTaskId,
  options,
}: {
  parentTaskId: string;
  options: TaskOption[];
}) {
  const [state, formAction, pending] = useActionState(
    addRelationAction,
    initialState,
  );

  if (options.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        В проекте пока нет других задач.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="parentTaskId" value={parentTaskId} />
      <select
        name="childTaskId"
        required
        defaultValue=""
        className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <option value="" disabled>
          Выберите дочернюю задачу
        </option>
        {options.map((task) => (
          <option key={task.id} value={task.id}>
            {task.title}
          </option>
        ))}
      </select>

      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? "Добавляем…" : "Добавить связь"}
      </Button>
    </form>
  );
}
