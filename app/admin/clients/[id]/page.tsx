import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, FolderKanban, Mail } from "lucide-react";
import { InvitePanel } from "@/app/admin/clients/[id]/invite-panel";
import { CreateProjectForm } from "@/app/admin/clients/[id]/create-project-form";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { getInviteStatus } from "@/lib/invites";
import {
  getClientById,
  listProjectsForClient,
} from "@/lib/repositories/clients";

export const metadata: Metadata = {
  title: "Клиент — Neyroflow",
};

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClientById(id);
  if (!client) notFound();

  const projects = await listProjectsForClient(client.id);
  const activeInvite =
    getInviteStatus(
      client.invite_token_hash,
      client.invite_expires_at,
      client.invite_revoked_at,
    ) === "active";

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/clients"
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "mb-3 -ml-2 gap-1",
          })}
        >
          <ArrowLeft className="size-3.5" /> К клиентам
        </Link>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          Клиент
        </p>
        <h1 className="mt-2 font-heading text-3xl font-extrabold tracking-tight">
          {client.name}
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <Card className="border-border/70 bg-card/70">
            <CardHeader>
              <h2 className="font-heading text-lg font-bold">Контакты</h2>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="size-4" />
                {client.company || "Компания не указана"}
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Mail className="size-4" />
                {client.email || "Email не указан"}
              </p>
              <p className="text-xs text-muted-foreground">
                В базе с {formatDate(client.created_at)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/70">
            <CardHeader>
              <h2 className="inline-flex items-center gap-2 font-heading text-lg font-bold">
                <FolderKanban className="size-4" /> Проекты
              </h2>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Проектов пока нет. Создайте первый ниже.
                </p>
              ) : (
                <ul className="divide-y divide-border/60">
                  {projects.map((project) => (
                    <li key={project.id} className="py-3">
                      <p className="font-medium">{project.name}</p>
                      {project.description ? (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {project.description}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4 border-t border-border/60 pt-4">
                <p className="mb-3 text-sm font-medium">Новый проект</p>
                <CreateProjectForm clientId={client.id} />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit border-border/70 bg-card/70">
          <CardHeader>
            <h2 className="font-heading text-lg font-bold">Доступ клиента</h2>
            <p className="text-sm text-muted-foreground">
              Одна ссылка — вход в портал без пароля.
            </p>
          </CardHeader>
          <CardContent>
            <InvitePanel
              clientId={client.id}
              active={activeInvite}
              expiresAt={client.invite_expires_at}
              revokedAt={client.invite_revoked_at}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
