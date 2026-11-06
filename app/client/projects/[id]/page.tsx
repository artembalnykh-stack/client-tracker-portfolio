import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ClientBoard } from "@/components/client/client-board";
import { buttonVariants } from "@/components/ui/button";
import { getClientSession } from "@/lib/auth/client-session";
import {
  listClientProjectTasks,
  getClientProject,
} from "@/lib/repositories/client-portal";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Проект — Neyroflow",
  robots: { index: false, follow: false },
};

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

  const tasks = await listClientProjectTasks(client.id, project.id);

  return (
    <div className="space-y-6">
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
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {project.description || "Описание появится позже."}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Создан {formatDate(project.created_at)}
        </p>
      </div>

      <ClientBoard tasks={tasks} />
    </div>
  );
}
