"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteTaskAction } from "@/app/admin/tasks/actions";
import { Button } from "@/components/ui/button";

export function DeleteTaskButton({ taskId }: { taskId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function remove() {
    startTransition(async () => {
      const result = await deleteTaskAction(taskId);
      if (result.ok) {
        toast.success("Задача удалена");
        router.push("/admin");
        router.refresh();
      } else {
        toast.error(result.error ?? "Не удалось удалить задачу");
        setConfirming(false);
      }
    });
  }

  if (confirming) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Удалить задачу?</span>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={pending}
          onClick={remove}
        >
          {pending ? "Удаляем…" : "Да, удалить"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => setConfirming(false)}
        >
          Отмена
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      onClick={() => setConfirming(true)}
    >
      Удалить задачу
    </Button>
  );
}
