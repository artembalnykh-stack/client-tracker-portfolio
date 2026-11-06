"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setTaskStatusAction } from "@/app/admin/tasks/actions";
import { STATUS_CODES, STATUS_META } from "@/lib/status";

export function TaskStatusSelect({
  taskId,
  value,
}: {
  taskId: string;
  value: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <select
      key={value}
      aria-label="Статус задачи"
      defaultValue={value}
      disabled={pending}
      className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"
      onChange={(event) => {
        const next = event.target.value;
        const previous = value;
        startTransition(async () => {
          const result = await setTaskStatusAction(taskId, next);
          if (result.ok) {
            toast.success("Статус обновлён");
            router.refresh();
          } else {
            event.target.value = previous;
            toast.error(result.error ?? "Не удалось сменить статус");
          }
        });
      }}
    >
      {STATUS_CODES.map((status) => (
        <option key={status} value={status}>
          {STATUS_META[status].label}
        </option>
      ))}
    </select>
  );
}
