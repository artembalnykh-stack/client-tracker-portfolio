"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clientSetTaskStatusAction } from "@/app/comments/actions";
import { Button } from "@/components/ui/button";
import {
  CLIENT_TRANSITIONS,
  STATUS_META,
  isStatusCode,
  type StatusCode,
} from "@/lib/status";

const LABELS: Record<string, string> = {
  "waiting_client:in_progress": "Я ответил",
  "on_review:done": "Принять",
  "on_review:needs_rework": "На доработку",
};

export function ClientStatusActions({
  taskId,
  statusCode,
}: {
  taskId: string;
  statusCode: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (!isStatusCode(statusCode)) {
    return (
      <p className="text-sm text-muted-foreground">
        Для этого статуса действий нет.
      </p>
    );
  }

  const targets: readonly StatusCode[] =
    CLIENT_TRANSITIONS[statusCode] ?? [];

  if (targets.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Сейчас действий не требуется — ждём студию.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {targets.map((target) => (
        <Button
          key={target}
          type="button"
          variant={target === "needs_rework" ? "outline" : "default"}
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              const result = await clientSetTaskStatusAction(taskId, target);
              if (result.ok) {
                toast.success(`Статус: ${STATUS_META[target].label}`);
                router.refresh();
              } else {
                toast.error(result.error ?? "Не удалось сменить статус");
              }
            });
          }}
        >
          {LABELS[`${statusCode}:${target}`] ?? STATUS_META[target].label}
        </Button>
      ))}
    </div>
  );
}
