"use client";

import { useActionState } from "react";
import {
  issueInviteAction,
  revokeInviteAction,
  type InviteState,
} from "@/app/admin/clients/actions";
import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/format";

const initialState: InviteState = {};

export function InvitePanel({
  clientId,
  active,
  expiresAt,
  revokedAt,
}: {
  clientId: string;
  active: boolean;
  expiresAt: string | null;
  revokedAt: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    issueInviteAction,
    initialState,
  );

  const status = active
    ? `Инвайт активен до ${formatDate(expiresAt)}`
    : revokedAt
      ? `Инвайт отозван ${formatDate(revokedAt)}`
      : "Инвайта ещё нет";

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{status}</p>

      <form action={formAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="clientId" value={clientId} />
        <Button type="submit" disabled={pending}>
          {pending
            ? "Готовим…"
            : active
              ? "Перевыпустить инвайт"
              : "Создать инвайт"}
        </Button>
        <span className="text-xs text-muted-foreground">
          Срок — 30 дней, ссылка показывается один раз.
        </span>
      </form>

      {active ? (
        <form action={revokeInviteAction}>
          <input type="hidden" name="clientId" value={clientId} />
          <Button type="submit" variant="outline" size="sm">
            Отозвать инвайт
          </Button>
        </form>
      ) : null}

      {state.error ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      ) : null}

      {state.link ? (
        <div className="space-y-2 rounded-xl border border-primary/25 bg-primary/5 p-3">
          <p className="text-xs font-medium text-primary">
            Ссылка создана. Скопируйте сейчас — в базе хранится только хеш.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input readOnly value={state.link} className="font-mono text-xs" />
            <CopyButton value={state.link} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
