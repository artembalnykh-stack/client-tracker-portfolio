import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FolderKanban } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getClientSession } from "@/lib/auth/client-session";
import { getClientProject } from "@/lib/repositories/client-portal";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ClientProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const client = await getClientSession();
  if (!client) return null;

  const { id } = await params;
  const project = await getClientProject(client.id, id);
  if (!project) notFound();

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/client"
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "mb-3 -ml-2 gap-1",
          })}
        >
          <ArrowLeft className="size-3.5" /> Мои проекты
        </Link>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          Проект
        </p>
        <h1 className="mt-2 font-heading text-3xl font-extrabold tracking-tight">
          {project.name}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Создан {formatDate(project.created_at)}
        </p>
      </div>

      <Card className="border-border/70 bg-card/70">
        <CardHeader>
          <h2 className="inline-flex items-center gap-2 font-heading text-lg font-bold">
            <FolderKanban className="size-4 text-primary" /> О проекте
          </h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {project.description || "Описание появится позже."}
          </p>
          <p className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
            Доска, задачи и комментарии с пинами появятся на Stage 4. Сейчас
            портал уже проверяет доступ и изоляцию клиентов.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
