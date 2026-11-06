import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FolderKanban, Plus } from "lucide-react";
import { CreateClientForm } from "@/app/admin/clients/create-client-form";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { getInviteStatus } from "@/lib/invites";
import {
  countProjectsByClient,
  listClients,
  type AdminClientRow,
} from "@/lib/repositories/clients";

export const metadata: Metadata = {
  title: "Клиенты — Neyroflow",
};

export const dynamic = "force-dynamic";

function inviteBadge(client: AdminClientRow) {
  const status = getInviteStatus(
    client.invite_token_hash,
    client.invite_expires_at,
    client.invite_revoked_at,
  );

  switch (status) {
    case "active":
      return { label: "Активен", variant: "default" as const };
    case "revoked":
      return { label: "Отозван", variant: "destructive" as const };
    case "expired":
      return { label: "Истёк", variant: "outline" as const };
    default:
      return { label: "Без инвайта", variant: "secondary" as const };
  }
}

export default async function ClientsPage() {
  const [clients, projectCounts] = await Promise.all([
    listClients(),
    countProjectsByClient(),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            Клиенты
          </p>
          <h1 className="mt-2 font-heading text-3xl font-extrabold tracking-tight">
            Клиенты и доступы
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Создай клиента и выдай инвайт-ссылку. Пароль не нужен: клиент
            входит по ссылке, срок — 30 дней.
          </p>
        </div>
      </div>

      <Card className="border-border/70 bg-card/70">
        <CardHeader>
          <h2 className="inline-flex items-center gap-2 font-heading text-lg font-bold">
            <Plus className="size-4" /> Новый клиент
          </h2>
        </CardHeader>
        <CardContent>
          <CreateClientForm />
        </CardContent>
      </Card>

      <div className="space-y-3">
        {clients.length === 0 ? (
          <Card className="border-dashed border-border/70 bg-card/40">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Пока нет клиентов. Создай первого — и появится инвайт-ссылка.
            </CardContent>
          </Card>
        ) : (
          clients.map((client) => {
            const badge = inviteBadge(client);
            const projects = projectCounts.get(client.id) ?? 0;

            return (
              <Card
                key={client.id}
                className="border-border/70 bg-card/70 transition-colors hover:border-primary/35"
              >
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/clients/${client.id}`}
                        className="font-heading text-lg font-bold hover:text-primary"
                      >
                        {client.name}
                      </Link>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {client.company || "Без компании"}
                      {client.email ? ` · ${client.email}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Создан {formatDate(client.created_at)}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                      <FolderKanban className="size-4" /> {projects}
                    </span>
                    <Link
                      href={`/admin/clients/${client.id}`}
                      className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                        className: "gap-1",
                      })}
                    >
                      Открыть <ArrowLeft className="size-3.5 rotate-180" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
