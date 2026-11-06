"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { removeRelationAction } from "@/app/admin/tasks/actions";
import { Button } from "@/components/ui/button";

export function RemoveRelationButton({
  relationId,
  taskId,
}: {
  relationId: string;
  taskId: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const result = await removeRelationAction(relationId, taskId);
          if (result.ok) {
            toast.success("Связь удалена");
            router.refresh();
          } else {
            toast.error(result.error ?? "Не удалось удалить связь");
          }
        });
      }}
    >
      Убрать
    </Button>
  );
}
