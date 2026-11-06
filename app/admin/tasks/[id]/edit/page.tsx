import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { TaskForm } from "@/app/admin/tasks/task-form";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listAdminProjects } from "@/lib/repositories/projects";
import { getTaskById } from "@/lib/repositories/tasks";

export const metadata: Metadata = {
  title: "Редактирование задачи — Neyroflow",
};

export const dynamic = "force-dynamic";

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [task, projects] = await Promise.all([
    getTaskById(id),
    listAdminProjects(),
  ]);

  if (!task) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/admin/tasks/${task.id}`}
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "mb-3 -ml-2 gap-1",
          })}
        >
          <ArrowLeft className="size-3.5" /> К задаче
        </Link>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          Задача
        </p>
        <h1 className="mt-2 font-heading text-3xl font-extrabold tracking-tight">
          Редактирование
        </h1>
      </div>

      <Card className="border-border/70 bg-card/70">
        <CardContent className="p-6">
          <TaskForm projects={projects} task={task} />
        </CardContent>
      </Card>
    </div>
  );
}
