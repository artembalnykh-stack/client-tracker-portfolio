import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ClientBoard } from "@/components/client/client-board";
import { buttonVariants } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import {
  getDemoProject,
  listDemoProjectTasks,
} from "@/lib/repositories/demo";

export const dynamic = "force-dynamic";

export default async function DemoProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getDemoProject(id);
  if (!project) notFound();

  const tasks = await listDemoProjectTasks(project.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
      <div>
        <Link
          href="/demo"
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "mb-3 -ml-2 gap-1",
          })}
        >
          <ArrowLeft className="size-3.5" /> Все проекты
        </Link>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          {project.clientName}
        </p>
        <h1 className="mt-2 font-heading text-3xl font-extrabold tracking-tight">
          {project.name}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {project.description || "Описание проекта."}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {tasks.length} задач · с {formatDate(project.created_at)}
        </p>
      </div>

      <div className="mt-8">
        <ClientBoard tasks={tasks} taskBasePath="/demo/tasks" />
      </div>
    </div>
  );
}
