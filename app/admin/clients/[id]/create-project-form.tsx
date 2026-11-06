"use client";

import { useActionState } from "react";
import {
  createProjectAction,
  type ProjectFormState,
} from "@/app/admin/projects/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ProjectFormState = {};

export function CreateProjectForm({ clientId }: { clientId: string }) {
  const [state, formAction, pending] = useActionState(
    createProjectAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="clientId" value={clientId} />
      <div className="space-y-2">
        <Label htmlFor="project-name">Название проекта</Label>
        <Input
          id="project-name"
          name="name"
          placeholder="Например: лендинг для студии"
          maxLength={160}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="project-description">Описание</Label>
        <textarea
          id="project-description"
          name="description"
          rows={3}
          maxLength={2000}
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        />
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Создаём…" : "Создать проект"}
      </Button>
    </form>
  );
}
