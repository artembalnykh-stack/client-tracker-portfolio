"use client";

import { useActionState } from "react";
import {
  createClientAction,
  type ClientFormState,
} from "@/app/admin/clients/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ClientFormState = {};

export function CreateClientForm() {
  const [state, formAction, pending] = useActionState(
    createClientAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="client-name">Имя клиента</Label>
          <Input
            id="client-name"
            name="name"
            placeholder="Анна Смирнова"
            required
            maxLength={120}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="client-company">Компания</Label>
          <Input
            id="client-company"
            name="company"
            placeholder="Студия «Вектор»"
            maxLength={120}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="client-email">Email</Label>
        <Input
          id="client-email"
          name="email"
          type="email"
          placeholder="client@example.test"
          maxLength={200}
        />
        <p className="text-xs text-muted-foreground">
          Необязательно. Не используйте реальные ПДн в демо-данных.
        </p>
      </div>

      {state.error ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Создаём…" : "Создать клиента"}
      </Button>
    </form>
  );
}
